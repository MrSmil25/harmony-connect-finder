import { supabase } from "@/integrations/supabase/client";
import { ensureStudentRecord, ensureWorkspaceSession, invalidateStudentRecord } from "@/lib/workspace-session";
import { getCourseMeta } from "@/data/curriculum-catalog";
import type { ActiveCourseConfig, ClassDay, CustomCourse, Section, StudentSetup } from "@/data/setup";
import type { ArchivedSemester, AssistantSession, CourseLink, LinkKind } from "@/data/semester";

/**
 * Cloud persistence for the personal academic workspace.
 * Every read and write is scoped to the current anonymous account by RLS.
 */

/* ------------------------------ setup / profile ----------------------------- */

export async function loadCloudSetup(): Promise<StudentSetup | null> {
  const student = await ensureStudentRecord();
  if (!student || !student.onboarding_completed_at) return null;

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("id, course_code, status, lecturer, course_sections(section, assistant, room), schedules(day, start_time, end_time, room)")
    .order("created_at", { ascending: true });

  const rows = enrollments ?? [];
  const completed = rows.filter((row) => row.status === "completed").map((row) => row.course_code);
  const active: ActiveCourseConfig[] = rows
    .filter((row) => row.status === "active")
    .map((row) => {
      const section = row.course_sections?.[0];
      const schedule = row.schedules?.[0];
      return {
        code: row.course_code,
        section: (section?.section ?? "A") as Section,
        lecturer: row.lecturer ?? "",
        assistant: section?.assistant ?? "",
        day: (schedule?.day ?? "Monday") as ClassDay,
        start: schedule?.start_time ?? "08:00",
        end: schedule?.end_time ?? "10:00",
        room: schedule?.room ?? section?.room ?? "",
      };
    });

  const { data: extras } = await supabase.from("custom_courses").select("*").order("created_at");
  const customCourses: CustomCourse[] = (extras ?? []).map((row) => ({
    code: row.code,
    name: row.name,
    faculty: row.faculty ?? "",
    sks: row.sks,
    lecturer: row.lecturer ?? "",
    day: (row.day ?? "Monday") as ClassDay,
    start: row.start_time ?? "08:00",
    end: row.end_time ?? "10:00",
    room: row.room ?? "",
    countsTowardGraduation: row.counts_toward_graduation ?? true,
  }));

  return {
    name: student.name,
    program: student.program,
    ...(student.program_id ? { programId: student.program_id } : {}),
    faculty: student.faculty,
    university: student.university,
    entryYear: student.entry_year,
    currentSemester: student.current_semester,
    completed,
    active,
    customCourses,
    completedAt: student.onboarding_completed_at,
  };
}

export async function saveCloudSetup(setup: StudentSetup): Promise<void> {
  const userId = await ensureWorkspaceSession();
  const student = await ensureStudentRecord();
  if (!userId || !student) return;

  await supabase
    .from("students")
    .update({
      name: setup.name,
      program: setup.program,
      ...(setup.programId ? { program_id: setup.programId } : {}),
      faculty: setup.faculty,
      university: setup.university,
      entry_year: setup.entryYear,
      current_semester: setup.currentSemester,
      onboarding_completed_at: setup.completedAt,
    })
    .eq("id", student.id);
  invalidateStudentRecord();

  const semesterId = await ensureSemester(setup.currentSemester);

  // Enrollments are rewritten as a whole so the cloud mirrors the setup exactly.
  await supabase.from("course_enrollments").delete().eq("user_id", userId);

  const completedRows = setup.completed.map((code) => ({
    user_id: userId,
    course_code: code,
    course_name: getCourseMeta(code).name,
    sks: getCourseMeta(code).sks,
    status: "completed",
  }));
  if (completedRows.length) await supabase.from("course_enrollments").insert(completedRows);

  for (const course of setup.active) {
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .insert({
        user_id: userId,
        semester_id: semesterId,
        course_code: course.code,
        course_name: getCourseMeta(course.code).name,
        sks: getCourseMeta(course.code).sks,
        status: "active",
        lecturer: course.lecturer,
      })
      .select("id")
      .maybeSingle();
    if (!enrollment) continue;

    const { data: section } = await supabase
      .from("course_sections")
      .insert({
        user_id: userId,
        enrollment_id: enrollment.id,
        section: course.section,
        lecturer: course.lecturer,
        assistant: course.assistant,
        room: course.room,
      })
      .select("id")
      .maybeSingle();

    await supabase.from("schedules").insert({
      user_id: userId,
      enrollment_id: enrollment.id,
      section_id: section?.id ?? null,
      day: course.day,
      start_time: course.start,
      end_time: course.end,
      room: course.room,
    });
  }

  // Custom (non-curriculum) courses mirror the setup exactly too.
  await supabase.from("custom_courses").delete().eq("user_id", userId);
  const extras = setup.customCourses ?? [];
  if (extras.length) {
    await supabase.from("custom_courses").insert(
      extras.map((course) => ({
        user_id: userId,
        code: course.code,
        name: course.name,
        faculty: course.faculty,
        sks: course.sks,
        lecturer: course.lecturer,
        day: course.day,
        start_time: course.start,
        end_time: course.end,
        room: course.room,
        counts_toward_graduation: course.countsTowardGraduation,
        semester: setup.currentSemester,
        course_group: "Custom",
      })),
    );
  }
}

