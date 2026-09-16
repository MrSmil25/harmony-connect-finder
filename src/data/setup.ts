import { useEffect, useState } from "react";
import { curriculum, TOTAL_SKS, courseByCode } from "@/data/curriculum";

export const SECTIONS = ["A", "B", "C", "D", "E"] as const;
export type Section = (typeof SECTIONS)[number];

export const CLASS_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type ClassDay = (typeof CLASS_DAYS)[number];

export type ActiveCourseConfig = {
  code: string;
  section: Section;
  lecturer: string;
  assistant: string;
  day: ClassDay;
  start: string;
  end: string;
  room: string;
};

export type CustomCourse = {
  code: string;
  name: string;
  faculty: string;
  sks: number;
  lecturer: string;
  day: ClassDay;
  start: string;
  end: string;
  room: string;
  countsTowardGraduation: boolean;
};

export type StudentSetup = {
  name: string;
  program: string;
  programId?: string;
  faculty: string;
  university: string;
  entryYear: number;
  currentSemester: number;
  completed: string[];
  active: ActiveCourseConfig[];
  customCourses?: CustomCourse[];
  completedAt: string;
};

const STORAGE_KEY = "academic-os.setup.v1";

export function loadSetup(): StudentSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentSetup) : null;
  } catch {
    return null;
  }
}

export function persistSetup(setup: StudentSetup | null) {
  if (typeof window === "undefined") return;
  if (setup) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
  else window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Setup state backed by the personal cloud workspace.
 * Local storage stays as an instant cache and as the migration source for
 * anyone who already filled in the setup before the workspace existed.
 */
export function useSetup() {
  const [ready, setReady] = useState(false);
  const [setup, setSetupState] = useState<StudentSetup | null>(null);

  useEffect(() => {
    const local = loadSetup();
    if (local) setSetupState(local);

    let cancelled = false;
    void (async () => {
      const { loadCloudSetup, saveCloudSetup } = await import("@/data/db");
      const remote = await loadCloudSetup();
      if (cancelled) return;
      if (remote) {
        persistSetup(remote);
        setSetupState(remote);
        const { activateCurriculumForProgram } = await import("@/data/curriculum-catalog");
        await activateCurriculumForProgram(remote.programId).catch(() => {});
      } else if (local) {
        await saveCloudSetup(local);
      }
      setReady(true);
    })().catch(() => setReady(true));

    setReady(true);
    return () => {
      cancelled = true;
    };
  }, []);

  const save = (next: StudentSetup) => {
    persistSetup(next);
    setSetupState(next);
    void import("@/data/db").then((db) => db.saveCloudSetup(next)).catch(() => {});
  };
  const reset = () => {
    persistSetup(null);
    setSetupState(null);
    void import("@/data/db").then((db) => db.clearCloudSetup()).catch(() => {});
  };

  return { ready, setup, save, reset };
}

export const semesterGroups = Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => ({
  semester,
  courses: curriculum.filter((course) => course.semester === semester),
}));

export function sksOf(codes: string[]) {
  return codes.reduce((total, code) => total + (courseByCode.get(code)?.sks ?? 0), 0);
}

export function degreeProgress(codes: string[]) {
  const completedSks = sksOf(codes);
  return {
    completedSks,
    remainingSks: Math.max(TOTAL_SKS - completedSks, 0),
    percent: Math.min(Math.round((completedSks / TOTAL_SKS) * 100), 100),
    totalSks: TOTAL_SKS,
  };
}
