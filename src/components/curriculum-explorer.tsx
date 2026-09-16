import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, CheckCircle2, FileText, GraduationCap, Layers, Link2, Lock, NotebookPen, Unlock, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardRow, RecommendationRow } from "@/data/academic";

/**
 * Curriculum Explorer — the student's own program curriculum, grouped by
 * recommended semester, with prerequisite status and a detail drawer.
 */
export function CurriculumExplorer({
  rows,
  loading,
  dashboard,
  onOpenSetup,
}: {
  rows: RecommendationRow[];
  loading: boolean;
  dashboard: DashboardRow | null;
  onOpenSetup: () => void;
}) {
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<RecommendationRow | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((row) => row.category ?? row.course_group ?? "Other")))],
    [rows],
  );

  const scoped = useMemo(
    () => (filter === "All" ? rows : rows.filter((row) => (row.category ?? row.course_group ?? "Other") === filter)),
    [rows, filter],
  );

  const semesters = useMemo(() => {
    const map = new Map<number, RecommendationRow[]>();
    for (const row of scoped) {
      const key = row.recommended_semester ?? 0;
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [scoped]);

  const totalSks = rows.reduce((total, row) => total + (row.sks ?? 0), 0);
  const programLabel = dashboard?.program_name ?? "Your study program";
  const year = dashboard?.curriculum_year;

  return (
    <div>
      <div className="mb-6 md:hidden">
        <p className="mb-1 text-xs font-semibold uppercase text-academic">Curriculum {year ?? ""}</p>
        <h1 className="text-2xl font-bold leading-8">Curriculum Explorer</h1>
      </div>
      <div className="mb-7 hidden md:block">
        <p className="text-sm text-academic">Curriculum {year ?? ""}</p>
        <h1 className="mt-1 text-3xl font-bold">Curriculum Explorer</h1>
      </div>

      <section className="mb-7 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground shadow-lg md:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold opacity-80">
          <span className="size-2 rounded-full bg-primary" />
          {dashboard?.program_code ?? "PROGRAM"} · {dashboard?.faculty ?? "Faculty"}
        </div>
        <h2 className="mt-3 text-2xl font-bold">{programLabel}</h2>
        <p className="mt-1 text-sm opacity-85">
          {dashboard?.university ?? ""}
          {year ? ` · Curriculum year ${year}` : ""}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 md:max-w-lg">
          <HeroStat label="Courses" value={String(rows.length)} />
          <HeroStat label="Curriculum credits" value={`${totalSks} SKS`} />
          <HeroStat label="Graduation target" value={`${dashboard?.minimum_graduation_credit ?? 0} SKS`} />
        </div>
      </section>

      {categories.length > 2 && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {categories.map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === value ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="academic-card p-6 text-center text-sm text-muted-foreground">Loading your curriculum…</div>
      ) : !rows.length ? (
        <EmptyState
          icon={Layers}
          eyebrow="Curriculum"
          title="No curriculum is linked to your account yet"
          description="Pick your study program in the academic setup and the full curriculum — every course, credit, and prerequisite — appears here grouped by semester."
          actions={[{ label: "Open academic setup", icon: GraduationCap, onClick: onOpenSetup }]}
          hints={["Curriculum data is shared master data, you never type it in", "Prerequisites unlock as you complete courses"]}
        />
      ) : (
        <div className="space-y-8">
          {semesters.map(([semester, courses]) => (
            <section key={semester}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold md:text-lg">Semester {semester}</h2>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">
                  {courses.reduce((total, course) => total + (course.sks ?? 0), 0)} SKS · {courses.length} courses
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.curriculum_course_id ?? course.code} course={course} onOpen={() => setSelected(course)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && <CourseDrawer course={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-academic-foreground/10 p-3">
      <p className="truncate text-[9px] opacity-70">{label}</p>
      <p className="mt-1 truncate text-xs font-bold">{value}</p>
    </div>
  );
}

function statusOf(course: RecommendationRow) {
  if (course.already_completed) return { label: "Completed", chip: "bg-success/12 text-success", icon: CheckCircle2 };
  if (course.already_taken) return { label: "In progress", chip: "bg-academic/12 text-academic", icon: BookOpen };
  if (course.prerequisites_met) return { label: "Available", chip: "bg-primary/25 text-foreground", icon: Unlock };
  return { label: "Locked", chip: "bg-muted text-muted-foreground", icon: Lock };
}

function CourseCard({ course, onOpen }: { course: RecommendationRow; onOpen: () => void }) {
  const status = statusOf(course);
  const StatusIcon = status.icon;
  return (
    <button onClick={onOpen} className="academic-card group overflow-hidden text-left transition-transform hover:-translate-y-0.5">
      <div className={`h-2 ${course.already_completed ? "bg-success" : course.prerequisites_met ? "bg-primary" : "bg-muted"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold text-academic">{course.code}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{course.sks} SKS</span>
        </div>
        <h3 className="mt-3 min-h-12 text-base font-bold leading-6">{course.name}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">
            {course.category ?? course.course_group ?? "Course"}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${status.chip}`}>
            <StatusIcon className="size-3" />
            {status.label}
          </span>
        </div>
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Recommended in semester {course.recommended_semester ?? "—"}
          {course.prerequisites?.length ? ` · ${course.prerequisites.length} prerequisite${course.prerequisites.length === 1 ? "" : "s"}` : " · no prerequisite"}
        </p>
      </div>
    </button>
  );
}

type CourseDetail = {
  resources: { id: string; title: string; kind: string; url: string | null }[];
  files: { id: string; title: string; size: number | null }[];
  notes: { id: string; title: string; topic: string | null }[];
};

function CourseDrawer({ course, onClose }: { course: RecommendationRow; onClose: () => void }) {
  const [detail, setDetail] = useState<CourseDetail>({ resources: [], files: [], notes: [] });
  const status = statusOf(course);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data: resources }, { data: notes }] = await Promise.all([
        supabase.from("resources").select("id, title, kind, url, file_path, file_size").eq("course_code", course.code ?? ""),
        supabase.from("notes").select("id, title, topic").eq("course_code", course.code ?? ""),
      ]);
      if (cancelled) return;
      setDetail({
        resources: (resources ?? []).filter((row) => row.kind !== "file").map((row) => ({ id: row.id, title: row.title, kind: row.kind, url: row.url })),
        files: (resources ?? []).filter((row) => row.kind === "file").map((row) => ({ id: row.id, title: row.title, size: row.file_size })),
        notes: (notes ?? []).map((row) => ({ id: row.id, title: row.title, topic: row.topic })),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [course.code]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="page-enter h-full w-full max-w-md overflow-y-auto bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-academic p-5 text-academic-foreground">
          <div className="min-w-0">
            <p className="text-xs font-semibold opacity-75">{course.code}</p>
            <h2 className="mt-2 text-lg font-bold leading-6">{course.name}</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close course detail" onClick={onClose} className="text-academic-foreground">
            <X />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2">
            <Detail label="Credits" value={`${course.sks} SKS`} />
            <Detail label="Course type" value={course.category ?? course.course_group ?? "Course"} />
            <Detail label="Recommended semester" value={`Semester ${course.recommended_semester ?? "—"}`} />
            <Detail label="Status" value={status.label} />
          </div>

          <Block title="Prerequisite" icon={Lock}>
            {course.prerequisites?.length ? (
              <div className="flex flex-wrap gap-2">
                {course.prerequisites.map((code) => (
                  <span key={code} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{code}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No prerequisite — you can take this course any semester it runs.</p>
            )}
            {course.prerequisites?.length ? (
              <p className={`mt-3 text-xs font-semibold ${course.prerequisites_met ? "text-success" : "text-destructive"}`}>
                {course.prerequisites_met ? "All prerequisites completed." : "Some prerequisites are still missing."}
              </p>
            ) : null}
          </Block>

          <Block title="Resources" icon={Link2}>
            {detail.resources.length ? (
              <ul className="space-y-2">
                {detail.resources.map((item) => (
                  <li key={item.id} className="rounded-xl bg-muted p-3 text-sm">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{item.url || item.kind}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing saved yet. Links and references you add for this course appear here.</p>
            )}
          </Block>

          <Block title="Files" icon={FileText}>
            {detail.files.length ? (
              <ul className="space-y-2">
                {detail.files.map((item) => (
                  <li key={item.id} className="rounded-xl bg-muted p-3 text-sm font-semibold">{item.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No file uploaded for this course yet.</p>
            )}
          </Block>

          <Block title="Notes" icon={NotebookPen}>
            {detail.notes.length ? (
              <ul className="space-y-2">
                {detail.notes.map((item) => (
                  <li key={item.id} className="rounded-xl bg-muted p-3 text-sm">
                    <p className="font-semibold">{item.title}</p>
                    {item.topic && <p className="mt-1 text-xs text-muted-foreground">{item.topic}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Your study notes for this course will be listed here.</p>
            )}
          </Block>

          {course.note && (
            <p className="rounded-xl bg-accent p-3 text-xs leading-5 text-academic">{course.note}</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon: typeof Link2; children: React.ReactNode }) {
  return (
    <section className="academic-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-academic" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </section>
  );
}
