import fs from "fs";
import path from "path";

export function readJsonFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(process.cwd(), "public", "data", filename);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export type Group = {
  rank: number;
  group: string;
  display_name?: string;
  color?: string;
  member_count?: number;
  member_names?: string;
  social_activity?: number | null;
  conversion_score?: number | null;
  temperature_index?: number | null;
  v7_index?: number | null;
  is_solo?: boolean;
};

export type Member = {
  rank: number;
  name: string;
  nickname?: string;
  group?: string;
  photo_url?: string;
  instagram?: string;
  social_activity?: number | null;
  temperature_index?: number | null;
};

export type EventItem = {
  id?: string;
  source_id?: string;
  title?: string;
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  city?: string | null;
  organizer?: string | null;
  source_url?: string | null;
};

export function getGroups(): Group[] {
  return readJsonFile<Group[]>("v7_rankings.json", [])
    .filter((g) => (g.member_count ?? 0) > 0)
    .slice(0, 50);
}

export function getMembers(): Member[] {
  return readJsonFile<Member[]>("member_rankings.json", []).slice(0, 100);
}

export function getEvents(): EventItem[] {
  return readJsonFile<EventItem[]>("events.json", []);
}
