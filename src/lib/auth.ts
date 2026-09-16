import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resetWorkspaceSession } from "@/lib/workspace-session";

/** Signed-in account for the personal academic workspace. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED") return;
      resetWorkspaceSession();
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data: current }) => {
      setSession(current.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { ready, session, user: session?.user ?? null };
}

export async function signOut() {
  resetWorkspaceSession();
  try {
    window.localStorage.removeItem("academic-os.setup.v1");
  } catch {
    /* storage unavailable */
  }
  await supabase.auth.signOut();
}
