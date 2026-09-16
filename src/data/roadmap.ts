import { useEffect, useMemo, useState } from "react";
import { curriculum, TOTAL_SKS, courseByCode } from "@/data/curriculum";
import type { StudentSetup } from "@/data/setup";

export type CourseStatus = "completed" | "current" | "planned" | "upcoming" | "locked";

export type CustomCourse = {
  id: number;
  name: string;
  provider: string;
  sks: number;
  semester: number;
  note: string;
};

export type RoadmapState = {
  /** User overrides on top of the statuses derived from the onboarding setup. */
  overrides: Record<string, CourseStatus>;
  custom: CustomCourse[];
};

const STORAGE_KEY = "academic-os.roadmap.v1";
const empty: RoadmapState = { overrides: {}, custom: [] };

export const statusLabel: Record<CourseStatus, string> = {
  completed: "Completed",
  current: "Currently taking",
  planned: "Planned",
  upcoming: "Upcoming",
  locked: "Locked",
};

export const statusStyle: Record<CourseStatus, string> = {
  completed: "bg-success/12 text-success",
  current: "bg-primary text-primary-foreground",
  planned: "bg-accent text-academic",
  upcoming: "bg-muted text-muted-foreground",
  locked: "bg-muted text-muted-foreground",
};

/** Statuses derived from setup, then user overrides, then prerequisite locking. */
export function resolveStatuses(setup: StudentSetup | null, overrides: Record<string, CourseStatus>) {
  const base = new Map<string, CourseStatus>();
  const completed = new Set(setup?.completed ?? []);
  const active = new Set((setup?.active ?? []).map((item) => item.code));

  for (const course of curriculum) {
    const override = overrides[course.code];
    if (completed.has(course.code)) base.set(course.code, "completed");
    else if (active.has(course.code)) base.set(course.code, "current");
    else if (override) base.set(course.code, override);
    else base.set(course.code, "upcoming");
  }

  const resolved = new Map<string, CourseStatus>();
  for (const course of curriculum) {
    const status = base.get(course.code) ?? "upcoming";
    const blocked = course.prereq.some((code) => base.get(code) !== "completed");
    resolved.set(course.code, status === "upcoming" && blocked ? "locked" : status);
  }
  return resolved;
}

export function missingPrereqs(code: string, statuses: Map<string, CourseStatus>) {
  const course = courseByCode.get(code);
  if (!course) return [];
  return course.prereq.filter((prereq) => statuses.get(prereq) !== "completed");
}

/** Courses that are unlocked and belong to the next semester or earlier. */
export function recommendNextSemester(setup: StudentSetup | null, statuses: Map<string, CourseStatus>) {
  const next = (setup?.currentSemester ?? 1) + 1;
  return curriculum
    .filter((course) => {
      const status = statuses.get(course.code);
      if (status === "completed" || status === "current" || status === "locked") return false;
      return course.semester <= next;
    })
    .sort((a, b) => a.semester - b.semester || b.sks - a.sks)
    .slice(0, 8);
}

export function graduationTracker(statuses: Map<string, CourseStatus>) {
  const completedSks = curriculum
    .filter((course) => statuses.get(course.code) === "completed")
    .reduce((sum, course) => sum + course.sks, 0);
  const currentSks = curriculum
    .filter((course) => statuses.get(course.code) === "current")
    .reduce((sum, course) => sum + course.sks, 0);
  return {
    completedSks,
    currentSks,
    requiredSks: TOTAL_SKS,
    remainingSks: Math.max(TOTAL_SKS - completedSks, 0),
    percent: Math.min(Math.round((completedSks / TOTAL_SKS) * 100), 100),
  };
}

/** Client-only roadmap state: status overrides and courses outside the curriculum. */
export function useRoadmap(setup: StudentSetup | null) {
  const [state, setState] = useState<RoadmapState>(empty);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...empty, ...(JSON.parse(raw) as RoadmapState) });
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const write = (next: RoadmapState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore full storage */
    }
  };

  const statuses = useMemo(() => resolveStatuses(setup, state.overrides), [setup, state.overrides]);

  return {
    statuses,
    custom: state.custom,
    tracker: graduationTracker(statuses),
    setStatus: (code: string, status: CourseStatus) => {
      const overrides = { ...state.overrides };
      if (status === "upcoming") delete overrides[code];
      else overrides[code] = status;
      write({ ...state, overrides });
    },
    addCustom: (course: Omit<CustomCourse, "id">) => write({ ...state, custom: [...state.custom, { ...course, id: Date.now() }] }),
    removeCustom: (id: number) => write({ ...state, custom: state.custom.filter((item) => item.id !== id) }),
  };
}
