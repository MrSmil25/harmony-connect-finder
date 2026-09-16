import { Bell, CalendarDays, Clock3, GraduationCap, ListTodo, Timer, X } from "lucide-react";
import { useMemo, useState } from "react";
import { exams } from "@/components/exam-prep";
import type { PlannedSession } from "@/components/study-command-center";

export type NotificationTask = { id: number; title: string; course: string; due: string; done: boolean };
export type NotificationClass = { id: number; title: string; start: string; location?: string; course?: string; day: string };

type Kind = "Class" | "Deadline" | "Exam" | "Study";
type Notification = { id: string; kind: Kind; title: string; detail: string; when: string };

const kindStyle: Record<Kind, { icon: typeof Bell; tone: string }> = {
  Class: { icon: CalendarDays, tone: "bg-accent text-academic" },
  Deadline: { icon: ListTodo, tone: "bg-destructive/10 text-destructive" },
  Exam: { icon: GraduationCap, tone: "bg-warning/15 text-warning" },
  Study: { icon: Timer, tone: "bg-success/15 text-success" },
};

export function useNotifications(tasks: NotificationTask[], classes: NotificationClass[], sessions: PlannedSession[]) {
  return useMemo<Notification[]>(() => {
    const classItems: Notification[] = classes.slice(0, 2).map(item => ({
      id: `class-${item.id}`,
      kind: "Class",
      title: item.title,
      detail: `${item.location ?? "Campus"}${item.course ? ` · ${item.course}` : ""}`,
      when: `${item.day} · ${item.start}`,
    }));

    const deadlineItems: Notification[] = tasks
      .filter(task => !task.done)
      .slice(0, 3)
      .map(task => ({
        id: `task-${task.id}`,
        kind: "Deadline",
        title: task.title,
        detail: task.course,
        when: `Due ${task.due}`,
      }));

    const examItems: Notification[] = exams.slice(0, 2).map(exam => ({
      id: `exam-${exam.id}`,
      kind: "Exam",
      title: `${exam.type} — ${exam.course}`,
      detail: `${exam.date} · ${exam.room}`,
      when: `${exam.daysLeft} days left`,
    }));

    const sessionItems: Notification[] = sessions.slice(0, 3).map(session => ({
      id: `session-${session.id}`,
      kind: "Study",
      title: `Study session — ${session.topic}`,
      detail: `${session.duration} focused block`,
      when: `${session.date} · ${session.time}`,
    }));

    return [...deadlineItems, ...classItems, ...examItems, ...sessionItems];
  }, [tasks, classes, sessions]);
}

export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Notifications" className="relative grid size-9 place-items-center rounded-full bg-muted text-academic transition-colors hover:bg-accent">
      <Bell className="size-4" />
      {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{count}</span>}
    </button>
  );
}

export function NotificationPanel({ open, onClose, notifications }: { open: boolean; onClose: () => void; notifications: Notification[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  if (!open) return null;
  const visible = notifications.filter(item => !dismissed.includes(item.id));

  return (
    <div className="fixed inset-0 z-50 bg-academic/40 backdrop-blur-sm" onClick={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl" onClick={event => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold">Notifications</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{visible.length} academic reminders</p>
          </div>
          <button onClick={onClose} aria-label="Close notifications" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {!visible.length && <p className="py-10 text-center text-sm text-muted-foreground">You are all caught up.</p>}
          {visible.map(item => {
            const { icon: Icon, tone } = kindStyle[item.kind];
            return (
              <article key={item.id} className="academic-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 p-4">
                <span className={`grid size-9 place-items-center rounded-xl ${tone}`}><Icon className="size-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.detail}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-academic"><Clock3 className="size-3" />{item.when}</p>
                </div>
                <button onClick={() => setDismissed(items => [...items, item.id])} aria-label={`Dismiss ${item.title}`} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
