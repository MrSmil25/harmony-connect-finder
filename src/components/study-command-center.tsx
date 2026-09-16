import {
  ArrowLeft, BookOpen, CalendarDays, CalendarPlus, ChevronRight, Clock3, FileText, GraduationCap,
  ListChecks, NotebookPen, PencilRuler, Plus, Target, Timer, Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { exams, type Exam, type StudyItem } from "@/components/exam-prep";

export type MasteryLevel = "Not started" | "Learning" | "Familiar" | "Mastered";
export type StudyTopic = { id: number; title: string; level: MasteryLevel };
export type PlannedSession = { id: number; eventId: number; day: string; date: string; time: string; duration: string; topic: string };

export type EventMeta = {
  assessment: "UTS" | "UAS" | "Quiz" | "Presentation" | "Project";
  format: string;
  notes: string[];
  topics: StudyTopic[];
};

const eventMeta: Record<number, EventMeta> = {
  1: {
    assessment: "UTS",
    format: "Closed book · 120 minutes · 4 calculation cases + 10 multiple choice",
    notes: [
      "Bring a non-programmable calculator and student ID card.",
      "Formula sheet is not provided — memorise contribution margin and variance formulas.",
      "Arrive 20 minutes early at Auditorium FEB.",
    ],
    topics: [
      { id: 1, title: "Cost concepts and classification", level: "Mastered" },
      { id: 2, title: "Cost behavior and estimation", level: "Familiar" },
      { id: 3, title: "Cost–volume–profit analysis", level: "Learning" },
      { id: 4, title: "Budgeting and variance analysis", level: "Not started" },
    ],
  },
  2: {
    assessment: "UTS",
    format: "Open note · 100 minutes · 2 essays + 1 short case analysis",
    notes: [
      "Answers may be written in Indonesian or English.",
      "Cases are taken from the weekly discussion material.",
    ],
    topics: [
      { id: 1, title: "Globalisation and trade theory", level: "Familiar" },
      { id: 2, title: "Market entry modes", level: "Mastered" },
      { id: 3, title: "Cultural and political environment", level: "Learning" },
      { id: 4, title: "International strategy", level: "Not started" },
    ],
  },
  3: {
    assessment: "Presentation",
    format: "15-minute proposal defense + 15-minute question session, 3 reviewers",
    notes: [
      "Submit the slide deck one day before the defense.",
      "Prepare justification for the sampling method and analysis tool.",
    ],
    topics: [
      { id: 1, title: "Research question and gap", level: "Mastered" },
      { id: 2, title: "Literature review structure", level: "Familiar" },
      { id: 3, title: "Research design and sampling", level: "Learning" },
      { id: 4, title: "Data analysis plan", level: "Not started" },
    ],
  },
};

export const initialStudySessions: PlannedSession[] = [
  { id: 901, eventId: 1, day: "Tue", date: "15 Sep", time: "19:00", duration: "90 min", topic: "Cost behavior recap" },
  { id: 902, eventId: 1, day: "Thu", date: "17 Sep", time: "16:00", duration: "120 min", topic: "Problem set drill" },
  { id: 903, eventId: 2, day: "Sat", date: "19 Sep", time: "20:00", duration: "60 min", topic: "Entry mode flashcards" },
];

const masteryLevels: MasteryLevel[] = ["Not started", "Learning", "Familiar", "Mastered"];
const masteryStyle: Record<MasteryLevel, string> = {
  "Not started": "bg-muted text-muted-foreground",
  Learning: "bg-warning/15 text-warning",
  Familiar: "bg-accent text-academic",
  Mastered: "bg-success/12 text-success",
};
const masteryValue: Record<MasteryLevel, number> = { "Not started": 0, Learning: 40, Familiar: 70, Mastered: 100 };

const resourceIcon = { Textbook: BookOpen, Slides: FileText, Note: NotebookPen, Practice: PencilRuler, Task: Target } as const;
const categories: StudyItem["category"][] = ["Concept review", "Practice", "Final review"];
const weekDayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const progressOf = (plan: StudyItem[]) => (plan.length ? Math.round((plan.filter((item) => item.done).length / plan.length) * 100) : 0);

export const getEventMeta = (id: number) => eventMeta[id] ?? eventMeta[1]!;

export function AcademicEventCard({ onPrepare }: { onPrepare: (event: Exam) => void }) {
  const next = [...exams].sort((a, b) => a.daysLeft - b.daysLeft)[0]!;
  const meta = getEventMeta(next.id);
  const progress = progressOf(next.plan);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold md:text-lg">Study command center</h2>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{exams.length} assessments ahead</span>
      </div>
      <article className="academic-card overflow-hidden">
        <div className="h-1.5 bg-primary" />
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Upcoming academic event</p>
            <h3 className="mt-2 flex flex-wrap items-center gap-2 text-lg font-bold">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-academic"><GraduationCap className="size-4" /></span>
              {meta.assessment} {next.course}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-academic" />{next.date}</span>
              <span className="flex items-center gap-1.5"><Timer className="size-3.5 text-academic" />{next.daysLeft} days remaining</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={progress} className="h-2 max-w-sm flex-1" />
              <span className="text-xs font-bold text-academic">{progress}% ready</span>
            </div>
          </div>
          <Button variant="yellow" onClick={() => onPrepare(next)} className="justify-self-start md:justify-self-end">
            Prepare now <ChevronRight className="size-4" />
          </Button>
        </div>
      </article>
    </section>
  );
}

