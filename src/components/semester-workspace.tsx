import { useState } from "react";
import { Archive, ExternalLink, GraduationCap, Link2, Plus, Trash2, UserRound, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LINK_KINDS, courseTitle, type ArchivedSemester, type AssistantSession, type CourseLink, type LinkKind } from "@/data/semester";

const fieldClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-academic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>{children}</label>;
}

/** Semester header: current semester, academic year, credits, and active courses. */
export function SemesterWorkspaceCard({ semester, academicYear, completedSks, totalSks, activeSks, activeCount, onOpenCourses }: {
  semester: number; academicYear: string; completedSks: number; totalSks: number; activeSks: number; activeCount: number; onOpenCourses: () => void;
}) {
  const percent = Math.min(Math.round((completedSks / totalSks) * 100), 100);
  return (
    <section className="academic-card overflow-hidden">
      <div className="h-1.5 bg-academic" />
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground"><GraduationCap className="size-3.5 text-academic" />Semester workspace</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Semester {semester}</h2>
            <p className="mt-1 text-sm text-academic">{academicYear}</p>
          </div>
          <button onClick={onOpenCourses} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic">Open courses</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Completed" value={`${completedSks} / ${totalSks}`} hint="SKS" />
          <Stat label="Current credits" value={`${activeSks}`} hint="SKS this semester" />
          <Stat label="Active courses" value={`${activeCount}`} hint="course workspaces" />
          <Stat label="Degree progress" value={`${percent}%`} hint="of 144 SKS" />
        </div>
        <Progress value={percent} className="mt-5 h-2" />
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 font-display text-lg font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{hint}</p></div>;
}

/** Class resource links for one course. */
export function CourseLinksPanel({ code, links, onAdd, onRemove }: {
  code: string; links: CourseLink[]; onAdd: (link: Omit<CourseLink, "id">) => void; onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LinkKind>("Google Classroom");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const submit = () => {
    const clean = url.trim();
    if (!clean) return;
    onAdd({ code, kind, label: label.trim() || kind, url: clean.startsWith("http") ? clean : `https://${clean}` });
    setLabel(""); setUrl(""); setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold">Class resources</h2><p className="mt-1 text-xs text-muted-foreground">Classroom, Drive, Sheets, LMS, and assistant links for this class.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Cancel</> : <><Plus />Add link</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
          <Field label="Type"><select value={kind} onChange={(event) => setKind(event.target.value as LinkKind)} className={fieldClass}>{LINK_KINDS.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Label"><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Class C Drive" className={fieldClass} /></Field>
          <Field label="URL"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className={fieldClass} /></Field>
          <div className="sm:col-span-3"><Button variant="academic" size="sm" onClick={submit}>Save link</Button></div>
        </div>
      )}
      {links.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <article key={link.id} className="academic-card flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{link.kind}</span>
                <h3 className="mt-2 truncate text-sm font-bold">{link.label}</h3>
                <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-academic"><ExternalLink className="size-3.5 shrink-0" />Open link</a>
              </div>
              <button onClick={() => onRemove(link.id)} aria-label="Remove link" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
            </article>
          ))}
        </div>
      ) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No links yet. Add your Classroom, Drive, or LMS link to reach it in one tap.</div>}
    </div>
  );
}

/** Assistant sessions for one course. */
export function AssistantSessionsPanel({ code, section, assistant, sessions, onAdd, onRemove }: {
  code: string; section: string; assistant: string;
  sessions: AssistantSession[]; onAdd: (session: Omit<AssistantSession, "id">) => void; onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ section, assistant, day: "Friday", start: "13:00", end: "14:30", room: "", link: "" });

  const submit = () => {
    onAdd({ code, ...draft, section: draft.section || section, assistant: draft.assistant.trim() || assistant });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold">Assistant sessions</h2><p className="mt-1 text-xs text-muted-foreground">Tutorials run by your assistant lecturer, shown here and in your calendar.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Cancel</> : <><Plus />Add session</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
          <Field label="Class section"><input value={draft.section} onChange={(event) => setDraft({ ...draft, section: event.target.value.toUpperCase().slice(0, 1) })} className={fieldClass} /></Field>
          <Field label="Assistant name"><input value={draft.assistant} onChange={(event) => setDraft({ ...draft, assistant: event.target.value })} className={fieldClass} /></Field>
          <Field label="Day"><select value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} className={fieldClass}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => <option key={day} value={day}>{day}</option>)}</select></Field>
          <Field label="Start"><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} className={fieldClass} /></Field>
          <Field label="End"><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} className={fieldClass} /></Field>
          <Field label="Room"><input value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })} placeholder="e.g. A212 or Online" className={fieldClass} /></Field>
          <div className="sm:col-span-3"><Field label="Online link (optional)"><input value={draft.link} onChange={(event) => setDraft({ ...draft, link: event.target.value })} placeholder="https://meet.google.com/…" className={fieldClass} /></Field></div>
          <div className="sm:col-span-3"><Button variant="academic" size="sm" onClick={submit}>Save session</Button></div>
        </div>
      )}
      {sessions.length ? <AssistantSessionList sessions={sessions} onRemove={onRemove} /> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No assistant session scheduled yet.</div>}
    </div>
  );
}

