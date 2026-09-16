import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Personal academic workspace session.
 *
 * The workspace belongs to the signed-in account; every read and write is
 * scoped to that account by row level security.
 */

let sessionPromise: Promise<string | null> | null = null;

async function resolveUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Resolves the signed-in account id. Safe to call from anywhere, runs once. */
export function ensureWorkspaceSession(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!sessionPromise) sessionPromise = resolveUserId();
  return sessionPromise;
}

/** Clears cached session + profile so the next read reflects the new account. */
export function resetWorkspaceSession() {
  sessionPromise = null;
  studentPromise = null;
}

export type StudentRecord = {
  id: string;
  name: string;
  program: string;
  program_id: string | null;
  faculty: string;
  university: string;
  entry_year: number;
  current_semester: number;
  target_gpa: number;
  target_sks: number;
  onboarding_completed_at: string | null;
};

let studentPromise: Promise<StudentRecord | null> | null = null;

async function resolveStudentRecord(): Promise<StudentRecord | null> {
  const userId = await ensureWorkspaceSession();
  if (!userId) return null;

  const { data: existing } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as StudentRecord;

  const { data: created, error } = await supabase
    .from("students")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("Could not create the student profile", error);
    studentPromise = null;
    return null;
  }
  return (created as StudentRecord) ?? null;
}

/** Creates the student profile row on first visit, then returns it (once per session). */
export function ensureStudentRecord(): Promise<StudentRecord | null> {
  if (!studentPromise) studentPromise = resolveStudentRecord();
  return studentPromise;
}

/** Forces the next profile read to hit the workspace again. */
export function invalidateStudentRecord() {
  studentPromise = null;
}

export type WorkspaceSession = {
  ready: boolean;
  userId: string | null;
  student: StudentRecord | null;
  refresh: () => Promise<void>;
};

/** React entry point: guarantees a workspace + student profile on mount. */
export function useWorkspaceSession(): WorkspaceSession {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentRecord | null>(null);

  const load = async () => {
    const id = await ensureWorkspaceSession();
    setUserId(id);
    setStudent(await ensureStudentRecord());
    setReady(true);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, userId, student, refresh: load };
}
