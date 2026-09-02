import { useEffect, useMemo, useRef, useState } from "react";
import type { DomainEvent, LookDna, OutfitCandidate, TwinState } from "@yange/domain";
import {
  approvePlan,
  beginEvidenceRequest,
  commitApprovedPlan,
  inspectMission,
  openMission,
  preparePlan,
  resolveEvidence,
  simulatePaths,
  updateConstraints,
  wardrobeRevision,
} from "./missionDomain";
import { localMissionRepository } from "./missionStorage";
import { registerYangeTools, toolNamesForPhase, type YangeToolHandlers, type YangeToolName } from "./registerYangeTools";
import type { EvidenceGap, MissionConstraints, MissionResult, WardrobeMission } from "./missionTypes";
import { parseWebInspiration, type WebInspirationReference } from "./webInspiration";

export type WebMcpConnectionState = "unsupported" | "available" | "registered" | "in-use";

export interface PendingEvidenceInteraction {
  gap: EvidenceGap;
  startedAt: string;
}

interface PendingResolver {
  gapId: string;
  resolve(value: Record<string, unknown>): void;
  settled: boolean;
}

interface PendingInspirationResolver {
  id: string;
  resolve(value: Record<string, unknown>): void;
  settled: boolean;
}

export interface YangeWebMcpBridge {
  mission: WardrobeMission;
  connection: WebMcpConnectionState;
  registeredTools: YangeToolName[];
  pendingEvidence: PendingEvidenceInteraction | null;
  pendingInspiration: WebInspirationReference | null;
  prompt: string;
  resetMission(): void;
  inspect(): void;
  requestEvidence(): void;
  answerEvidence(response: string | null): void;
  completeInspiration(look: LookDna): void;
  declineInspiration(reason?: string): void;
  simulate(): void;
  prepare(pathId: string): void;
  approve(): void;
  commit(): void;
  changeConstraints(constraints: Partial<MissionConstraints>): void;
}

function output<T>(result: MissionResult<T>): Record<string, unknown> {
  if (result.ok) return { ok: true, status: result.status, value: result.value, phase: result.mission.phase };
  return { ok: false, status: result.error.status, code: result.error.code, message: result.error.message, nextActions: result.error.nextActions, phase: result.mission.phase };
}

