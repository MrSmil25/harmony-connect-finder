import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyActiveCurriculum, baseCurriculum, baseStructure, type CurriculumCourse, type CurriculumGroup } from "@/data/curriculum";
import { accountingCurriculum, accountingProgram as accountingProgramInfo } from "@/data/programs-offline";

const accountingProgram: CatalogProgram = { ...accountingProgramInfo };

/**
 * Curriculum master data: programs, their versioned curriculum, course
 * categories, and prerequisites. Read from the shared catalog in the cloud,
 * with the bundled Management 2024 data as an offline fallback.
 */

export const COURSE_CATEGORIES = [
  "University Mandatory",
  "Faculty Mandatory",
  "Program Mandatory",
  "Elective",
  "Final Project",
  "Internship",
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export type CatalogProgram = {
  id: string;
  code: string;
  name: string;
  faculty: string;
  university: string;
  degree: string;
  curriculumYear: number;
  totalSks: number;
};

export type CatalogCourse = {
  code: string;
  name: string;
  sks: number;
  group: string;
  category: CourseCategory;
  track: string | null;
  semester: number;
  prereq: string[];
  note: string | null;
};

export type ProgramCurriculum = {
  program: CatalogProgram;
  courses: CatalogCourse[];
  totalSks: number;
  structure: { label: string; sks: number }[];
  semesterGroups: { semester: number; courses: CatalogCourse[] }[];
};

const CATEGORY_LABEL: Record<string, CourseCategory> = {
  MKWU: "University Mandatory",
  MKWF: "Faculty Mandatory",
  MKWP: "Program Mandatory",
  Peminatan: "Elective",
  Pilihan: "Elective",
  "Tugas Akhir": "Final Project",
};

export const fallbackProgram: CatalogProgram = {
  id: "fallback-s1-mnj-ui",
  code: "S1-MNJ-UI",
  name: "Manajemen",
  faculty: "Fakultas Ekonomi dan Bisnis",
  university: "Universitas Indonesia",
  degree: "Sarjana (S1)",
  curriculumYear: 2024,
  totalSks: 145,
};

function buildCurriculum(program: CatalogProgram, courses: CatalogCourse[]): ProgramCurriculum {
  const semesters = Array.from(new Set(courses.map((course) => course.semester))).sort((a, b) => a - b);
  const byCategory = new Map<string, number>();
  for (const course of courses) byCategory.set(course.category, (byCategory.get(course.category) ?? 0) + course.sks);

  return {
    program,
    courses,
    totalSks: program.totalSks,
    structure: COURSE_CATEGORIES.filter((category) => byCategory.has(category)).map((category) => ({
      label: category,
      sks: byCategory.get(category) ?? 0,
    })),
    semesterGroups: semesters.map((semester) => ({
      semester,
      courses: courses.filter((course) => course.semester === semester),
    })),
  };
}

function toCatalogCourses(courses: typeof baseCurriculum): CatalogCourse[] {
  return courses.map((course) => ({
    code: course.code,
    name: course.name,
    sks: course.sks,
    group: course.group,
    category: CATEGORY_LABEL[course.group] ?? "Elective",
    track: null,
    semester: course.semester,
    prereq: course.prereq,
    note: course.note ?? null,
  }));
}

const fallbackCurriculum = buildCurriculum(fallbackProgram, toCatalogCourses(baseCurriculum));
const fallbackAccountingCurriculum = buildCurriculum(accountingProgram, toCatalogCourses(accountingCurriculum));

/** Bundled programs, always selectable during onboarding. */
export const offlinePrograms: CatalogProgram[] = [fallbackProgram, accountingProgram];

const offlineCurriculumById = new Map<string, ProgramCurriculum>([
  [fallbackProgram.id, fallbackCurriculum],
  [accountingProgram.id, fallbackAccountingCurriculum],
]);

/** Course metadata seen so far, so saved data keeps names and credits. */
const courseMeta = new Map<string, { name: string; sks: number }>();
for (const curriculum of offlineCurriculumById.values())
  for (const course of curriculum.courses) courseMeta.set(course.code, { name: course.name, sks: course.sks });

export function getCourseMeta(code: string) {
  return courseMeta.get(code) ?? { name: code, sks: 0 };
}

export async function loadPrograms(): Promise<CatalogProgram[]> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, code, name, faculty, university, degree, curriculum_year, total_sks")
    .eq("is_active", true)
    .order("name");
  if (error || !data?.length) return offlinePrograms;

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    faculty: row.faculty ?? "",
    university: row.university ?? "",
    degree: row.degree ?? "Sarjana (S1)",
    curriculumYear: row.curriculum_year,
    totalSks: row.total_sks ?? 144,
  }));
}

