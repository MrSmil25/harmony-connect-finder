import { useEffect, useRef, useState } from "react";
import { courseByCode } from "@/data/curriculum";
import type { StudentSetup } from "@/data/setup";

export const LINK_KINDS = ["Google Classroom", "Google Drive", "Google Sheets", "LMS (EMAS)", "Assistant link", "Other"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export type CourseLink = { id: number; code: string; kind: LinkKind; label: string; url: string };

export type AssistantSession = {
  id: number;
  code: string;
  section: string;
  assistant: string;
  day: string;
  start: string;
  end: string;
  room: string;
  link: string;
};

export type ArchivedSemester = {
  id: number;
  semester: number;
  academicYear: string;
  courses: string[];
  sks: number;
  gpa: number;
  resources: number;
  completedTasks: number;
  notes: string;
};

export type SemesterData = {
  links: CourseLink[];
  sessions: AssistantSession[];
  archive: ArchivedSemester[];
};

const STORAGE_KEY = "academic-os.semester.v1";
const empty: SemesterData = { links: [], sessions: [], archive: [] };

/**
 * Semester workspace state (links, assistant sessions, archive) stored in the
 * private cloud workspace, with local storage as an instant cache.
 */
export function useSemesterData() {
  const [data, setData] = useState<SemesterData>(empty);
  const uuids = useRef(new Map<number, string>());

  const cache = (next: SemesterData) => {
    setData(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore full storage */
    }
  };

  const pull = async () => {
    const db = await import("@/data/db");
    const cloud = await db.loadCloudSemesterData();
    uuids.current = new Map([
      ...cloud.links.map((item) => [item.id, item.uuid] as const),
      ...cloud.sessions.map((item) => [item.id, item.uuid] as const),
      ...cloud.archive.map((item) => [item.id, item.uuid] as const),
    ]);
    cache({
      links: cloud.links.map(({ uuid, ...rest }) => rest),
      sessions: cloud.sessions.map(({ uuid, ...rest }) => rest),
      archive: cloud.archive.map(({ uuid, ...rest }) => rest).sort((a, b) => a.semester - b.semester),
    });
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...empty, ...(JSON.parse(raw) as SemesterData) });
    } catch {
      /* ignore unreadable storage */
    }
    void pull().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = (fn: (db: typeof import("@/data/db")) => Promise<unknown>) => {
    void import("@/data/db")
      .then(async (db) => {
        await fn(db);
        await pull();
      })
      .catch(() => {});
  };

  const remove = (table: "resources" | "assistant_sessions" | "semesters", id: number) => {
    const uuid = uuids.current.get(id);
    if (uuid) push((db) => db.deleteCloudRow(table, uuid));
  };

  return {
    ...data,
    addLink: (link: Omit<CourseLink, "id">) => {
      cache({ ...data, links: [...data.links, { ...link, id: Date.now() }] });
      push((db) => db.addCloudLink(link));
    },
    removeLink: (id: number) => {
      cache({ ...data, links: data.links.filter((item) => item.id !== id) });
      remove("resources", id);
    },
    addSession: (session: Omit<AssistantSession, "id">) => {
      cache({ ...data, sessions: [...data.sessions, { ...session, id: Date.now() }] });
      push((db) => db.addCloudSession(session));
    },
    removeSession: (id: number) => {
      cache({ ...data, sessions: data.sessions.filter((item) => item.id !== id) });
      remove("assistant_sessions", id);
    },
    addArchive: (entry: Omit<ArchivedSemester, "id">) => {
      cache({ ...data, archive: [...data.archive, { ...entry, id: Date.now() }].sort((a, b) => a.semester - b.semester) });
      push((db) => db.addCloudArchive(entry));
    },
    removeArchive: (id: number) => {
      cache({ ...data, archive: data.archive.filter((item) => item.id !== id) });
      remove("semesters", id);
    },
  };
}

/** Semester 1 starts in the entry year's odd (Gasal) term; each year holds two semesters. */
export function academicYearLabel(entryYear: number, semester: number) {
  const yearOffset = Math.floor((semester - 1) / 2);
  const startYear = entryYear + yearOffset;
  const term = semester % 2 === 1 ? "Gasal" : "Genap";
  return `${term} ${startYear}/${startYear + 1}`;
}

export function courseTitle(code: string) {
  return courseByCode.get(code)?.name ?? code;
}

/** Everything the semester workspace header needs, derived from the onboarding setup. */
export function semesterSummary(setup: StudentSetup | null, activeSks: number, activeCount: number, completedSks: number, totalSks: number) {
  const semester = setup?.currentSemester ?? 1;
  return {
    semester,
    academicYear: academicYearLabel(setup?.entryYear ?? new Date().getFullYear(), semester),
    completedSks,
    totalSks,
    activeSks,
    activeCount,
  };
}