export function AssistantSessionList({ sessions, showCourse, onRemove }: { sessions: AssistantSession[]; showCourse?: boolean; onRemove?: (id: number) => void }) {
  return (
    <div className="academic-card divide-y divide-border">
      {sessions.map((session) => (
        <article key={session.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-4 p-4">
          <div><p className="font-display text-sm font-bold text-academic">{session.start}</p><p className="mt-1 text-[10px] text-muted-foreground">until {session.end}</p></div>
          <div className="min-w-0 border-l-2 border-primary pl-4">
            <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">Assistant · Class {session.section}</span>
            {showCourse && <h3 className="mt-2 text-sm font-bold">{courseTitle(session.code)}</h3>}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><UserRound className="size-3.5 text-academic" />{session.assistant}</span>
              <span>{session.day} · {session.room || "Room TBA"}</span>
              {session.link && <a href={session.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-academic"><Video className="size-3.5" />Join online</a>}
            </div>
          </div>
          {onRemove && <button onClick={() => onRemove(session.id)} aria-label="Remove session" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}
        </article>
      ))}
    </div>
  );
}

/** Semester history: courses, credits, GPA, resources, notes, completed tasks. */
export function SemesterArchivePanel({ archive, suggestion, onAdd, onRemove }: {
  archive: ArchivedSemester[];
  suggestion: { semester: number; academicYear: string; courses: string[]; sks: number; resources: number; completedTasks: number };
  onAdd: (entry: Omit<ArchivedSemester, "id">) => void;
  onRemove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [gpa, setGpa] = useState("3.50");
  const [notes, setNotes] = useState("");

  const submit = () => {
    onAdd({ ...suggestion, gpa: Number(gpa) || 0, notes: notes.trim() });
    setNotes(""); setOpen(false);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-base font-bold"><Archive className="size-4 text-academic" />Semester archive</h2><p className="mt-1 text-xs text-muted-foreground">Close a semester to keep its courses, credits, GPA, and notes in your academic journey.</p></div>
        <Button variant={open ? "ghost" : "academic"} size="sm" onClick={() => setOpen((value) => !value)}>{open ? <><X />Cancel</> : <><Plus />Archive semester</>}</Button>
      </div>
      {open && (
        <div className="academic-card mb-4 grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">Semester {suggestion.semester} · {suggestion.academicYear} · {suggestion.courses.length} courses · {suggestion.sks} SKS · {suggestion.resources} resources · {suggestion.completedTasks} completed tasks</div>
          <Field label="Semester GPA"><input value={gpa} onChange={(event) => setGpa(event.target.value)} inputMode="decimal" className={fieldClass} /></Field>
          <Field label="Reflection notes"><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What worked this semester?" className={fieldClass} /></Field>
          <div className="sm:col-span-2"><Button variant="academic" size="sm" onClick={submit}>Save to archive</Button></div>
        </div>
      )}
      {archive.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {archive.map((entry) => (
            <article key={entry.id} className="academic-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-semibold text-academic">{entry.academicYear}</p><h3 className="mt-1 font-display text-lg font-bold">Semester {entry.semester}</h3></div>
                <div className="flex items-start gap-3"><span className="rounded-lg bg-academic px-2.5 py-1 text-xs font-semibold text-academic-foreground">GPA {entry.gpa.toFixed(2)}</span><button onClick={() => onRemove(entry.id)} aria-label="Remove archive entry" className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label="Credits" value={`${entry.sks}`} hint="SKS" />
                <Stat label="Resources" value={`${entry.resources}`} hint="saved" />
                <Stat label="Tasks" value={`${entry.completedTasks}`} hint="completed" />
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                {entry.courses.map((code) => <li key={code} className="flex items-center gap-2"><Link2 className="size-3 shrink-0 text-academic" /><span className="truncate">{courseTitle(code)}</span></li>)}
              </ul>
              {entry.notes && <p className="mt-3 rounded-xl bg-muted p-3 text-xs italic text-muted-foreground">“{entry.notes}”</p>}
            </article>
          ))}
        </div>
      ) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No archived semesters yet. Your history builds as you close each semester.</div>}
    </section>
  );
}
