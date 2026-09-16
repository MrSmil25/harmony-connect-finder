import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Lock, Plus, Save, Sparkles, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { savePlannedCourses, type DashboardRow, type RecommendationRow } from "@/data/academic";

const MAX_SKS = 24;

/**
 * Smart KRS Planner — plan the next semester within the 24 SKS limit,
 * with prerequisites checked before a course can be added.
 */
export function KrsPlanner({
  rows,
  loading,
  dashboard,
  userId,
  onSaved,
  onOpenSetup,
}: {
  rows: RecommendationRow[];
  loading: boolean;
  dashboard: DashboardRow | null;
  userId: string | null;
  onSaved: () => void;
  onOpenSetup: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const currentSemester = dashboard?.current_semester ?? 1;
  const nextSemester = currentSemester + 1;

  const available = useMemo(
    () => rows.filter((row) => !row.already_taken).sort((a, b) => (a.recommended_semester ?? 0) - (b.recommended_semester ?? 0)),
    [rows],
  );
  const recommended = useMemo(
    () => available.filter((row) => row.prerequisites_met && (row.recommended_semester ?? 0) <= nextSemester),
    [available, nextSemester],
  );
  const later = useMemo(() => available.filter((row) => !recommended.includes(row)), [available, recommended]);

  const byCode = useMemo(() => new Map(available.map((row) => [row.code ?? "", row])), [available]);
  const selected = picked.map((code) => byCode.get(code)).filter(Boolean) as RecommendationRow[];
  const totalSks = selected.reduce((total, row) => total + (row.sks ?? 0), 0);

  const toggle = (row: RecommendationRow) => {
    const code = row.code ?? "";
    setMessage(null);
    if (picked.includes(code)) {
      setWarning(null);
      setPicked((items) => items.filter((item) => item !== code));
      return;
    }
    if (!row.prerequisites_met) {
      setWarning(`${row.name} is still locked — finish ${row.prerequisites?.join(", ")} first.`);
      return;
    }
    if (totalSks + (row.sks ?? 0) > MAX_SKS) {
      setWarning(`Adding ${row.name} would pass the ${MAX_SKS} SKS limit for one semester.`);
      return;
    }
    setWarning(null);
    setPicked((items) => [...items, code]);
  };

  const save = async () => {
    if (!userId || !selected.length) return;
    setBusy(true);
    setWarning(null);
    try {
      const { saved } = await savePlannedCourses(
        userId,
        selected.map((row) => ({ code: row.code ?? "", name: row.name ?? row.code ?? "", sks: row.sks ?? 0 })),
      );
      setMessage(saved ? `${saved} course${saved === 1 ? "" : "s"} saved to your study plan.` : "Those courses are already in your plan.");
      setPicked([]);
      onSaved();
    } catch {
      setWarning("The plan could not be saved right now. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="mb-6 md:hidden">
        <p className="mb-1 text-xs font-semibold uppercase text-academic">Semester {nextSemester} planning</p>
        <h1 className="text-2xl font-bold leading-8">Smart KRS Planner</h1>
      </div>
      <div className="mb-7 hidden md:block">
        <p className="text-sm text-academic">Semester {nextSemester} planning</p>
        <h1 className="mt-1 text-3xl font-bold">Smart KRS Planner</h1>
      </div>

      <section className="academic-card mb-7 p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-xs text-muted-foreground">Selected credits for semester {nextSemester}</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {totalSks} <span className="text-base text-muted-foreground">/ {MAX_SKS} SKS</span>
            </p>
            <Progress value={(totalSks / MAX_SKS) * 100} className="mt-4 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              Currently in semester {currentSemester} · {selected.length} course{selected.length === 1 ? "" : "s"} selected
            </p>
          </div>
          <Button variant="academic" onClick={save} disabled={busy || !selected.length}>
            <Save /> Save study plan
          </Button>
        </div>

        {warning && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {warning}
          </p>
        )}
        {message && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-success/12 p-3 text-xs font-medium text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        )}

        {selected.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Your selection</p>
            <div className="flex flex-wrap gap-2">
              {selected.map((row) => (
                <button
                  key={row.code}
                  onClick={() => toggle(row)}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic"
                >
                  {row.code} · {row.sks} SKS
                  <Trash2 className="size-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading ? (
        <div className="academic-card p-6 text-center text-sm text-muted-foreground">Loading recommendations…</div>
      ) : !rows.length ? (
        <EmptyState
          icon={Target}
          eyebrow="KRS planner"
          title="Link a study program to start planning"
          description="Once your program is set, the planner lists every course you are eligible for, checks prerequisites, and keeps you inside the 24 SKS limit."
          actions={[{ label: "Open academic setup", icon: Plus, onClick: onOpenSetup }]}
          hints={["Prerequisites are checked before a course can be added", "Maximum 24 SKS per semester"]}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold md:text-lg">
                <Sparkles className="size-4 text-academic" /> Recommended for you
              </h2>
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{recommended.length} courses</span>
            </div>
            {recommended.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recommended.map((row) => (
                  <PlannerCard key={row.code} row={row} picked={picked.includes(row.code ?? "")} onToggle={() => toggle(row)} />
                ))}
              </div>
            ) : (
              <div className="academic-card p-6 text-center text-sm text-muted-foreground">
                Every recommended course for this stage is already in your record.
              </div>
            )}
          </section>

          {later.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold md:text-lg">Later or locked</h2>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{later.length} courses</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {later.slice(0, 12).map((row) => (
                  <PlannerCard key={row.code} row={row} picked={picked.includes(row.code ?? "")} onToggle={() => toggle(row)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PlannerCard({ row, picked, onToggle }: { row: RecommendationRow; picked: boolean; onToggle: () => void }) {
  const locked = !row.prerequisites_met;
  return (
    <button
      onClick={onToggle}
      className={`academic-card grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 text-left transition-transform hover:-translate-y-0.5 ${picked ? "ring-2 ring-academic" : ""}`}
    >
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${picked ? "border-academic bg-academic text-academic-foreground" : locked ? "border-input bg-muted text-muted-foreground" : "border-input bg-background"}`}
      >
        {picked ? <Check className="size-3.5" /> : locked ? <Lock className="size-3" /> : null}
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold text-academic">{row.code}</span>
          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">{row.sks} SKS</span>
        </div>
        <h3 className="mt-2 text-sm font-bold leading-5">{row.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Semester {row.recommended_semester ?? "—"}
          </span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">
            {row.category ?? row.course_group ?? "Course"}
          </span>
          {locked && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              Needs {row.prerequisites?.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
