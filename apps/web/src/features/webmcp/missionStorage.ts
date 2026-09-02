import type { WardrobeMission } from "./missionTypes";

const KEY = "yange:webmcp:mission:v1";

export interface MissionRepository {
  read(): WardrobeMission | null;
  write(mission: WardrobeMission): WardrobeMission;
  reset(): void;
}

function safeParse(value: string | null): WardrobeMission | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as WardrobeMission;
    return parsed?.version === 1 && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export const localMissionRepository: MissionRepository = {
  read: () => safeParse(localStorage.getItem(KEY)),
  write: (mission) => {
    localStorage.setItem(KEY, JSON.stringify(mission));
    return mission;
  },
  reset: () => localStorage.removeItem(KEY),
};