export async function clearCloudSetup(): Promise<void> {
  const userId = await ensureWorkspaceSession();
  const student = await ensureStudentRecord();
  if (!userId || !student) return;
  await supabase.from("course_enrollments").delete().eq("user_id", userId);
  await supabase.from("custom_courses").delete().eq("user_id", userId);
  await supabase.from("students").update({ onboarding_completed_at: null }).eq("id", student.id);
  invalidateStudentRecord();
}

async function ensureSemester(number: number): Promise<string | null> {
  const userId = await ensureWorkspaceSession();
  if (!userId) return null;
  const { data: existing } = await supabase
    .from("semesters")
    .select("id")
    .eq("number", number)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("semesters")
    .insert({ user_id: userId, number, status: "active" })
    .select("id")
    .maybeSingle();
  return created?.id ?? null;
}

/* --------------------------- semester workspace ---------------------------- */

export type CloudSemesterData = {
  links: (CourseLink & { uuid: string })[];
  sessions: (AssistantSession & { uuid: string })[];
  archive: (ArchivedSemester & { uuid: string })[];
};

const numericId = (uuid: string) => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i += 1) hash = (hash * 31 + uuid.charCodeAt(i)) % 2147483647;
  return hash;
};

export async function loadCloudSemesterData(): Promise<CloudSemesterData> {
  await ensureStudentRecord();

  const [{ data: resources }, { data: sessions }, { data: semesters }] = await Promise.all([
    supabase.from("resources").select("*").eq("kind", "link").order("created_at"),
    supabase.from("assistant_sessions").select("*").order("created_at"),
    supabase.from("semesters").select("*").eq("status", "archived").order("number"),
  ]);

  return {
    links: (resources ?? []).map((row) => ({
      uuid: row.id,
      id: numericId(row.id),
      code: row.course_code ?? "",
      kind: (row.description ?? "Other") as LinkKind,
      label: row.title,
      url: row.url ?? "",
    })),
    sessions: (sessions ?? []).map((row) => ({
      uuid: row.id,
      id: numericId(row.id),
      code: row.course_code,
      section: row.section ?? "",
      assistant: row.assistant ?? "",
      day: row.day ?? "",
      start: row.start_time ?? "",
      end: row.end_time ?? "",
      room: row.room ?? "",
      link: row.link ?? "",
    })),
    archive: (semesters ?? []).map((row) => {
      const meta = (row.notes ? safeParse(row.notes) : null) ?? {};
      return {
        uuid: row.id,
        id: numericId(row.id),
        semester: row.number,
        academicYear: row.academic_year ?? "",
        courses: meta.courses ?? [],
        sks: meta.sks ?? 0,
        gpa: Number(row.gpa ?? 0),
        resources: meta.resources ?? 0,
        completedTasks: meta.completedTasks ?? 0,
        notes: meta.notes ?? "",
      };
    }),
  };
}

function safeParse(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function addCloudLink(link: Omit<CourseLink, "id">) {
  const userId = await ensureWorkspaceSession();
  if (!userId) return;
  await supabase.from("resources").insert({
    user_id: userId,
    kind: "link",
    course_code: link.code,
    title: link.label,
    description: link.kind,
    url: link.url,
  });
}

export async function addCloudSession(session: Omit<AssistantSession, "id">) {
  const userId = await ensureWorkspaceSession();
  if (!userId) return;
  await supabase.from("assistant_sessions").insert({
    user_id: userId,
    course_code: session.code,
    section: session.section,
    assistant: session.assistant,
    day: session.day,
    start_time: session.start,
    end_time: session.end,
    room: session.room,
    link: session.link,
  });
}

export async function addCloudArchive(entry: Omit<ArchivedSemester, "id">) {
  const userId = await ensureWorkspaceSession();
  if (!userId) return;
  await supabase.from("semesters").upsert(
    {
      user_id: userId,
      number: entry.semester,
      academic_year: entry.academicYear,
      status: "archived",
      gpa: entry.gpa,
      notes: JSON.stringify({
        courses: entry.courses,
        sks: entry.sks,
        resources: entry.resources,
        completedTasks: entry.completedTasks,
        notes: entry.notes,
      }),
    },
    { onConflict: "user_id,number" },
  );
}

export async function deleteCloudRow(table: "resources" | "assistant_sessions" | "semesters", uuid: string) {
  await supabase.from(table).delete().eq("id", uuid);
}
