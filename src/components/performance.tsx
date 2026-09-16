import { Award, Calculator, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { studentProfile } from "@/data/profile";

export type SemesterRecord = { id: number; name: string; gpa: number; sks: number; courses: number };

export const semesterHistory: SemesterRecord[] = [
  { id: 1, name: "Semester Gasal 2024/2025", gpa: 3.58, sks: 21, courses: 7 },
  { id: 2, name: "Semester Genap 2024/2025", gpa: 3.64, sks: 22, courses: 7 },
  { id: 3, name: "Semester Gasal 2025/2026", gpa: 3.7, sks: 23, courses: 8 },
  { id: 4, name: "Semester Genap 2025/2026", gpa: 3.68, sks: 22, courses: 7 },
  { id: 5, name: "Semester Gasal 2026/2027", gpa: 3.72, sks: 24, courses: 8 },
];

const CURRENT_GPA = 3.72;

function gradeLetter(score: number) {
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  return "D";
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">{title}</h2>{action}</div>;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold">{value}</p>{hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}</div>;
}

export function AcademicPerformance() {
  const [targetGpa, setTargetGpa] = useState(studentProfile.targetGpa.toFixed(2));
  const [targetSks, setTargetSks] = useState(String(studentProfile.targetSks));
  const [goals, setGoals] = useState([
    { id: 1, label: "Keep every course above B+", done: true },
    { id: 2, label: "Finish research proposal before UTS", done: false },
    { id: 3, label: "Raise GPA by 0.13 this semester", done: false },
  ]);
  const [goalDraft, setGoalDraft] = useState("");

  const target = Number(targetGpa) || 0;
  const creditTarget = Number(targetSks) || 0;
  const completedSks = semesterHistory.reduce((sum, item) => sum + item.sks, 0);
  const gpaProgress = target > 0 ? Math.min(100, Math.round((CURRENT_GPA / target) * 100)) : 0;
  const sksProgress = creditTarget > 0 ? Math.min(100, Math.round((completedSks / creditTarget) * 100)) : 0;
  const gap = target - CURRENT_GPA;
  const best = Math.max(...semesterHistory.map(item => item.gpa));
  const goalsDone = goals.filter(goal => goal.done).length;

  const addGoal = () => {
    const label = goalDraft.trim();
    if (!label) return;
    setGoals(items => [...items, { id: Date.now(), label, done: false }]);
    setGoalDraft("");
  };

  return (
    <section>
      <SectionHeader title="Academic performance" action={<span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{completedSks} SKS completed</span>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)]">
        <article className="academic-card p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="rounded-2xl bg-academic p-5 text-academic-foreground">
              <p className="text-[11px] uppercase opacity-75">Current GPA</p>
              <p className="mt-1 font-display text-4xl font-bold">{CURRENT_GPA.toFixed(2)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] opacity-85"><TrendingUp className="size-3.5 text-primary" />Best so far {best.toFixed(2)}</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-xs text-muted-foreground">Progress toward target</p><p className="mt-1 text-sm font-semibold">{gap > 0 ? `${gap.toFixed(2)} to go` : "Target reached"}</p></div>
                <p className="font-display text-2xl font-bold text-academic">{gpaProgress}%</p>
              </div>
              <Progress value={gpaProgress} className="mt-3 h-2" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="rounded-xl bg-muted p-3">
                  <span className="text-[11px] text-muted-foreground">Target GPA</span>
                  <Input value={targetGpa} onChange={event => setTargetGpa(event.target.value)} inputMode="decimal" className="mt-1 h-8 border-0 bg-surface px-2 font-display text-base font-bold" />
                </label>
                <label className="rounded-xl bg-muted p-3">
                  <span className="text-[11px] text-muted-foreground">Target credits</span>
                  <Input value={targetSks} onChange={event => setTargetSks(event.target.value)} inputMode="numeric" className="mt-1 h-8 border-0 bg-surface px-2 font-display text-base font-bold" />
                </label>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Credits progress</span><span className="font-semibold text-academic">{completedSks} / {creditTarget || "—"} SKS</span></div>
                <Progress value={sksProgress} className="mt-2 h-2" />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Award className="size-4 text-academic" />Semester history</p>
            <div className="space-y-2">
              {[...semesterHistory].reverse().map((item, index) => (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{item.name}{index === 0 && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Current</span>}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.sks} SKS · {item.courses} courses</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-academic">{item.gpa.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">GPA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="academic-card p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Target className="size-4 text-academic" />Academic goals</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatTile label="Goals reached" value={`${goalsDone}/${goals.length}`} />
            <StatTile label="Average GPA" value={(semesterHistory.reduce((sum, item) => sum + item.gpa, 0) / semesterHistory.length).toFixed(2)} />
          </div>
          <Progress value={goals.length ? (goalsDone / goals.length) * 100 : 0} className="mt-4 h-2" />
          <div className="mt-4 space-y-2">
            {goals.map(goal => (
              <div key={goal.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3">
                <button onClick={() => setGoals(items => items.map(item => item.id === goal.id ? { ...item, done: !item.done } : item))} aria-label={`Toggle ${goal.label}`} className={`size-5 rounded-full border ${goal.done ? "border-academic bg-academic" : "border-input bg-background"}`} />
                <p className={`min-w-0 text-sm ${goal.done ? "text-muted-foreground line-through" : "font-medium"}`}>{goal.label}</p>
                <button onClick={() => setGoals(items => items.filter(item => item.id !== goal.id))} aria-label={`Remove ${goal.label}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={goalDraft} onChange={event => setGoalDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addGoal(); }} placeholder="Add an academic goal" className="h-9" />
            <Button size="sm" variant="academic" onClick={addGoal} aria-label="Add goal"><Plus className="size-4" /></Button>
          </div>
        </article>
      </div>
    </section>
  );
}

type Component = { id: number; name: string; weight: number; score: number };

const defaultComponents: Component[] = [
  { id: 1, name: "Assignments", weight: 25, score: 88 },
  { id: 2, name: "Midterm exam", weight: 30, score: 82 },
  { id: 3, name: "Final exam", weight: 35, score: 0 },
  { id: 4, name: "Participation", weight: 10, score: 90 },
];

export function CoursePerformance({ courseTitle }: { courseTitle: string }) {
  const [components, setComponents] = useState<Component[]>(defaultComponents);
  const [targetScore, setTargetScore] = useState("85");
  const [draft, setDraft] = useState({ name: "", weight: "", score: "" });

  const { graded, currentGrade, projected, remainingWeight } = useMemo(() => {
    const gradedItems = components.filter(item => item.score > 0);
    const gradedWeight = gradedItems.reduce((sum, item) => sum + item.weight, 0);
    const earned = gradedItems.reduce((sum, item) => sum + (item.score * item.weight) / 100, 0);
    const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
    return {
      graded: gradedWeight,
      currentGrade: gradedWeight > 0 ? (earned / gradedWeight) * 100 : 0,
      projected: earned,
      remainingWeight: Math.max(0, totalWeight - gradedWeight),
    };
  }, [components]);

  const target = Number(targetScore) || 0;
  const requiredScore = remainingWeight > 0 ? ((target - projected) / remainingWeight) * 100 : null;

  const update = (id: number, patch: Partial<Component>) => setComponents(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const addComponent = () => {
    if (!draft.name.trim()) return;
    setComponents(items => [...items, { id: Date.now(), name: draft.name.trim(), weight: Number(draft.weight) || 0, score: Number(draft.score) || 0 }]);
    setDraft({ name: "", weight: "", score: "" });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="academic-card p-5">
        <div className="mb-5 flex items-center gap-2"><TrendingUp className="size-5 text-academic" /><h2 className="text-base font-bold">Performance summary</h2></div>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-3xl font-bold">{currentGrade.toFixed(1)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Current grade from {graded}% of assessments</p>
          </div>
          <span className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-academic">Estimated {gradeLetter(currentGrade)}</span>
        </div>
        <Progress value={Math.min(100, currentGrade)} className="mt-4 h-2" />
        <div className="mt-5 grid grid-cols-2 gap-2">
          {components.map(item => (
            <StatTile key={item.id} label={item.name} value={item.score > 0 ? String(item.score) : "—"} hint={`${item.weight}% weight`} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Scores tracked for {courseTitle}. Unscored components are excluded until graded.</p>
      </section>

      <section className="academic-card p-5">
        <div className="mb-5 flex items-center gap-2"><Calculator className="size-5 text-academic" /><h2 className="text-base font-bold">Grade calculator</h2></div>
        <div className="space-y-2">
          {components.map(item => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_64px_64px_auto] items-center gap-2">
              <Input value={item.name} onChange={event => update(item.id, { name: event.target.value })} className="h-9 text-sm" aria-label="Assessment component" />
              <Input value={String(item.weight)} onChange={event => update(item.id, { weight: Number(event.target.value) || 0 })} inputMode="numeric" className="h-9 text-sm" aria-label={`${item.name} weight`} />
              <Input value={String(item.score)} onChange={event => update(item.id, { score: Number(event.target.value) || 0 })} inputMode="numeric" className="h-9 text-sm" aria-label={`${item.name} score`} />
              <button onClick={() => setComponents(items => items.filter(row => row.id !== item.id))} aria-label={`Remove ${item.name}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_64px_64px_auto] items-center gap-2">
          <Input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Component" className="h-9 text-sm" />
          <Input value={draft.weight} onChange={event => setDraft({ ...draft, weight: event.target.value })} placeholder="%" inputMode="numeric" className="h-9 text-sm" />
          <Input value={draft.score} onChange={event => setDraft({ ...draft, score: event.target.value })} placeholder="Score" inputMode="numeric" className="h-9 text-sm" />
          <Button size="sm" variant="academic" onClick={addComponent} aria-label="Add component"><Plus className="size-4" /></Button>
        </div>
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">Target final grade</span>
            <Input value={targetScore} onChange={event => setTargetScore(event.target.value)} inputMode="numeric" className="h-9 w-24 text-sm" />
          </label>
          <div className="rounded-xl bg-muted p-4">
            {remainingWeight === 0 ? (
              <p className="text-sm text-muted-foreground">All components are scored. Final grade is {projected.toFixed(1)} ({gradeLetter(projected)}).</p>
            ) : requiredScore !== null && requiredScore > 100 ? (
              <p className="text-sm font-semibold text-destructive">Target {target} is out of reach — you would need {requiredScore.toFixed(1)} on the remaining {remainingWeight}%.</p>
            ) : (
              <p className="text-sm">You need <span className="font-display text-lg font-bold text-academic">{Math.max(0, requiredScore ?? 0).toFixed(1)}</span> on the remaining {remainingWeight}% to finish at {target} ({gradeLetter(target)}).</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