export async function loadProgramCurriculum(program: CatalogProgram): Promise<ProgramCurriculum> {
  const offline = offlineCurriculumById.get(program.id);
  if (offline) return offline;

  const { data, error } = await supabase
    .from("curriculum_courses")
    .select("code, name, sks, course_group, category, track, semester, note, course_prerequisites(prerequisite_code)")
    .eq("program_id", program.id)
    .order("semester")
    .order("code");
  if (error || !data?.length) return fallbackCurriculum;

  const courses: CatalogCourse[] = data.map((row) => ({
    code: row.code,
    name: row.name,
    sks: row.sks,
    group: row.course_group ?? "",
    category: (row.category ?? CATEGORY_LABEL[row.course_group ?? ""] ?? "Elective") as CourseCategory,
    track: row.track ?? null,
    semester: row.semester ?? 1,
    prereq: (row.course_prerequisites ?? []).map((item) => item.prerequisite_code),
    note: row.note ?? null,
  }));
  for (const course of courses) courseMeta.set(course.code, { name: course.name, sks: course.sks });

  return buildCurriculum(program, courses);
}

/** A course unlocks once every prerequisite has been completed. */
export function courseAvailability(course: CatalogCourse, completed: string[]) {
  const missing = course.prereq.filter((code) => !completed.includes(code));
  return { status: missing.length ? ("Locked" as const) : ("Available" as const), missing };
}

export function sksTotal(codes: string[]) {
  return codes.reduce((total, code) => total + getCourseMeta(code).sks, 0);
}



/** Programs available for onboarding. */
export function usePrograms() {
  const [programs, setPrograms] = useState<CatalogProgram[]>(offlinePrograms);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPrograms()
      .then((list) => {
        if (cancelled) return;
        setPrograms(list);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return { programs, ready };
}

/** The selected program's curriculum, loaded automatically on change. */
export function useProgramCurriculum(program: CatalogProgram | null) {
  const [curriculum, setCurriculum] = useState<ProgramCurriculum>(fallbackCurriculum);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!program) return;
    let cancelled = false;
    setLoading(true);
    void loadProgramCurriculum(program)
      .then((data) => {
        if (!cancelled) setCurriculum(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [program?.id]);

  return { curriculum, loading };
}

const GROUP_BY_CATEGORY: Record<CourseCategory, CurriculumGroup> = {
  "University Mandatory": "MKWU",
  "Faculty Mandatory": "MKWF",
  "Program Mandatory": "MKWP",
  Elective: "Peminatan",
  "Final Project": "Tugas Akhir",
  Internship: "Tugas Akhir",
};

function toCurriculumCourse(course: CatalogCourse): CurriculumCourse {
  return {
    code: course.code,
    name: course.name,
    sks: course.sks,
    group: (course.group as CurriculumGroup) || GROUP_BY_CATEGORY[course.category],
    semester: course.semester,
    prereq: course.prereq,
    ...(course.note ? { note: course.note } : {}),
  };
}

/** Make the given program's curriculum the one every page reads from. */
export function activateCurriculum(data: ProgramCurriculum) {
  applyActiveCurriculum({
    courses: data.courses.map(toCurriculumCourse),
    totalSks: data.totalSks,
    structure: data.structure.length ? data.structure : baseStructure,
  });
}

/** Load and activate the curriculum belonging to a stored program id. */
export async function activateCurriculumForProgram(programId: string | null | undefined) {
  if (!programId) return;
  const programs = await loadPrograms();
  const program = programs.find((item) => item.id === programId);
  if (!program) return;
  activateCurriculum(await loadProgramCurriculum(program));
}
