import type { OutfitCandidate } from "@yange/domain";

export type MissionPhase =
  | "opened"
  | "inspected"
  | "waiting-for-human"
  | "ready-to-simulate"
  | "simulated"
  | "prepared"
  | "approved"
  | "committed"
  | "blocked"
  | "cancelled"
  | "stale";

export type ToolResultStatus = "ok" | "blocked" | "declined" | "cancelled" | "stale" | "invalid" | "replayed";

export interface MissionConstraints {
  occasion: string;
  deadline: string;
  buyNothing: boolean;
  protectCare: boolean;
  weatherPreference: string;
}

export interface EvidenceGap {
  id: string;
  garmentId: string;
  garmentName: string;
  fact: "physical-availability" | "care-wash-method";
  whyItMatters: string;
  acceptedResponses: string[];
  resolved: boolean;
  resolution: string | null;
  source: "person" | null;
}

export interface MissionInspection {
  wardrobeRevision: string;
  inspectedAt: string;
  candidateGarments: Array<{
    id: string;
    name: string;
    category: string;
    state: string;
    careEvidence: "confirmed" | "needs-review" | "unknown";
  }>;
  evidenceGaps: EvidenceGap[];
  privateFieldsExcluded: string[];
}

export type PathFamily = "wear-now" | "wash-first" | "verified-fallback";
export type PathStatus = "feasible" | "blocked" | "needs-evidence";

export interface SimulatedPath {
  id: string;
  family: PathFamily;
  title: string;
  status: PathStatus;
  summary: string;
  garmentIds: string[];
  laundryGarmentIds: string[];
  reasonCodes: string[];
  evidence: string[];
  reversible: boolean;
  candidate: OutfitCandidate | null;
}

export interface PreparedPlan {
  id: string;
  operationId: string;
  pathId: string;
  digest: string;
  baseRevision: string;
  intendedMutations: string[];
  explicitNonActions: string[];
  preparedAt: string;
}

export interface MissionApproval {
  planId: string;
  digest: string;
  baseRevision: string;
  approvedAt: string;
  source: "person";
}

export interface MissionReceipt {
  id: string;
  missionId: string;
  operationId: string;
  baseRevision: string;
  finalRevision: string;
  approvedPath: PathFamily;
  evidenceUsed: string[];
  rejectedPaths: Array<{ family: PathFamily; reasonCodes: string[] }>;
  committedActions: string[];
  unchanged: string[];
  committedAt: string;
  replayed: boolean;
}

export interface MissionTimelineEntry {
  id: string;
  at: string;
  actor: "agent" | "person" | "yange";
  intent: string;
  result: ToolResultStatus;
  detail: string;
}

export interface WardrobeMission {
  version: 1;
  id: string;
  phase: MissionPhase;
  goal: string;
  constraints: MissionConstraints;
  wardrobeRevision: string;
  missionRevision: number;
  inspection: MissionInspection | null;
  paths: SimulatedPath[];
  preparedPlan: PreparedPlan | null;
  approval: MissionApproval | null;
  receipt: MissionReceipt | null;
  timeline: MissionTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface MissionError {
  status: Exclude<ToolResultStatus, "ok" | "replayed">;
  code: string;
  message: string;
  nextActions: string[];
}

export type MissionResult<T> =
  | { ok: true; status: "ok" | "replayed"; value: T; mission: WardrobeMission }
  | { ok: false; error: MissionError; mission: WardrobeMission };

export interface MissionCommitAdapter {
  planOutfit(candidate: OutfitCandidate): boolean;
  queueLaundry(garmentIds: string[]): boolean;
}