export function StudyCommandCenter({
  event, onBack, sessions, onAddSession, onRemoveSession,
}: {
  event: Exam;
  onBack: () => void;
  sessions: PlannedSession[];
  onAddSession: (session: Omit<PlannedSession, "id">) => void;
  onRemoveSession: (id: number) => void;
}) {
  const meta = getEventMeta(event.id);
  const [plan, setPlan] = useState<StudyItem[]>(event.plan);
  const [topics, setTopics] = useState<StudyTopic[]>(meta.topics);
  const [itemDraft, setItemDraft] = useState({ label: "", category: categories[0] as StudyItem["category"], week: 1 });
  const [sessionDraft, setSessionDraft] = useState({ topic: "", day: "Mon", date: "", time: "19:00", duration: "60 min" });

  const progress = progressOf(plan);
  const weeks = useMemo(() => Array.from(new Set(plan.map((item) => item.week))).sort((a, b) => a - b), [plan]);
  const mastery = topics.length ? Math.round(topics.reduce((sum, topic) => sum + masteryValue[topic.level], 0) / topics.length) : 0;
  const mySessions = sessions.filter((session) => session.eventId === event.id);

  const toggle = (id: number) => setPlan((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  const cycleTopic = (id: number) =>
    setTopics((items) => items.map((topic) => (topic.id === id
      ? { ...topic, level: masteryLevels[(masteryLevels.indexOf(topic.level) + 1) % masteryLevels.length]! }
      : topic)));

  const addItem = () => {
    if (!itemDraft.label.trim()) return;
    setPlan((items) => [...items, { id: Date.now(), label: itemDraft.label.trim(), category: itemDraft.category, week: Number(itemDraft.week) || 1, done: false }]);
    setItemDraft({ ...itemDraft, label: "" });
  };

  const addSession = () => {
    if (!sessionDraft.topic.trim()) return;
    onAddSession({
      eventId: event.id,
      day: sessionDraft.day,
      date: sessionDraft.date.trim() || sessionDraft.day,
      time: sessionDraft.time || "19:00",
      duration: sessionDraft.duration || "60 min",
      topic: sessionDraft.topic.trim(),
    });
    setSessionDraft({ ...sessionDraft, topic: "", date: "" });
  };

  return (
    <div className="page-enter">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Home</Button>

      <header className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold opacity-75">{event.courseCode} · Study command center</span>
          <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{meta.assessment}</span>
        </div>
        <h1 className="mt-5 max-w-3xl text-2xl font-bold md:text-3xl">{event.course}</h1>
        <p className="mt-1 text-sm opacity-80">{event.type}</p>
        <div className="mt-6 grid gap-4 border-t border-academic-foreground/15 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="opacity-65">Date</p><p className="mt-1 font-semibold">{event.date}</p></div>
          <div><p className="opacity-65">Countdown</p><p className="mt-1 font-semibold">{event.daysLeft} days remaining</p></div>
          <div><p className="opacity-65">Topic mastery</p><p className="mt-1 font-semibold">{mastery}%</p></div>
          <div><p className="opacity-65">Preparation</p><p className="mt-1 font-semibold">{progress}% complete</p></div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-academic-foreground/20"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><ListChecks className="size-5 text-academic" /><h2 className="text-base font-bold">Assessment overview</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Date and place</p>
                <p className="mt-1 text-sm font-semibold">{event.date}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{event.room}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground">Assessment format</p>
                <p className="mt-1 text-sm font-semibold">{meta.format}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Coverage topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {topics.map((topic) => <span key={topic.id} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{topic.title}</span>)}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Important notes</p>
              <ul className="mt-2 space-y-1.5">
                {meta.notes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{note}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-5 flex items-center gap-2"><GraduationCap className="size-5 text-academic" /><h2 className="text-base font-bold">Study roadmap</h2></div>
            <div className="space-y-5">
              {weeks.map((week) => (
                <div key={week}>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Week {week}</p>
                  <div className="space-y-2">
                    {plan.filter((item) => item.week === week).map((item) => (
                      <div key={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3">
                        <button onClick={() => toggle(item.id)} aria-label={`Toggle ${item.label}`} className={`size-5 shrink-0 rounded-full border ${item.done ? "border-academic bg-academic" : "border-input bg-background"}`} />
                        <p className={`min-w-0 text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>{item.label}</p>
                        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_140px_72px_auto]">
              <Input value={itemDraft.label} onChange={(event_) => setItemDraft({ ...itemDraft, label: event_.target.value })} placeholder="Add a study step" className="h-9 text-sm" />
              <select value={itemDraft.category} onChange={(event_) => setItemDraft({ ...itemDraft, category: event_.target.value as StudyItem["category"] })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <Input value={String(itemDraft.week)} onChange={(event_) => setItemDraft({ ...itemDraft, week: Number(event_.target.value) || 1 })} inputMode="numeric" aria-label="Week" className="h-9 text-sm" />
              <Button size="sm" variant="academic" onClick={addItem} aria-label="Add study step"><Plus className="size-4" /></Button>
            </div>
            <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
              {categories.map((category) => {
                const items = plan.filter((item) => item.category === category);
                const done = items.filter((item) => item.done).length;
                const value = items.length ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div key={category} className="rounded-xl bg-muted p-4">
                    <p className="text-xs font-semibold">{category}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-academic">{value}%</p>
                    <Progress value={value} className="mt-2 h-1.5" />
                    <p className="mt-2 text-[11px] text-muted-foreground">{done} of {items.length} done</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-2 flex items-center gap-2"><Target className="size-5 text-academic" /><h2 className="text-base font-bold">Topic mastery</h2></div>
            <p className="mb-4 text-xs text-muted-foreground">Tap a topic to move it to the next level · overall mastery {mastery}%</p>
            <div className="space-y-2">
              {topics.map((topic) => (
                <button key={topic.id} onClick={() => cycleTopic(topic.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-academic">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{topic.title}</p>
                    <Progress value={masteryValue[topic.level]} className="mt-2 h-1.5" />
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${masteryStyle[topic.level]}`}>{topic.level}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="academic-card p-5">
            <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-academic" /><h2 className="text-base font-bold">Connected materials</h2></div>
            <div className="space-y-2">
              {event.resources.map((resource) => {
                const Icon = resourceIcon[resource.kind];
                return (
                  <div key={resource.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border border-border p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{resource.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{resource.kind} · {resource.source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="academic-card p-5">
            <div className="mb-4 flex items-center gap-2"><CalendarPlus className="size-5 text-academic" /><h2 className="text-base font-bold">Study sessions</h2></div>
            <div className="space-y-2">
              {mySessions.length ? mySessions.map((session) => (
                <div key={session.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{session.topic}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <CalendarDays className="size-3" />{session.day} · {session.date} · {session.time}
                      <Clock3 className="size-3" />{session.duration}
                    </p>
                  </div>
                  <button onClick={() => onRemoveSession(session.id)} aria-label={`Remove ${session.topic}`} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              )) : <p className="text-sm text-muted-foreground">No study session scheduled yet.</p>}
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <Input value={sessionDraft.topic} onChange={(event_) => setSessionDraft({ ...sessionDraft, topic: event_.target.value })} placeholder="Session topic" className="h-9 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={sessionDraft.day} onChange={(event_) => setSessionDraft({ ...sessionDraft, day: event_.target.value })} aria-label="Day" className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {weekDayKeys.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
                <Input value={sessionDraft.date} onChange={(event_) => setSessionDraft({ ...sessionDraft, date: event_.target.value })} placeholder="8 Oct" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={sessionDraft.time} onChange={(event_) => setSessionDraft({ ...sessionDraft, time: event_.target.value })} placeholder="19:00" className="h-9 text-sm" />
                <Input value={sessionDraft.duration} onChange={(event_) => setSessionDraft({ ...sessionDraft, duration: event_.target.value })} placeholder="60 min" className="h-9 text-sm" />
              </div>
              <Button variant="academic" size="sm" onClick={addSession}><Plus className="size-4" /> Schedule study session</Button>
              <p className="text-[11px] text-muted-foreground">Sessions appear in the academic calendar as study blocks for {event.course}.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
