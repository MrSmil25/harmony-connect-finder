import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Real academic data for the signed-in student, read from the shared
 * dashboard, recommendation, and curriculum summaries in the cloud.
 */

export type DashboardRow = Database["public"]["Views"]["student_dashboard_view"]["Row"];
export type RecommendationRow = Database["public"]["Views"]["student_course_recommendation_view"]["Row"];

export type StudentCourse = {
  id: string;
  code: string;
  name: string;
  sks: number;
  status: string;
  lecturer: string;
  section: string;
  day: string;
  start: string;
  end: string;
  room: string;
  resourceCount: number;
  noteCount: number;
  taskCount: number;
};

export type LibraryEntry = {
  id: string;
  kind: string;
  title: string;
  description: string;
  url: string;
  courseCode: string;
  createdAt: string;
};

export type NoteEntry = {
  id: string;
  title: string;
  topic: string;
  body: string;
  attachment: string;
  courseCode: string;
};

/** Dashboard numbers: credits, graduation percentage, counts. */
export function useDashboard() {
  const [data, setData] = useState<DashboardRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: row } = await supabase.from("student_dashboard_view").select("*").maybeSingle();
    setData(row ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dashboard: data, loading, refresh };
}

/** Enrolled courses joined with their saved resources, notes, and tasks. */
export function useStudentCourses() {
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [{ data: rows }, { data: resources }, { data: notes }, { data: tasks }] = await Promise.all([
      supabase
        .from("course_enrollments")
        .select("id, course_code, course_name, sks, status, lecturer, course_sections(section, assistant, room), schedules(day, start_time, end_time, room)")
        .order("created_at", { ascending: true }),
      supabase.from("resources").select("course_code"),
      supabase.from("notes").select("course_code"),
      supabase.from("tasks").select("course_code, done"),
    ]);

    const count = (list: { course_code: string | null }[] | null, code: string) =>
      (list ?? []).filter((item) => item.course_code === code).length;

    setCourses(
      (rows ?? []).map((row) => {
        const section = row.course_sections?.[0];
        const schedule = row.schedules?.[0];
        return {
          id: row.id,
          code: row.course_code,
          name: row.course_name ?? row.course_code,
          sks: row.sks ?? 0,
          status: row.status,
          lecturer: row.lecturer ?? "",
          section: section?.section ?? "",
          day: schedule?.day ?? "",
          start: schedule?.start_time ?? "",
          end: schedule?.end_time ?? "",
          room: schedule?.room ?? section?.room ?? "",
          resourceCount: count(resources, row.course_code),
          noteCount: count(notes, row.course_code),
          taskCount: (tasks ?? []).filter((task) => task.course_code === row.course_code && !task.done).length,
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}

/** Curriculum of the student's program with prerequisite status per course. */
export function useCurriculum() {
  const [rows, setRows] = useState<RecommendationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("student_course_recommendation_view")
      .select("*")
      .order("recommended_semester", { ascending: true })
      .order("code", { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

/** Everything saved in the personal library: links, files, and notes. */
export function useLibrary() {
  const [resources, setResources] = useState<LibraryEntry[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [{ data: resourceRows }, { data: noteRows }] = await Promise.all([
      supabase.from("resources").select("*").order("created_at", { ascending: false }),
      supabase.from("notes").select("*").order("created_at", { ascending: false }),
    ]);
    setResources(
      (resourceRows ?? []).map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        description: row.description ?? "",
        url: row.url ?? "",
        courseCode: row.course_code ?? "",
        createdAt: row.created_at,
      })),
    );
    setNotes(
      (noteRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        topic: row.topic ?? "",
        body: row.body ?? "",
        attachment: row.attachment ?? "",
        courseCode: row.course_code ?? "",
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { resources, notes, loading, refresh };
}

/** True when the signed-in account carries the admin role. */
export function useIsAdmin(userId: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void supabase
      .rpc("has_role", { _user_id: userId, _role: "admin" })
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return isAdmin;
}

/** Adds the planned courses of a KRS plan to the student's enrolments. */
export async function savePlannedCourses(
  userId: string,
  picks: { code: string; name: string; sks: number }[],
): Promise<{ saved: number }> {
  if (!picks.length) return { saved: 0 };
  const { data: existing } = await supabase.from("course_enrollments").select("course_code");
  const taken = new Set((existing ?? []).map((row) => row.course_code));
  const rows = picks
    .filter((pick) => !taken.has(pick.code))
    .map((pick) => ({
      user_id: userId,
      course_code: pick.code,
      course_name: pick.name,
      sks: pick.sks,
      status: "planned",
    }));
  if (!rows.length) return { saved: 0 };
  const { error } = await supabase.from("course_enrollments").insert(rows);
  if (error) throw error;
  return { saved: rows.length };
}
