import { FileText, GraduationCap, ListTodo, NotebookPen, Plus, Timer, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type QuickTask = { title: string; course: string; due: string };
export type QuickNote = { title: string; course: string; body: string };
export type QuickResource = { title: string; course: string; type: string };
export type QuickSession = { day: string; date: string; time: string; duration: string; topic: string };
export type QuickCourse = { name: string; provider: string; sks: number; day: string; time: string; room: string };

type Kind = "Task" | "Note" | "Resource" | "Study session" | "Custom course";

const kinds: { id: Kind; label: string; icon: typeof ListTodo }[] = [
  { id: "Task", label: "Task", icon: ListTodo },
  { id: "Note", label: "Note", icon: NotebookPen },
  { id: "Resource", label: "Resource", icon: FileText },
  { id: "Study session", label: "Session", icon: Timer },
  { id: "Custom course", label: "Course", icon: GraduationCap },
];

const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function QuickAdd({
  courses, onAddTask, onAddNote, onAddResource, onAddSession, onAddCourse,
}: {
  courses: string[];
  onAddTask: (task: QuickTask) => void;
  onAddNote: (note: QuickNote) => void;
  onAddResource: (resource: QuickResource) => void;
  onAddSession: (session: QuickSession) => void;
  onAddCourse?: (course: QuickCourse) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("Task");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState(courses[0] ?? "");
  const [due, setDue] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("Books");
  const [day, setDay] = useState("Mon");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("90 min");
  const [provider, setProvider] = useState("");
  const [sks, setSks] = useState("3");
  const [courseDay, setCourseDay] = useState("Monday");
  const [courseTime, setCourseTime] = useState("08:00 – 10:30");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");

  const reset = () => { setTitle(""); setDue(""); setBody(""); setProvider(""); setRoom(""); };

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    if (kind === "Task") onAddTask({ title: value, course, due: due.trim() || "This week" });
    if (kind === "Note") onAddNote({ title: value, course, body: body.trim() });
    if (kind === "Resource") onAddResource({ title: value, course, type });
    if (kind === "Study session") onAddSession({ day, date: due.trim() || day, time, duration, topic: value });
    if (kind === "Custom course") onAddCourse?.({ name: value, provider: provider.trim() || "Outside curriculum", sks: Number(sks) || 0, day: courseDay, time: courseTime, room: room.trim() });
    setMessage(`${kind} added to your workspace.`);
    reset();
    setTimeout(() => setMessage(""), 2500);
  };

  const needsCourse = kind === "Task" || kind === "Note" || kind === "Resource";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full bg-academic text-academic-foreground shadow-lg transition-transform hover:-translate-y-0.5 md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-academic/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl" onClick={event => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-bold">Quick add</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Create anything without leaving this page.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close quick add" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </header>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-5 gap-2">
                {kinds.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => setKind(id)} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1.5 py-3 text-center text-[11px] font-semibold transition-colors ${kind === id ? "border-academic bg-accent text-academic" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    <Icon className="size-4" />
                    <span className="w-full truncate">{label}</span>
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">{kind === "Study session" ? "Topic" : kind === "Custom course" ? "Course name" : "Title"}</span>
                <Input value={title} onChange={event => setTitle(event.target.value)} placeholder={kind === "Study session" ? "Cost behavior recap" : kind === "Custom course" ? "Digital Marketing (MOOC)" : `New ${kind.toLowerCase()}`} className="mt-1.5" />
              </label>

              {needsCourse && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Course</span>
                  <select value={course} onChange={event => setCourse(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    {courses.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              )}

              {kind === "Task" && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Due</span>
                  <Input value={due} onChange={event => setDue(event.target.value)} placeholder="24 Sep" className="mt-1.5" />
                </label>
              )}

              {kind === "Note" && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Note</span>
                  <Textarea value={body} onChange={event => setBody(event.target.value)} rows={3} placeholder="Key points from the session…" className="mt-1.5" />
                </label>
              )}

              {kind === "Resource" && (
                <label className="block">
                  <span className="text-xs font-semibold text-muted-foreground">Resource type</span>
                  <select value={type} onChange={event => setType(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                    {["Books", "Lecture Slides", "Practice Questions", "Articles", "External References"].map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
              )}

              {kind === "Study session" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Day</span>
                    <select value={day} onChange={event => setDay(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      {dayKeys.map(item => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Date</span>
                    <Input value={due} onChange={event => setDue(event.target.value)} placeholder="2 Oct" className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Time</span>
                    <Input value={time} onChange={event => setTime(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Duration</span>
                    <Input value={duration} onChange={event => setDuration(event.target.value)} className="mt-1.5" />
                  </label>
                </div>
              )}

              {kind === "Custom course" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Provider</span>
                    <Input value={provider} onChange={event => setProvider(event.target.value)} placeholder="MOOC, MBKM, exchange…" className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Credits (SKS)</span>
                    <Input type="number" min={0} value={sks} onChange={event => setSks(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Day</span>
                    <select value={courseDay} onChange={event => setCourseDay(event.target.value)} className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                      {fullDays.map(item => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground">Time</span>
                    <Input value={courseTime} onChange={event => setCourseTime(event.target.value)} className="mt-1.5" />
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-xs font-semibold text-muted-foreground">Room or platform</span>
                    <Input value={room} onChange={event => setRoom(event.target.value)} placeholder="B.211 or Coursera" className="mt-1.5" />
                  </label>
                </div>
              )}

              {message && <p className="rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">{message}</p>}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
                <Button variant="academic" onClick={submit}><Plus /> Add {kind.toLowerCase()}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