export function useYangeWebMcp(
  state: TwinState,
  ledger: DomainEvent[],
  actions: { planCandidate(candidate: OutfitCandidate): boolean; queueLaundry(garmentIds: string[]): boolean },
): YangeWebMcpBridge {
  const initial = useMemo(() => localMissionRepository.read() ?? openMission(wardrobeRevision(ledger)), []);
  const [mission, setMissionState] = useState<WardrobeMission>(initial);
  const [connection, setConnection] = useState<WebMcpConnectionState>(() => document.modelContext ? "available" : "unsupported");
  const [registeredTools, setRegisteredTools] = useState<YangeToolName[]>([]);
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidenceInteraction | null>(null);
  const [pendingInspiration, setPendingInspiration] = useState<WebInspirationReference | null>(null);
  const missionRef = useRef(mission);
  const stateRef = useRef(state);
  const ledgerRef = useRef(ledger);
  const actionsRef = useRef(actions);
  const pendingRef = useRef<PendingResolver | null>(null);
  const inspirationRef = useRef<PendingInspirationResolver | null>(null);
  stateRef.current = state;
  ledgerRef.current = ledger;
  actionsRef.current = actions;

  function setMission(next: WardrobeMission): WardrobeMission {
    missionRef.current = next;
    localMissionRepository.write(next);
    setMissionState(next);
    return next;
  }

  function apply<T>(result: MissionResult<T>): MissionResult<T> {
    setMission(result.mission);
    return result;
  }

  function runInspect() {
    return apply(inspectMission(missionRef.current, stateRef.current, ledgerRef.current));
  }

  function runSimulate() {
    return apply(simulatePaths(missionRef.current, stateRef.current));
  }

  function runPrepare(pathId: string) {
    return apply(preparePlan(missionRef.current, pathId));
  }

  function runCommit() {
    return apply(commitApprovedPlan(missionRef.current, wardrobeRevision(ledgerRef.current), {
      planOutfit: (candidate) => actionsRef.current.planCandidate(candidate),
      queueLaundry: (garmentIds) => actionsRef.current.queueLaundry(garmentIds),
    }));
  }

  function settlePending(response: string | null) {
    const pending = pendingRef.current;
    if (!pending || pending.settled) return;
    pending.settled = true;
    const result = resolveEvidence(missionRef.current, pending.gapId, response);
    // Persist the answer immediately, but let the executing WebMCP call cross
    // Chrome's boundary before React rotates the phase-scoped registrations.
    // Aborting the old registration in the same turn makes Chrome reject an
    // otherwise successful human handoff as a transient tool failure.
    missionRef.current = result.mission;
    localMissionRepository.write(result.mission);
    setPendingEvidence(null);
    pendingRef.current = null;
    pending.resolve(output(result));
    window.setTimeout(() => setMissionState(result.mission), 0);
  }

  const handlers = useMemo<YangeToolHandlers>(() => ({
    importInspiration: async (input, signal) => {
      if (signal.aborted) return { ok: false, status: "cancelled" };
      setConnection("in-use");
      if (inspirationRef.current) return { ok: false, status: "blocked", code: "INSPIRATION_REVIEW_PENDING" };
      let reference: WebInspirationReference;
      try {
        reference = parseWebInspiration(input);
      } catch (cause) {
        return { ok: false, status: "invalid-input", code: "UNSAFE_INSPIRATION_REFERENCE", message: cause instanceof Error ? cause.message : "The inspiration reference is invalid." };
      }
      setPendingInspiration(reference);
      return await new Promise<Record<string, unknown>>((resolve) => {
        const pending: PendingInspirationResolver = { id: reference.id, resolve, settled: false };
        inspirationRef.current = pending;
        const cancel = () => {
          if (pending.settled) return;
          pending.settled = true;
          inspirationRef.current = null;
          setPendingInspiration(null);
          resolve({ ok: false, status: "cancelled", code: "EXECUTION_CANCELLED" });
        };
        signal.addEventListener("abort", cancel, { once: true });
      });
    },
    open: async (input, signal) => {
      if (signal.aborted) return { ok: false, status: "cancelled" };
      setConnection("in-use");
      const next = openMission(wardrobeRevision(ledgerRef.current), typeof input.goal === "string" ? input.goal : undefined, {
        occasion: typeof input.occasion === "string" ? input.occasion : undefined,
        deadline: typeof input.deadline === "string" ? input.deadline : undefined,
      });
      setMission(next);
      return { ok: true, missionId: next.id, revision: next.wardrobeRevision, nextActions: ["inspect_mission_readiness"] };
    },
    inspect: async (_input, signal) => {
      if (signal.aborted) return { ok: false, status: "cancelled" };
      setConnection("in-use");
      return output(runInspect());
    },
    requestEvidence: async (input, signal) => {
      if (signal.aborted) return { ok: false, status: "cancelled" };
      setConnection("in-use");
      if (pendingRef.current) return { ok: false, status: "blocked", code: "HUMAN_RESPONSE_PENDING" };
      const gapId = String(input.gapId ?? "");
      const begun = apply(beginEvidenceRequest(missionRef.current, gapId));
      if (!begun.ok) return output(begun);
      setPendingEvidence({ gap: begun.value, startedAt: new Date().toISOString() });
      return await new Promise<Record<string, unknown>>((resolve) => {
        const pending: PendingResolver = { gapId, resolve, settled: false };
        pendingRef.current = pending;
        const cancel = () => {
          if (pending.settled) return;
          pending.settled = true;
          pendingRef.current = null;
          setPendingEvidence(null);
          resolve({ ok: false, status: "cancelled", code: "EXECUTION_CANCELLED", phase: missionRef.current.phase });
        };
        signal.addEventListener("abort", cancel, { once: true });
      });
    },
    simulate: async (_input, signal) => signal.aborted ? { ok: false, status: "cancelled" } : output(runSimulate()),
    prepare: async (input, signal) => signal.aborted ? { ok: false, status: "cancelled" } : output(runPrepare(String(input.pathId ?? ""))),
    commit: async (_input, signal) => signal.aborted ? { ok: false, status: "cancelled" } : output(runCommit()),
    receipt: async () => ({
      ok: true,
      phase: missionRef.current.phase,
      missionId: missionRef.current.id,
      revision: missionRef.current.wardrobeRevision,
      receipt: missionRef.current.receipt,
      timeline: missionRef.current.timeline.slice(-6),
    }),
  }), []);

  const toolsKey = toolNamesForPhase(mission.phase).join("|");
  useEffect(() => {
    if (!document.modelContext) {
      setConnection("unsupported");
      setRegisteredTools([]);
      return;
    }
    const registration = registerYangeTools(document.modelContext, missionRef.current.phase, handlers);
    setRegisteredTools(registration.names);
    setConnection((current) => current === "in-use" ? "in-use" : "registered");
    return registration.dispose;
  }, [handlers, toolsKey]);

  useEffect(() => () => {
    const pending = pendingRef.current;
    if (pending && !pending.settled) {
      pending.settled = true;
      pending.resolve({ ok: false, status: "cancelled", code: "PAGE_UNMOUNTED" });
    }
    const inspiration = inspirationRef.current;
    if (inspiration && !inspiration.settled) {
      inspiration.settled = true;
      inspiration.resolve({ ok: false, status: "cancelled", code: "PAGE_UNMOUNTED" });
    }
  }, []);

  return {
    mission,
    connection,
    registeredTools,
    pendingEvidence,
    pendingInspiration,
    prompt: mission.goal,
    resetMission: () => {
      localMissionRepository.reset();
      setPendingEvidence(null);
      pendingRef.current = null;
      setMission(openMission(wardrobeRevision(ledgerRef.current)));
    },
    inspect: () => { runInspect(); },
    requestEvidence: () => {
      const gap = missionRef.current.inspection?.evidenceGaps.find((entry) => !entry.resolved);
      if (!gap) return;
      const begun = apply(beginEvidenceRequest(missionRef.current, gap.id));
      if (begun.ok) setPendingEvidence({ gap: begun.value, startedAt: new Date().toISOString() });
    },
    answerEvidence: (response) => {
      if (pendingRef.current) settlePending(response);
      else if (pendingEvidence) {
        apply(resolveEvidence(missionRef.current, pendingEvidence.gap.id, response));
        setPendingEvidence(null);
      }
    },
    completeInspiration: (look) => {
      const pending = inspirationRef.current;
      if (!pending || pending.settled) return;
      pending.settled = true;
      inspirationRef.current = null;
      setPendingInspiration(null);
      pending.resolve({
        ok: true,
        status: "saved",
        lookId: look.id,
        lookName: look.name,
        provenance: look.provenance,
        nextActions: ["open_wardrobe_mission", "inspect_mission_readiness"],
      });
    },
    declineInspiration: (reason = "The person declined this inspiration.") => {
      const pending = inspirationRef.current;
      if (!pending || pending.settled) return;
      pending.settled = true;
      inspirationRef.current = null;
      setPendingInspiration(null);
      pending.resolve({ ok: false, status: "declined", code: "HUMAN_DECLINED", message: reason });
    },
    simulate: () => { runSimulate(); },
    prepare: (pathId) => { runPrepare(pathId); },
    approve: () => { apply(approvePlan(missionRef.current)); },
    commit: () => { runCommit(); },
    changeConstraints: (constraints) => { setMission(updateConstraints(missionRef.current, constraints)); },
  };
}
