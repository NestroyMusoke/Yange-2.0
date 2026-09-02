import {
  generateOutfitCandidates,
  type DomainEvent,
  type Garment,
  type PlanningContext,
  type TwinState,
} from "@yange/domain";
import type {
  EvidenceGap,
  MissionCommitAdapter,
  MissionConstraints,
  MissionReceipt,
  MissionResult,
  MissionTimelineEntry,
  PathFamily,
  PreparedPlan,
  SimulatedPath,
  WardrobeMission,
} from "./missionTypes";

const defaultConstraints: MissionConstraints = {
  occasion: "Friday plans",
  deadline: "Friday · 7:00 PM",
  buyNothing: true,
  protectCare: true,
  weatherPreference: "Comfortable through changing Kampala weather",
};

function now(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function wardrobeRevision(ledger: DomainEvent[]): string {
  const last = ledger.at(-1);
  return `wardrobe:${ledger.length}:${last?.id ?? "seed"}`;
}

export function missionRevision(mission: WardrobeMission): string {
  return `${mission.wardrobeRevision}:mission:${mission.missionRevision}`;
}

function append(
  mission: WardrobeMission,
  actor: MissionTimelineEntry["actor"],
  intent: string,
  result: MissionTimelineEntry["result"],
  detail: string,
): WardrobeMission {
  const at = now();
  return {
    ...mission,
    updatedAt: at,
    timeline: [...mission.timeline, { id: uid("step"), at, actor, intent, result, detail }],
  };
}

function fail<T>(mission: WardrobeMission, code: string, message: string, nextActions: string[] = []): MissionResult<T> {
  return { ok: false, error: { status: code === "STALE_PLAN" ? "stale" : "invalid", code, message, nextActions }, mission };
}

export function openMission(
  wardrobeRev: string,
  goal = "Help me wear this inspiration look on Friday without buying anything or ruining my clothes.",
  constraints: Partial<MissionConstraints> = {},
): WardrobeMission {
  const at = now();
  const mission: WardrobeMission = {
    version: 1,
    id: uid("mission"),
    phase: "opened",
    goal,
    constraints: { ...defaultConstraints, ...constraints },
    wardrobeRevision: wardrobeRev,
    missionRevision: 0,
    inspection: null,
    paths: [],
    preparedPlan: null,
    approval: null,
    receipt: null,
    timeline: [],
    createdAt: at,
    updatedAt: at,
  };
  return append(mission, "person", "Open wardrobe mission", "ok", goal);
}

function careEvidence(garment: Garment): "confirmed" | "needs-review" | "unknown" {
  if (garment.careProfile.wash.value === "unknown") return "unknown";
  return garment.careProfile.wash.reviewStatus === "confirmed" ? "confirmed" : "needs-review";
}

function planningDeadline(value: string): string {
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return new Date(direct).toISOString();

  const weekday = value.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*[·,\-]?\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (weekday) {
    const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = names.indexOf(weekday[1].toLowerCase());
    const minute = Number(weekday[3] ?? "0");
    const period = weekday[4].toUpperCase();
    const twelveHour = Number(weekday[2]) % 12;
    const hour = twelveHour + (period === "PM" ? 12 : 0);
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    let daysAhead = (targetDay - target.getDay() + 7) % 7;
    if (daysAhead === 0 && target.getTime() <= Date.now()) daysAhead = 7;
    target.setDate(target.getDate() + daysAhead);
    return target.toISOString();
  }

  // Keep the domain timestamp valid even if a browser agent supplies a label
  // the platform cannot parse. The original label remains visible for review.
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function contextFor(state: TwinState, mission: WardrobeMission): PlanningContext {
  const inspirationLookId = Object.keys(state.inspirationLooks)[0] ?? null;
  return {
    version: 1,
    weather: {
      source: "mission-context",
      location: state.userProfile.locationLabel,
      observedAt: now(),
      temperatureC: 24,
      precipitationProbability: 45,
      condition: "showers",
    },
    calendar: {
      source: "person-confirmed-mission",
      eventId: mission.id,
      title: mission.constraints.occasion,
      startsAt: planningDeadline(mission.constraints.deadline),
      occasion: "casual",
      dressCode: "smart-casual",
      notes: mission.constraints.weatherPreference,
    },
    inspirationLookId,
  };
}

export function inspectMission(
  mission: WardrobeMission,
  state: TwinState,
  ledger: DomainEvent[],
): MissionResult<WardrobeMission["inspection"]> {
  if (!["opened", "inspected", "ready-to-simulate", "waiting-for-human"].includes(mission.phase)) {
    return fail(mission, "WRONG_PHASE", "This mission is not ready for inspection.", ["get_mission_receipt"]);
  }
  const currentWardrobeRevision = wardrobeRevision(ledger);
  const candidates = generateOutfitCandidates(state, contextFor(state, mission), 3);
  const candidateGarments = [...new Set(candidates.flatMap((candidate) => candidate.garmentIds))]
    .map((id) => state.garments[id])
    .filter((garment): garment is Garment => Boolean(garment))
    .map((garment) => ({
      id: garment.id,
      name: garment.name,
      category: garment.category,
      state: garment.state,
      careEvidence: careEvidence(garment),
    }));
  const existing = mission.inspection?.evidenceGaps ?? [];
  const clothingCategories = new Set(["top", "bottom", "outerwear"]);
  const unresolvedCare = candidateGarments.find(
    (garment) => clothingCategories.has(garment.category) && garment.careEvidence !== "confirmed",
  );
  const firstClothing = candidateGarments.find((garment) => ["top", "bottom", "outerwear"].includes(garment.category));
  const target = unresolvedCare ?? firstClothing;
  const fact: EvidenceGap["fact"] = unresolvedCare ? "care-wash-method" : "physical-availability";
  const prior = target ? existing.find((gap) => gap.garmentId === target.id && gap.fact === fact) : undefined;
  const gaps: EvidenceGap[] = target
    ? [{
        id: prior?.id ?? `gap-${target.id}-${fact}`,
        garmentId: target.id,
        garmentName: target.name,
        fact,
        whyItMatters: fact === "care-wash-method"
          ? "Yange will not recommend washing without confirmed care evidence."
          : "A browser can read the wardrobe twin, but only you can confirm the garment is physically here.",
        acceptedResponses: fact === "care-wash-method" ? ["machine-cold", "machine-warm", "hand-wash", "dry-clean", "unknown"] : ["available", "not-available"],
        resolved: prior?.resolved ?? false,
        resolution: prior?.resolution ?? null,
        source: prior?.source ?? null,
      }]
    : [];
  const inspection = {
    wardrobeRevision: currentWardrobeRevision,
    inspectedAt: now(),
    candidateGarments,
    evidenceGaps: gaps,
    privateFieldsExcluded: ["imageAssetId", "careLabelAssetId", "raw event ledger", "private media"],
  };
  const nextPhase = gaps.some((gap) => !gap.resolved) ? "inspected" as const : "ready-to-simulate" as const;
  let next: WardrobeMission = { ...mission, wardrobeRevision: currentWardrobeRevision, inspection, phase: nextPhase };
  next = append(next, "agent", "Inspect mission readiness", "ok", `${candidateGarments.length} relevant garments; ${gaps.filter((gap) => !gap.resolved).length} evidence gap.`);
  return { ok: true, status: "ok", value: inspection, mission: next };
}

export function beginEvidenceRequest(mission: WardrobeMission, gapId: string): MissionResult<EvidenceGap> {
  const gap = mission.inspection?.evidenceGaps.find((entry) => entry.id === gapId && !entry.resolved);
  if (!gap) return fail(mission, "UNKNOWN_GAP", "That evidence request is not part of the current inspection.", ["inspect_mission_readiness"]);
  let next: WardrobeMission = { ...mission, phase: "waiting-for-human" };
  next = append(next, "agent", "Request physical evidence", "ok", `${gap.garmentName}: ${gap.whyItMatters}`);
  return { ok: true, status: "ok", value: gap, mission: next };
}

export function resolveEvidence(
  mission: WardrobeMission,
  gapId: string,
  response: string | null,
): MissionResult<EvidenceGap> {
  const gap = mission.inspection?.evidenceGaps.find((entry) => entry.id === gapId && !entry.resolved);
  if (!gap) return fail(mission, "STALE_EVIDENCE_REQUEST", "This evidence request is no longer current.", ["inspect_mission_readiness"]);
  if (response === null) {
    const declined = append({ ...mission, phase: "blocked" }, "person", "Decline evidence request", "declined", `${gap.garmentName} remains unverified.`);
    return { ok: false, error: { status: "declined", code: "EVIDENCE_DECLINED", message: "The person declined this evidence request.", nextActions: ["inspect_mission_readiness"] }, mission: declined };
  }
  if (!gap.acceptedResponses.includes(response)) return fail(mission, "INVALID_EVIDENCE", "That response is not valid for this evidence request.");
  const resolvedGap = { ...gap, resolved: true, resolution: response, source: "person" as const };
  const inspection = {
    ...mission.inspection!,
    evidenceGaps: mission.inspection!.evidenceGaps.map((entry) => entry.id === gapId ? resolvedGap : entry),
  };
  let next: WardrobeMission = { ...mission, inspection, missionRevision: mission.missionRevision + 1, phase: "ready-to-simulate" };
  next = append(next, "person", "Confirm physical evidence", "ok", `${gap.garmentName}: ${response}`);
  return { ok: true, status: "ok", value: resolvedGap, mission: next };
}

function path(
  mission: WardrobeMission,
  family: PathFamily,
  candidate: ReturnType<typeof generateOutfitCandidates>[number] | null,
  status: SimulatedPath["status"],
  summary: string,
  reasonCodes: string[],
  laundryGarmentIds: string[] = [],
): SimulatedPath {
  return {
    id: `path-${family}-${stableHash(`${mission.id}:${missionRevision(mission)}:${candidate?.id ?? "none"}`)}`,
    family,
    title: family === "wear-now" ? "Wear what is ready" : family === "wash-first" ? "Wash first, then wear" : "Use a verified fallback",
    status,
    summary,
    garmentIds: candidate?.garmentIds ?? [],
    laundryGarmentIds,
    reasonCodes,
    evidence: [mission.wardrobeRevision, ...mission.inspection!.evidenceGaps.filter((gap) => gap.resolved).map((gap) => `${gap.garmentId}:${gap.fact}:${gap.resolution}`)],
    reversible: true,
    candidate: candidate ?? null,
  };
}

export function simulatePaths(mission: WardrobeMission, state: TwinState): MissionResult<SimulatedPath[]> {
  if (mission.phase !== "ready-to-simulate" && mission.phase !== "simulated") {
    return fail(mission, "EVIDENCE_REQUIRED", "Resolve the current evidence gap before simulation.", ["request_missing_evidence"]);
  }
  const candidates = generateOutfitCandidates(state, contextFor(state, mission), 3);
  const primary = candidates[0] ?? null;
  const fallback = candidates[1] ?? primary;
  const careBlocked = primary?.garmentIds
    .map((id) => state.garments[id])
    .filter((garment) => garment && ["top", "bottom", "outerwear"].includes(garment.category))
    .some((garment) => garment.careProfile.wash.value === "unknown" || garment.careProfile.wash.reviewStatus !== "confirmed") ?? true;
  const paths: SimulatedPath[] = [
    path(mission, "wear-now", primary, primary ? "feasible" : "blocked", primary ? "Use the strongest currently available wardrobe match." : "No complete available outfit exists.", primary ? [] : ["NO_COMPLETE_OUTFIT"]),
    path(
      mission,
      "wash-first",
      primary,
      !primary ? "blocked" : "needs-evidence",
      !primary
        ? "No complete outfit can be prepared."
        : careBlocked
          ? "Care evidence is incomplete for at least one clothing piece."
          : "Care is compatible, but a fresh drying window must be verified by WearCast before this can become a committable path.",
      !primary ? ["NO_COMPLETE_OUTFIT"] : careBlocked ? ["CARE_EVIDENCE_INCOMPLETE"] : ["DRYING_WINDOW_NOT_VERIFIED"],
    ),
    path(mission, "verified-fallback", fallback, fallback ? "feasible" : "blocked", fallback ? "Reserve the next verified outfit without buying anything." : "No independent fallback is available.", fallback ? [] : ["NO_VERIFIED_FALLBACK"]),
  ];
  let next: WardrobeMission = { ...mission, phase: "simulated", paths, preparedPlan: null, approval: null };
  next = append(next, "agent", "Compare safe paths", "ok", `${paths.filter((entry) => entry.status === "feasible").length} of 3 paths are feasible.`);
  return { ok: true, status: "ok", value: paths, mission: next };
}

export function preparePlan(mission: WardrobeMission, pathId: string): MissionResult<PreparedPlan> {
  if (mission.phase !== "simulated") return fail(mission, "SIMULATION_REQUIRED", "Compare current paths before preparing a plan.", ["simulate_plan_paths"]);
  const selected = mission.paths.find((entry) => entry.id === pathId && entry.status === "feasible" && entry.candidate);
  if (!selected) return fail(mission, "PATH_NOT_FEASIBLE", "Only a feasible path from the current simulation can be prepared.");
  const baseRevision = missionRevision(mission);
  const operationId = uid("mission-commit");
  const digest = stableHash(JSON.stringify({ missionId: mission.id, baseRevision, pathId, candidateId: selected.candidate!.id, laundry: selected.laundryGarmentIds }));
  const preparedPlan: PreparedPlan = {
    id: uid("plan"), operationId, pathId, digest, baseRevision,
    intendedMutations: [
      `Reserve outfit: ${selected.candidate!.name}`,
      ...(selected.laundryGarmentIds.length ? [`Queue ${selected.laundryGarmentIds.length} garment(s) for their confirmed laundry route`] : []),
    ],
    explicitNonActions: ["No purchase", "No garment fact rewritten by the agent", "No raw photo shared through WebMCP"],
    preparedAt: now(),
  };
  let next: WardrobeMission = { ...mission, phase: "prepared", preparedPlan, approval: null };
  next = append(next, "agent", "Prepare shared plan", "ok", `${selected.title} is ready for your approval.`);
  return { ok: true, status: "ok", value: preparedPlan, mission: next };
}

export function approvePlan(mission: WardrobeMission): MissionResult<WardrobeMission["approval"]> {
  if (mission.phase !== "prepared" || !mission.preparedPlan) return fail(mission, "PLAN_REQUIRED", "There is no current prepared plan to approve.", ["prepare_shared_plan"]);
  const approval = { planId: mission.preparedPlan.id, digest: mission.preparedPlan.digest, baseRevision: mission.preparedPlan.baseRevision, approvedAt: now(), source: "person" as const };
  let next: WardrobeMission = { ...mission, phase: "approved", approval };
  next = append(next, "person", "Approve prepared plan", "ok", "Approval is bound to this exact plan and revision.");
  return { ok: true, status: "ok", value: approval, mission: next };
}

export function updateConstraints(mission: WardrobeMission, constraints: Partial<MissionConstraints>): WardrobeMission {
  let next: WardrobeMission = { ...mission, constraints: { ...mission.constraints, ...constraints }, missionRevision: mission.missionRevision + 1, phase: "stale", approval: null };
  next = append(next, "person", "Change mission constraint", "stale", "Previous simulations and approval were invalidated.");
  return next;
}

export function commitApprovedPlan(
  mission: WardrobeMission,
  currentWardrobeRevision: string,
  adapter: MissionCommitAdapter,
): MissionResult<MissionReceipt> {
  if (mission.receipt) return { ok: true, status: "replayed", value: { ...mission.receipt, replayed: true }, mission };
  if (mission.phase !== "approved" || !mission.preparedPlan || !mission.approval) return fail(mission, "APPROVAL_REQUIRED", "The person must approve the visible prepared plan before commit.", ["prepare_shared_plan"]);
  const currentMissionRevision = missionRevision({ ...mission, wardrobeRevision: currentWardrobeRevision });
  if (mission.preparedPlan.baseRevision !== currentMissionRevision || mission.approval.baseRevision !== currentMissionRevision || mission.approval.digest !== mission.preparedPlan.digest) {
    const stale = append({ ...mission, phase: "stale", approval: null }, "yange", "Validate prepared plan", "stale", "Wardrobe or mission state changed; prepare again.");
    return fail(stale, "STALE_PLAN", "The approved plan no longer matches current Yange state.", ["inspect_mission_readiness"]);
  }
  const selected = mission.paths.find((entry) => entry.id === mission.preparedPlan!.pathId);
  if (!selected?.candidate || selected.status !== "feasible") return fail(mission, "PATH_NOT_FEASIBLE", "The approved path is no longer feasible.");
  if (selected.laundryGarmentIds.length && !adapter.queueLaundry(selected.laundryGarmentIds)) return fail(mission, "DOMAIN_REJECTED", "Yange rejected the laundry action; nothing was reported as committed.");
  if (!adapter.planOutfit(selected.candidate)) return fail(mission, "DOMAIN_REJECTED", "Yange rejected the outfit reservation; no success receipt was created.");
  const committedAt = now();
  const receipt: MissionReceipt = {
    id: uid("receipt"), missionId: mission.id, operationId: mission.preparedPlan.operationId,
    baseRevision: mission.preparedPlan.baseRevision, finalRevision: `${currentWardrobeRevision}:operation:${mission.preparedPlan.operationId}`,
    approvedPath: selected.family,
    evidenceUsed: selected.evidence,
    rejectedPaths: mission.paths.filter((entry) => entry.id !== selected.id).map((entry) => ({ family: entry.family, reasonCodes: entry.reasonCodes })),
    committedActions: mission.preparedPlan.intendedMutations,
    unchanged: mission.preparedPlan.explicitNonActions,
    committedAt, replayed: false,
  };
  let next: WardrobeMission = { ...mission, phase: "committed", receipt };
  next = append(next, "yange", "Commit approved plan", "ok", "One approved plan was committed through Yange's existing domain commands.");
  return { ok: true, status: "ok", value: receipt, mission: next };
}
