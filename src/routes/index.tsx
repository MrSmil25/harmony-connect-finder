import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3,
  Download, ExternalLink, FileText, Flag, GraduationCap, Hand, Home, Layers, Library, Link2, ListTodo,
  MapPin, Milestone, MoreHorizontal, NotebookPen, Paperclip, Pencil, Plus, Save, Search, Settings, Target, Trash2, UserRound, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryView } from "@/components/library-view";
import { AcademicPerformance, CoursePerformance } from "@/components/performance";

import { AcademicEventCard, StudyCommandCenter, initialStudySessions, type PlannedSession } from "@/components/study-command-center";
import { AcademicJourney, JourneyCard } from "@/components/academic-journey";
import { ExamCenter, exams, type Exam } from "@/components/exam-prep";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell, NotificationPanel, useNotifications } from "@/components/notification-center";
import { QuickAdd } from "@/components/quick-add";
import { WeeklyReview } from "@/components/weekly-review";
import { studentProfile } from "@/data/profile";
import { Onboarding } from "@/components/onboarding";
import { degreeProgress, useSetup, type StudentSetup } from "@/data/setup";
import { courseByCode, type CurriculumCourse } from "@/data/curriculum";
import { academicYearLabel, useSemesterData, type AssistantSession, type CourseLink } from "@/data/semester";
import { AssistantSessionList, AssistantSessionsPanel, CourseLinksPanel, SemesterArchivePanel, SemesterWorkspaceCard } from "@/components/semester-workspace";
import { EmptyState } from "@/components/empty-state";
import { SettingsView } from "@/components/settings";
import type { AcademicExport } from "@/lib/export-data";
import { useAuth } from "@/lib/auth";
import { AuthScreen } from "@/components/auth-screen";
import { CurriculumExplorer } from "@/components/curriculum-explorer";
import { KrsPlanner } from "@/components/krs-planner";
import { useCurriculum, useDashboard, useLibrary, useStudentCourses, type DashboardRow, type StudentCourse } from "@/data/academic";

type View = "home" | "courses" | "curriculum" | "planner" | "calendar" | "tasks" | "library" | "settings";

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Local clock for greeting and date, resolved after hydration to avoid SSR drift. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const hour = now?.getHours() ?? 8;
  return {
    greeting: hour < 11 ? "Good morning" : hour < 15 ? "Good afternoon" : hour < 19 ? "Good evening" : "Good night",
    dayName: now ? weekdayNames[now.getDay()]! : "Wednesday",
    dateLabel: now ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "Wednesday, 16 September",
  };
}
type TaskCategory = "Accounting" | "Marketing" | "Entrepreneurship" | "Research";
type TaskStatus = "Not started" | "In progress" | "Completed";
type ChecklistItem = { id: number; label: string; done: boolean };
type TaskResource = { id: number; kind: "file" | "link"; title: string; ext?: string; size?: number; url?: string };
type Task = {
  id: number; title: string; course: string; courseCode?: string; category: TaskCategory;
  due: string; dueDate: string; priority: "High" | "Medium" | "Low"; status: TaskStatus; done: boolean;
  description: string; resources: TaskResource[]; checklist: ChecklistItem[];
};
type CourseTask = { id: number; title: string; due: string; priority: "High" | "Medium"; status: "Not started" | "In progress" | "Completed" };
type CourseNote = { id: number; title: string; topic: string; body: string; attachment?: string };
type CourseMaterial = { id: number; title: string; type: "Textbook" | "PDF" | "Slides" | "External link" | "Article"; description: string; attachment: string };
type CourseEvent = { type: "Lecture" | "Assistant" | "Exam"; title: string; day: string; time: string; room: string; date?: string };
type Course = { code: string; title: string; sks: number; section?: string; lecturer: string; assistant: string; day: string; time: string; room: string; accent: string; tasks: CourseTask[]; materials: CourseMaterial[]; notes: CourseNote[]; events: CourseEvent[] };

const materialSet: CourseMaterial[] = [
  { id: 1, title: "Core textbook — selected chapters", type: "Textbook", description: "Required reading and weekly chapter guide.", attachment: "Reading guide.pdf" },
  { id: 2, title: "Week 5 course brief", type: "PDF", description: "Discussion framework and learning objectives.", attachment: "Week-5-brief.pdf" },
  { id: 3, title: "Lecture slides — Week 5", type: "Slides", description: "Class deck with lecturer annotations.", attachment: "36 slides" },
  { id: 4, title: "Case study reference", type: "External link", description: "Supplementary industry case for the next discussion.", attachment: "Open reference" },
  { id: 5, title: "Building customer value", type: "Article", description: "A short companion reading for this week’s topic.", attachment: "Article link" },
];

const courses: Course[] = [
  { code: "ECAC600056", title: "Akuntansi Manajemen untuk Bisnis", sks: 3, lecturer: "Rahfiani Khairurzka, S.E., M.A.", assistant: "Nadia Putri, S.E.", day: "Tuesday", time: "08:00 – 10:30", room: "A303", accent: "bg-primary", tasks: [{ id: 201, title: "Cost behavior worksheet", due: "22 Sep", priority: "Medium", status: "In progress" }, { id: 202, title: "Budget variance analysis", due: "29 Sep", priority: "High", status: "Not started" }], materials: materialSet, notes: [{ id: 1, title: "Cost classification", topic: "Week 3", body: "Separate fixed, variable, and mixed costs before building the contribution margin model.", attachment: "cost-model.xlsx" }], events: [{ type: "Lecture", title: "Weekly lecture", day: "Tuesday", time: "08:00 – 10:30", room: "A303" }, { type: "Assistant", title: "Problem-solving session", day: "Wednesday", time: "13:00 – 14:30", room: "Online" }, { type: "Exam", title: "Midterm examination", day: "Monday", date: "12 Oct 2026", time: "09:00 – 11:00", room: "Auditorium FEB" }] },
  { code: "ECMN600040", title: "Manajemen Produk dan Harga", sks: 3, lecturer: "Dr. Karto Adiwijaya, S.E., M.M.", assistant: "Sri Daryanti, S.E., M.M.", day: "Tuesday", time: "11:00 – 13:30", room: "A212", accent: "bg-academic", tasks: [{ id: 203, title: "Pricing strategy analysis", due: "20 Sep", priority: "High", status: "In progress" }, { id: 204, title: "Product portfolio reflection", due: "3 Oct", priority: "Medium", status: "Not started" }], materials: materialSet, notes: [{ id: 2, title: "Value-based pricing", topic: "Pricing", body: "Pricing decisions connect customer value, demand elasticity, and the cost structure." }], events: [{ type: "Lecture", title: "Weekly lecture", day: "Tuesday", time: "11:00 – 13:30", room: "A212" }, { type: "Assistant", title: "Case clinic", day: "Thursday", time: "13:00 – 14:00", room: "Online" }, { type: "Exam", title: "Midterm case presentation", day: "Friday", date: "16 Oct 2026", time: "10:00 – 12:00", room: "A212" }] },
  { code: "ECMN600020", title: "Bisnis Internasional", sks: 3, lecturer: "Aswin Dewanto Hadisumarto, S.E., M.I.A.", assistant: "Fikri Ramadhan, S.E.", day: "Wednesday", time: "08:00 – 10:30", room: "B111", accent: "bg-success", tasks: [{ id: 205, title: "Market entry memo", due: "24 Sep", priority: "High", status: "Not started" }], materials: materialSet, notes: [{ id: 3, title: "Market entry modes", topic: "Week 4", body: "Compare control, commitment, and risk across exporting, licensing, joint ventures, and subsidiaries." }], events: [{ type: "Lecture", title: "Weekly lecture", day: "Wednesday", time: "08:00 – 10:30", room: "B111" }, { type: "Assistant", title: "Reading discussion", day: "Friday", time: "14:00 – 15:00", room: "Online" }, { type: "Exam", title: "Midterm examination", day: "Wednesday", date: "14 Oct 2026", time: "08:00 – 10:00", room: "B111" }] },
  { code: "ECMN600018", title: "Metode Riset Bisnis", sks: 3, lecturer: "Lenny Suardi, S.Si., M.Si.", assistant: "Alya Safira, S.E.", day: "Thursday", time: "14:00 – 16:30", room: "B101", accent: "bg-warning", tasks: [{ id: 206, title: "Research question revision", due: "18 Sep", priority: "High", status: "In progress" }, { id: 207, title: "Literature matrix", due: "28 Sep", priority: "Medium", status: "Not started" }], materials: materialSet, notes: [{ id: 4, title: "Research design map", topic: "Methodology", body: "The research question determines the data, sampling strategy, and analysis method." }], events: [{ type: "Lecture", title: "Weekly lecture", day: "Thursday", time: "14:00 – 16:30", room: "B101" }, { type: "Assistant", title: "Methods lab", day: "Monday", time: "15:00 – 16:00", room: "Lab Komputer" }, { type: "Exam", title: "Research proposal defense", day: "Thursday", date: "22 Oct 2026", time: "13:00 – 16:00", room: "B101" }] },
];

const schedule = [
  { day: "Mon", date: "14", items: [{ time: "08:00", title: "Pengambilan Keputusan Manajerial", room: "A.306", kind: "Lecture" }, { time: "14:00", title: "Pengantar Kewirausahaan", room: "B.211", kind: "Lecture" }] },
  { day: "Tue", date: "15", items: [{ time: "08:00", title: "Akuntansi Manajemen", room: "A.303", kind: "Lecture" }, { time: "11:00", title: "Manajemen Produk dan Harga", room: "A.212", kind: "Lecture" }, { time: "16:00", title: "Review pricing strategy", room: "Library", kind: "Study" }] },
  { day: "Wed", date: "16", items: [{ time: "08:00", title: "Bisnis Internasional", room: "B.111", kind: "Lecture" }, { time: "13:00", title: "Assistant session", room: "Online", kind: "Assistant" }] },
  { day: "Thu", date: "17", items: [{ time: "08:00", title: "Perencanaan Pemasaran", room: "B.110", kind: "Lecture" }, { time: "14:00", title: "Metode Riset Bisnis", room: "B.101", kind: "Lecture" }] },
  { day: "Fri", date: "18", items: [{ time: "10:00", title: "Midterm preparation", room: "FEB Library", kind: "Study" }] },
];

type EventType = "Lecture" | "Assistant" | "Deadline" | "Study";
type CalendarEvent = { id: number; type: EventType; day: string; title: string; start: string; end?: string; location?: string; course?: string; person?: string };

const weekDays = [
  { key: "Mon", label: "Monday", date: "14" },
  { key: "Tue", label: "Tuesday", date: "15" },
  { key: "Wed", label: "Wednesday", date: "16" },
  { key: "Thu", label: "Thursday", date: "17" },
  { key: "Fri", label: "Friday", date: "18" },
  { key: "Sat", label: "Saturday", date: "19" },
  { key: "Sun", label: "Sunday", date: "20" },
];

const today = "Wed";

const calendarEvents: CalendarEvent[] = [
  { id: 1, type: "Lecture", day: "Mon", title: "Pengambilan Keputusan Manajerial", start: "08:00", end: "10:30", location: "Room A.306", course: "Pengambilan Keputusan", person: "Dr. Imam Salehudin" },
  { id: 2, type: "Assistant", day: "Mon", title: "Methods lab", start: "15:00", end: "16:00", location: "Lab Komputer", course: "Metode Riset Bisnis", person: "Alya Safira" },
  { id: 3, type: "Lecture", day: "Tue", title: "Akuntansi Manajemen untuk Bisnis", start: "08:00", end: "10:30", location: "Room A303", course: "Akuntansi Manajemen", person: "Rahfiani Khairurzka" },
  { id: 4, type: "Lecture", day: "Tue", title: "Manajemen Produk dan Harga", start: "11:00", end: "13:30", location: "Room A.212", course: "Manajemen Produk", person: "Dr. Karto Adiwijaya" },
  { id: 5, type: "Study", day: "Tue", title: "Review pricing strategy", start: "16:00", end: "17:30", location: "FEB Library", course: "Manajemen Produk" },
  { id: 6, type: "Lecture", day: "Wed", title: "Bisnis Internasional", start: "08:00", end: "10:30", location: "Room B.111", course: "Bisnis Internasional", person: "Aswin Dewanto Hadisumarto" },
  { id: 7, type: "Assistant", day: "Wed", title: "Problem Solving Session", start: "13:00", end: "14:30", location: "Online", course: "Akuntansi Manajemen", person: "Nadia Putri" },
  { id: 8, type: "Study", day: "Wed", title: "Review Chapter 5", start: "19:00", end: "21:00", location: "Kos · Deep work", course: "Akuntansi Manajemen" },
  { id: 9, type: "Lecture", day: "Thu", title: "Perencanaan Pemasaran", start: "08:00", end: "10:30", location: "Room B.110", course: "Perencanaan Pemasaran", person: "Dr. Daniel Tumpal" },
  { id: 10, type: "Assistant", day: "Thu", title: "Case clinic", start: "13:00", end: "14:00", location: "Online", course: "Manajemen Produk", person: "Sri Daryanti" },
  { id: 11, type: "Lecture", day: "Thu", title: "Metode Riset Bisnis", start: "14:00", end: "16:30", location: "Room B.101", course: "Metode Riset Bisnis", person: "Lenny Suardi" },
  { id: 12, type: "Study", day: "Thu", title: "Literature matrix drafting", start: "19:00", end: "21:00", location: "FEB Library", course: "Metode Riset Bisnis" },
  { id: 13, type: "Assistant", day: "Fri", title: "Reading discussion", start: "14:00", end: "15:00", location: "Online", course: "Bisnis Internasional", person: "Fikri Ramadhan" },
  { id: 14, type: "Deadline", day: "Fri", title: "Pricing Strategy Analysis", start: "23:59", location: "SCELE upload", course: "Manajemen Produk dan Harga" },
  { id: 15, type: "Study", day: "Sat", title: "Midterm preparation block", start: "10:00", end: "12:00", location: "FEB Library", course: "All courses" },
  { id: 16, type: "Deadline", day: "Sun", title: "Cost Behavior Worksheet", start: "23:59", location: "SCELE upload", course: "Akuntansi Manajemen" },
  { id: 17, type: "Study", day: "Sun", title: "Weekly review & planning", start: "16:00", end: "17:00", location: "Personal", course: "Semester planning" },
];

const eventStyles: Record<EventType, { bar: string; dot: string; chip: string; label: string; icon: typeof Clock3 }> = {
  Lecture: { bar: "bg-primary", dot: "bg-primary", chip: "bg-primary/20 text-academic", label: "Lecture", icon: GraduationCap },
  Assistant: { bar: "bg-academic", dot: "bg-academic", chip: "bg-academic/12 text-academic", label: "Assistant session", icon: UserRound },
  Deadline: { bar: "bg-destructive", dot: "bg-destructive", chip: "bg-destructive/12 text-destructive", label: "Deadline", icon: FileText },
  Study: { bar: "bg-success", dot: "bg-success", chip: "bg-success/12 text-success", label: "Personal study", icon: BookOpen },
};

const taskCategories: TaskCategory[] = ["Accounting", "Marketing", "Entrepreneurship", "Research"];

const courseOptions: { course: string; courseCode: string; category: TaskCategory }[] = [
  { course: "Akuntansi Manajemen untuk Bisnis", courseCode: "ECAC600056", category: "Accounting" },
  { course: "Manajemen Produk dan Harga", courseCode: "ECMN600040", category: "Marketing" },
  { course: "Bisnis Internasional", courseCode: "ECMN600020", category: "Entrepreneurship" },
  { course: "Metode Riset Bisnis", courseCode: "ECMN600018", category: "Research" },
];

const priorityStyles: Record<Task["priority"], string> = {
  High: "bg-destructive/12 text-destructive",
  Medium: "bg-primary/25 text-foreground",
  Low: "bg-success/12 text-success",
};

const statusStyles: Record<TaskStatus, string> = {
  "Not started": "bg-muted text-muted-foreground",
  "In progress": "bg-academic/12 text-academic",
  Completed: "bg-success/12 text-success",
};

const initialTasks: Task[] = [
  {
    id: 1, title: "Cost Behavior Worksheet", course: "Akuntansi Manajemen untuk Bisnis", courseCode: "ECAC600056", category: "Accounting",
    due: "Today", dueDate: "16 Sep 2026 · 23:59", priority: "High", status: "In progress", done: false,
    description: "Separate fixed, variable, and mixed costs from the case data, then build the contribution margin model for the Week 3 discussion.",
    resources: [
      { id: 1, kind: "file", title: "Cost Behavior Brief.pdf", ext: "PDF", size: 2516582 },
      { id: 2, kind: "file", title: "cost-model.xlsx", ext: "XLSX", size: 184320 },
      { id: 3, kind: "link", title: "Case Study Dataset", url: "https://drive.google.com/drive/folders/feb-cost-case" },
    ],
    checklist: [
      { id: 1, label: "Classify all cost items", done: true },
      { id: 2, label: "Build contribution margin table", done: true },
      { id: 3, label: "Write interpretation paragraph", done: false },
      { id: 4, label: "Submit to EMAS", done: false },
    ],
  },
  {
    id: 2, title: "Chapter 5 Reading Recap", course: "Bisnis Internasional", courseCode: "ECMN600020", category: "Entrepreneurship",
    due: "Today", dueDate: "16 Sep 2026 · 19:00", priority: "Medium", status: "Not started", done: false,
    description: "Read the market entry chapter and summarise control, commitment, and risk for each entry mode before tomorrow's discussion.",
    resources: [
      { id: 1, kind: "file", title: "Reading guide.pdf", ext: "PDF", size: 841728 },
      { id: 2, kind: "link", title: "Market entry lecture recap", url: "https://www.youtube.com/watch?v=market-entry" },
    ],
    checklist: [
      { id: 1, label: "Read pages 120–148", done: false },
      { id: 2, label: "Write one-page summary", done: false },
    ],
  },
  {
    id: 3, title: "Pricing Strategy Analysis", course: "Manajemen Produk dan Harga", courseCode: "ECMN600040", category: "Marketing",
    due: "18 Sep", dueDate: "18 Sep 2026 · 23:59", priority: "High", status: "In progress", done: false,
    description: "Analyse the pricing ladder of the assigned brand and justify a value-based pricing recommendation.",
    resources: [{ id: 1, kind: "file", title: "pricing-case.pdf", ext: "PDF", size: 1258291 }],
    checklist: [
      { id: 1, label: "Collect competitor prices", done: true },
      { id: 2, label: "Estimate demand elasticity", done: false },
      { id: 3, label: "Draft recommendation slide", done: false },
    ],
  },
  {
    id: 4, title: "Marketing Analysis", course: "Manajemen Produk dan Harga", courseCode: "ECMN600040", category: "Marketing",
    due: "20 Sep", dueDate: "20 Sep 2026 · 23:59", priority: "Medium", status: "Not started", done: false,
    description: "Market segmentation and positioning analysis for the mid-semester product report.",
    resources: [],
    checklist: [{ id: 1, label: "Segment the market", done: false }, { id: 2, label: "Map positioning", done: false }],
  },
  {
    id: 5, title: "Literature Matrix", course: "Metode Riset Bisnis", courseCode: "ECMN600018", category: "Research",
    due: "28 Sep", dueDate: "28 Sep 2026 · 23:59", priority: "Medium", status: "Not started", done: false,
    description: "Compile ten journal articles into a comparison matrix: research question, method, sample, and findings.",
    resources: [
      { id: 1, kind: "file", title: "matrix-template.xlsx", ext: "XLSX", size: 96256 },
      { id: 2, kind: "link", title: "Scopus search results", url: "https://www.scopus.com/results/feb-riset" },
    ],
    checklist: [{ id: 1, label: "Select 10 articles", done: false }, { id: 2, label: "Fill the matrix", done: false }],
  },
  {
    id: 6, title: "Research Question Revision", course: "Metode Riset Bisnis", courseCode: "ECMN600018", category: "Research",
    due: "15 Sep", dueDate: "15 Sep 2026 · 23:59", priority: "High", status: "Completed", done: true,
    description: "Revise the research question based on the assistant's feedback and narrow the scope.",
    resources: [],
    checklist: [{ id: 1, label: "Apply feedback", done: true }, { id: 2, label: "Send to assistant", done: true }],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Rasyid Academic — FEB UI Companion" },
    { name: "description", content: "Rasyid's personal academic command center for courses, schedules, tasks, and study materials." },
    { property: "og:title", content: "Rasyid Academic — FEB UI Companion" },
    { property: "og:description", content: "A personal academic command center for a FEB UI Management student." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AcademicApp,
});

function AcademicApp() {
  const [view, setView] = useState<View>("home");
  const [workspace, setWorkspace] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [exam, setExam] = useState<Exam | null>(null);
  const [journey, setJourney] = useState(false);
  const [studySessions, setStudySessions] = useState<PlannedSession[]>(initialStudySessions);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resourcesAdded, setResourcesAdded] = useState(2);
  const [notesAdded, setNotesAdded] = useState(0);
  const { ready, setup, save: saveSetup, reset: resetSetup } = useSetup();
  const semesterData = useSemesterData();

  const myCourses = useMemo<Course[]>(() => {
    if (!setup || !setup.active.length) return courses;
    const accents = ["bg-primary", "bg-academic", "bg-success", "bg-warning"];
    return setup.active.map((config, index) => {
      const meta = courseByCode.get(config.code);
      const base = courses.find((item) => item.code === config.code);
      const time = `${config.start} – ${config.end}`;
      return {
        code: config.code,
        title: meta?.name ?? base?.title ?? config.code,
        sks: meta?.sks ?? base?.sks ?? 3,
        section: config.section,
        lecturer: config.lecturer.trim() || "To be announced",
        assistant: config.assistant.trim() || "To be announced",
        day: config.day,
        time,
        room: config.room.trim() || "Room TBA",
        accent: accents[index % accents.length] ?? "bg-academic",
        tasks: base?.tasks ?? [],
        materials: materialSet,
        notes: base?.notes ?? [{ id: 1, title: "Course plan", topic: `Class ${config.section}`, body: `${meta?.name ?? config.code} runs on ${config.day}, ${time} in ${config.room || "a room to be announced"}.` }],
        events: [
          { type: "Lecture" as const, title: `Weekly lecture — class ${config.section}`, day: config.day, time, room: config.room || "Room TBA" },
          ...(base?.events.filter((event) => event.type !== "Lecture") ?? []),
        ],
      } satisfies Course;
    });
  }, [setup]);
  const addStudySession = (session: Omit<PlannedSession, "id">) => setStudySessions((items) => [...items, { ...session, id: Date.now() }]);
  const removeStudySession = (id: number) => setStudySessions((items) => items.filter((item) => item.id !== id));

  const notifications = useNotifications(
    tasks.map((task) => ({ id: task.id, title: task.title, course: task.course, due: task.due, done: task.done })),
    calendarEvents.filter((event) => event.type === "Lecture").map((event) => ({ id: event.id, title: event.title, start: event.start, location: event.location ?? "Campus", course: event.course ?? "", day: event.day })),
    studySessions,
  );

  const navigate = (next: View) => { setWorkspace(null); setExam(null); setJourney(false); setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openCurriculumCourse = (item: CurriculumCourse) => {
    const existing = myCourses.find((course) => course.code === item.code);
    setWorkspace(existing ?? {
      code: item.code, title: item.name, sks: item.sks,
      lecturer: "To be announced", assistant: "To be announced",
      day: "Not scheduled", time: "—", room: "—", accent: "bg-academic",
      tasks: [], materials: materialSet,
      notes: [{ id: 1, title: "Course plan", topic: `Semester ${item.semester}`, body: `${item.name} is part of the ${item.group} group in Curriculum 2024 and carries ${item.sks} SKS.` }],
      events: [{ type: "Lecture", title: "Schedule published after course registration", day: "TBA", time: "—", room: "—" }],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleTask = (id: number) => setTasks((items) => items.map((task) => task.id === id
    ? { ...task, done: !task.done, status: (!task.done ? "Completed" : "In progress") as TaskStatus }
    : task));
  const updateTask = (id: number, patch: Partial<Task>) => setTasks((items) => items.map((task) => task.id === id ? { ...task, ...patch } : task));
  const addTask = (task: Task) => setTasks((items) => [task, ...items]);

  const exportData = useMemo<AcademicExport>(() => {
    const stats = degreeProgress(setup?.completed ?? []);
    return {
      courses: myCourses.map((course) => ({ code: course.code, title: course.title, sks: course.sks, ...(course.section ? { section: course.section } : {}), lecturer: course.lecturer, assistant: course.assistant, day: course.day, time: course.time, room: course.room })),
      tasks: tasks.map((task) => ({ title: task.title, course: task.course, due: task.dueDate || task.due, priority: task.priority, status: task.status, done: task.done })),
      notes: myCourses.flatMap((course) => course.notes.map((note) => ({ title: note.title, topic: note.topic, course: course.title, body: note.body }))),
      resources: myCourses.flatMap((course) => course.materials.map((material) => ({ title: material.title, type: material.type, course: course.title, detail: material.attachment }))),
      progress: { currentSemester: setup?.currentSemester ?? studentProfile.currentSemester, completedSks: stats.completedSks, remainingSks: stats.remainingSks, totalSks: stats.totalSks, percent: stats.percent, completedCourses: setup?.completed ?? [] },
    };
  }, [myCourses, tasks, setup]);

  const openCourseByCode = (code: string) => {
    const found = myCourses.find((course) => course.code === code);
    if (found) { setExam(null); setJourney(false); setWorkspace(found); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const openExamForCourse = (code: string) => {
    const found = exams.find((item) => item.courseCode === code);
    if (found) { setWorkspace(null); setExam(found); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  if (ready && !setup) return <Onboarding onComplete={saveSetup} />;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground md:pb-8">
      <DesktopHeader view={view} navigate={navigate} onSearch={() => setSearchOpen(true)} onNotifications={() => setNotifOpen(true)} notificationCount={notifications.length} onSettings={() => navigate("settings")} />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:py-8">
        {exam ? <StudyCommandCenter event={exam} onBack={() => setExam(null)} sessions={studySessions} onAddSession={addStudySession} onRemoveSession={removeStudySession} /> : workspace ? <CourseWorkspace course={workspace} onBack={() => setWorkspace(null)} onOpenExam={openExamForCourse} links={semesterData.links.filter((link) => link.code === workspace.code)} onAddLink={semesterData.addLink} onRemoveLink={semesterData.removeLink} sessions={semesterData.sessions.filter((session) => session.code === workspace.code)} onAddSession={semesterData.addSession} onRemoveSession={semesterData.removeSession} /> : journey ? <AcademicJourney onBack={() => setJourney(false)} onOpenCourse={openCurriculumCourse} setup={setup} /> : (
          <div key={view} className="page-enter">
            {view === "home" && <HomeView tasks={tasks} toggleTask={toggleTask} navigate={navigate} onOpenExam={setExam} onOpenJourney={() => { setJourney(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} onSearch={() => setSearchOpen(true)} onNotifications={() => setNotifOpen(true)} notificationCount={notifications.length} studySessions={studySessions.length} resourcesAdded={resourcesAdded + notesAdded} profile={setup} myCourses={myCourses} onEditSetup={resetSetup} semesterData={semesterData} onSettings={() => navigate("settings")} />}
            {view === "courses" && <CoursesView onOpen={setWorkspace} courses={myCourses} semesterLabel={setup ? `Semester ${setup.currentSemester}` : "Semester Gasal 2026/2027"} />}
            {view === "calendar" && <CalendarView studySessions={studySessions} assistantSessions={semesterData.sessions} />}
            {view === "tasks" && <TasksView tasks={tasks} toggleTask={toggleTask} updateTask={updateTask} addTask={addTask} navigate={navigate} />}
            {view === "library" && <LibraryView />}
            {view === "settings" && <SettingsView setup={setup} data={exportData} progress={degreeProgress(setup?.completed ?? [])} onBack={() => navigate("home")} onEditSetup={resetSetup} />}
          </div>
        )}
      </main>
      {!workspace && !exam && !journey && <BottomNav view={view} navigate={navigate} />}

      <QuickAdd
        courses={myCourses.map((course) => course.title)}
        onAddTask={({ title, course, due }) => {
          const match = myCourses.find((item) => item.title === course);
          addTask({
            id: Date.now(), title, course, courseCode: match?.code ?? "", category: "Research",
            due, dueDate: due, priority: "Medium", status: "Not started", done: false,
            description: "Created from quick add.", resources: [], checklist: [],
          });
        }}
        onAddNote={() => setNotesAdded((count) => count + 1)}
        onAddResource={() => setResourcesAdded((count) => count + 1)}
        onAddSession={({ day, date, time, duration, topic }) => addStudySession({ eventId: exam?.id ?? 1, day, date, time, duration, topic })}
        onAddCourse={({ name, provider, sks, day, time, room }) => {
          if (!setup) return;
          const custom = {
            code: `EXTRA-${Date.now()}`, name, faculty: provider, sks,
            lecturer: provider, day: (day as StudentSetup["active"][number]["day"]), start: time.split(" – ")[0] ?? "08:00",
            end: time.split(" – ")[1] ?? "10:00", room, countsTowardGraduation: false,
          };
          saveSetup({ ...setup, customCourses: [...(setup.customCourses ?? []), custom] });
        }}
      />

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        courses={myCourses}
        tasks={tasks.map((task) => ({ id: task.id, title: task.title, course: task.course, due: task.due, status: task.status }))}
        onOpenCourse={openCourseByCode}
        onNavigate={navigate}
      />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} />
    </div>
  );
}

function Brand() {
  return <div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="size-5" /></div><div className="min-w-0"><p className="font-display text-sm font-bold">RASYID ACADEMIC</p><p className="truncate text-xs text-muted-foreground">{studentProfile.university}</p></div></div>;
}

function DesktopHeader({ view, navigate, onSearch, onNotifications, notificationCount, onSettings }: { view: View; navigate: (view: View) => void; onSearch: () => void; onNotifications: () => void; notificationCount: number; onSettings: () => void }) {
  return <header className="sticky top-0 z-30 hidden border-b border-border bg-surface/95 backdrop-blur md:block"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6"><Brand /><nav className="flex gap-1">{navItems.map(({ id, label }) => <Button key={id} variant={view === id ? "academic" : "ghost"} onClick={() => navigate(id)}>{label}</Button>)}</nav><div className="flex items-center gap-2"><button onClick={onSearch} aria-label="Search" className="grid size-9 place-items-center rounded-full bg-muted text-academic transition-colors hover:bg-accent"><Search className="size-4" /></button><NotificationBell count={notificationCount} onClick={onNotifications} /><button onClick={onSettings} aria-label="Settings" className={`grid size-9 place-items-center rounded-full transition-colors ${view === "settings" ? "bg-academic text-academic-foreground" : "bg-muted text-academic hover:bg-accent"}`}><Settings className="size-4" /></button><button onClick={onSettings} aria-label="Your profile" className="grid size-9 place-items-center rounded-full bg-academic text-sm font-bold text-academic-foreground">{studentProfile.initials}</button></div></div></header>;
}


const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home }, { id: "courses", label: "Courses", icon: BookOpen }, { id: "calendar", label: "Calendar", icon: CalendarDays }, { id: "tasks", label: "Tasks", icon: ListTodo }, { id: "library", label: "Library", icon: Library },
];

function BottomNav({ view, navigate }: { view: View; navigate: (view: View) => void }) {
  return <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 px-2 pt-2 shadow-[0_-8px_24px_color-mix(in_oklab,var(--academic)_8%,transparent)] backdrop-blur md:hidden">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} aria-label={label} className={`flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors ${view === id ? "text-academic" : "text-muted-foreground"}`}><span className={`grid size-8 place-items-center rounded-xl ${view === id ? "bg-primary" : ""}`}><Icon className="size-4" /></span>{label}</button>)}</nav>;
}

function MobileTop({ eyebrow, title, action }: { eyebrow: string; title: React.ReactNode; action?: React.ReactNode }) {
  return <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:hidden"><div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase text-academic">{eyebrow}</p><h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-8">{title}</h1></div>{action}</div>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">{title}</h2>{action}</div>; }

function HomeView({ tasks, toggleTask, navigate, onOpenExam, onOpenJourney, onSearch, onNotifications, notificationCount, studySessions, resourcesAdded, profile, myCourses, onEditSetup, semesterData, onSettings }: { tasks: Task[]; toggleTask: (id: number) => void; navigate: (view: View) => void; onOpenExam: (exam: Exam) => void; onOpenJourney: () => void; onSearch: () => void; onNotifications: () => void; notificationCount: number; studySessions: number; resourcesAdded: number; profile: StudentSetup | null; myCourses: Course[]; onEditSetup: () => void; semesterData: ReturnType<typeof useSemesterData>; onSettings: () => void }) {
  const { greeting, dayName, dateLabel } = useNow();
  const openTasks = tasks.filter((task) => !task.done);
  const featuredTask = openTasks[0];
  const quickActions = navItems.filter((item) => item.id !== "home");
  const defaultUpcoming = [
    { label: "Next class", day: "Today", time: "11:00 – 13:30", title: "Manajemen Produk dan Harga", room: "A.212", color: "bg-academic" },
    { label: "Tomorrow", day: "Thursday", time: "08:00 – 10:30", title: "Perencanaan Pemasaran", room: "B.110", color: "bg-primary" },
    { label: "Tomorrow", day: "Thursday", time: "14:00 – 16:30", title: "Metode Riset Bisnis", room: "B.101", color: "bg-warning" },
  ];
  const todayName = dayName;
  const todayClasses = profile ? myCourses.filter((course) => course.day === todayName) : [];
  const upcoming = profile
    ? myCourses.slice(0, 4).map((course) => ({ label: course.day === todayName ? "Today" : "This week", day: `${course.day} · Class ${course.section ?? "-"}`, time: course.time, title: course.title, room: course.room, color: course.accent }))
    : defaultUpcoming;
  const studentName = profile?.name ?? studentProfile.name;
  const semesterNumber = profile?.currentSemester ?? studentProfile.currentSemester;
  const progressStats = degreeProgress(profile?.completed ?? []);
  const activeSks = myCourses.reduce((total, course) => total + course.sks, 0);

  return <div>
    <MobileTop eyebrow={dateLabel} title={<>{greeting}, {studentName.split(" ")[0]} <Hand aria-label="waving hand" className="size-5 text-warning" /></>} action={<div className="flex items-center gap-2"><button onClick={onSearch} aria-label="Search" className="grid size-9 place-items-center rounded-full bg-muted text-academic"><Search className="size-4" /></button><NotificationBell count={notificationCount} onClick={onNotifications} /><button onClick={onSettings} aria-label="Your profile and settings" className="grid size-10 place-items-center rounded-full bg-academic text-xs font-bold text-academic-foreground">{studentProfile.initials}</button></div>} />
    <section className="mb-8 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground shadow-lg md:p-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold opacity-80"><span className="size-2 rounded-full bg-primary" />SEMESTER {semesterNumber} · {academicYearLabel(profile?.entryYear ?? studentProfile.entryYear, semesterNumber).toUpperCase()}<span className="opacity-60">· {dateLabel}</span></div><h1 className="mt-3 hidden items-center gap-3 text-3xl font-bold md:flex">{greeting}, {studentName.split(" ")[0]} <Hand aria-label="waving hand" className="size-7 text-primary" /></h1><p className="mt-2 text-sm opacity-85">{profile?.program ?? studentProfile.program} · {profile?.faculty ?? studentProfile.faculty} · {profile?.university ?? studentProfile.university}</p><p className="mt-1 text-xs opacity-70">Angkatan {profile?.entryYear ?? studentProfile.entryYear} · Semester {semesterNumber} · {profile ? `${myCourses.length} active courses · ${activeSks} SKS · ${openTasks.length} open tasks` : `Target GPA ${studentProfile.targetGpa.toFixed(2)}`}</p><div className="mt-3 flex flex-wrap gap-2">{profile && <button onClick={onEditSetup} className="rounded-full bg-academic-foreground/15 px-3 py-1 text-[11px] font-semibold">Edit academic setup</button>}<button onClick={onSettings} className="rounded-full bg-academic-foreground/15 px-3 py-1 text-[11px] font-semibold">Workspace settings</button></div></div>
        <div className="grid grid-cols-3 gap-2 md:min-w-80"><DashboardStat label="Current semester" value={`Semester ${semesterNumber}`} /><DashboardStat label="Completed credits" value={profile ? `${progressStats.completedSks} SKS` : "24 SKS"} /><DashboardStat label="Degree progress" value={profile ? `${progressStats.percent}%` : "60%"} /></div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-academic-foreground/20"><div className="h-full rounded-full bg-primary" style={{ width: `${profile ? progressStats.percent : 60}%` }} /></div>
    </section>

    <div className="space-y-8">
      <SemesterWorkspaceCard semester={semesterNumber} academicYear={academicYearLabel(profile?.entryYear ?? studentProfile.entryYear, semesterNumber)} completedSks={progressStats.completedSks} totalSks={progressStats.totalSks} activeSks={activeSks} activeCount={myCourses.length} onOpenCourses={() => navigate("courses")} />

      {semesterData.sessions.length ? <section><SectionHeader title="Assistant sessions" /><AssistantSessionList sessions={semesterData.sessions} showCourse /></section> : null}

      {profile ? <section><SectionHeader title="Today’s schedule" action={<button onClick={() => navigate("calendar")} className="text-xs font-semibold text-academic">Full schedule</button>} />{todayClasses.length ? <div className="academic-card divide-y divide-border">{todayClasses.map((course) => <article key={course.code} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 sm:items-center"><div><p className="font-display text-sm font-bold text-academic">{course.time.split(" – ")[0]}</p><p className="mt-1 text-[10px] text-muted-foreground">until {course.time.split(" – ")[1] ?? ""}</p></div><div className="min-w-0 border-l-2 border-primary pl-4"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">Class {course.section}</span><h3 className="mt-2 text-sm font-bold">{course.title}</h3><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-academic" />{course.room}</span><span className="flex items-center gap-1.5"><UserRound className="size-3.5 text-academic" />{course.lecturer}</span></div></div></article>)}</div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No classes scheduled today. A good day for deep work.</div>}</section> : <section><SectionHeader title="Today’s focus" action={<button onClick={() => navigate("calendar")} className="text-xs font-semibold text-academic">Full schedule</button>} /><article className="academic-card overflow-hidden"><div className="flex"><div className="w-2 shrink-0 bg-primary" /><div className="min-w-0 flex-1 p-5 md:p-6"><div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Today</p><p className="mt-1 font-display text-xl font-bold text-academic">08:00</p><p className="text-xs text-muted-foreground">until 10:30</p></div><div className="min-w-0 sm:border-l sm:border-border sm:pl-6"><span className="inline-flex items-center gap-2 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic"><span className="size-1.5 rounded-full bg-primary" />Lecture</span><h3 className="mt-3 text-lg font-bold md:text-xl">Akuntansi Manajemen untuk Bisnis</h3><div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-2"><MapPin className="size-4 text-academic" />Room A.303</span><span className="flex items-center gap-2"><UserRound className="size-4 text-academic" />Rahfiani Khairurzka</span></div></div></div></div></div></article></section>}

      <section><SectionHeader title="Upcoming classes" /><div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{upcoming.map((item) => <article key={item.time + item.title} className="academic-card min-w-[78%] snap-start overflow-hidden sm:min-w-72"><div className={`h-1.5 ${item.color}`} /><div className="p-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-academic">{item.label}</span><span className="text-muted-foreground">{item.day}</span></div><h3 className="mt-4 min-h-10 text-sm font-bold leading-5">{item.title}</h3><div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{item.time}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{item.room}</span></div></div></article>)}</div></section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]"><section><SectionHeader title="Task center" action={<button onClick={() => navigate("tasks")} className="text-xs font-semibold text-academic">All tasks · {openTasks.length}</button>} />{featuredTask ? <article className="academic-card p-5"><div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"><button onClick={() => toggleTask(featuredTask.id)} aria-label={`Complete ${featuredTask.title}`} className="mt-0.5 grid size-6 place-items-center rounded-full border border-input bg-background" /><div className="min-w-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-base font-bold">{featuredTask.title}</h3><p className="mt-1 text-xs text-muted-foreground">{featuredTask.course}</p></div><div className="flex gap-2"><span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-academic">Due {featuredTask.due}</span><span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold text-destructive">{featuredTask.priority}</span></div></div><div className="mt-5 flex items-center gap-3"><Progress value={featuredTask.checklist.length ? Math.round((featuredTask.checklist.filter((item) => item.done).length / featuredTask.checklist.length) * 100) : 0} className="h-2 flex-1" /><span className="text-xs font-bold text-academic">{featuredTask.checklist.length ? Math.round((featuredTask.checklist.filter((item) => item.done).length / featuredTask.checklist.length) * 100) : 0}%</span></div></div></div></article> : <EmptyState
        icon={ListTodo}
        eyebrow="Task center"
        title={tasks.length ? "Every assignment is done" : "No assignment is tracked yet"}
        description={tasks.length ? "Nothing is waiting for you right now. Plan a study block, or look ahead at what the next weeks bring." : "Add your first assignment so deadlines, checklists, and course materials stay in one place instead of scattered across chats."}
        actions={[
          { label: tasks.length ? "Plan the week" : "Create first task", icon: Plus, onClick: () => navigate("tasks") },
          { label: "Open calendar", icon: CalendarDays, onClick: () => navigate("calendar") },
        ]}
        hints={["Tasks can hold a checklist, files, and links", "Quick add (+) creates a task from any page"]}
        compact
      />}</section>

        <section><SectionHeader title="Academic progress" /><div className="academic-card p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Degree progress · Semester {semesterNumber}</p><p className="mt-1 font-display text-3xl font-bold">{progressStats.percent}%</p></div><div className="grid size-16 place-items-center rounded-full border-8 border-accent text-xs font-bold text-academic">{progressStats.percent}%</div></div><Progress value={progressStats.percent} className="mt-5 h-2" /><div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Completed SKS" value={String(progressStats.completedSks)} /><Metric label="Active courses" value={String(myCourses.length)} /><Metric label="Tasks left" value={String(openTasks.length)} /></div><button onClick={onOpenJourney} className="mt-4 w-full rounded-xl bg-muted py-2.5 text-xs font-semibold text-academic">See academic journey</button></div></section></div>

      <SemesterArchivePanel archive={semesterData.archive} suggestion={{ semester: semesterNumber, academicYear: academicYearLabel(profile?.entryYear ?? studentProfile.entryYear, semesterNumber), courses: myCourses.map((course) => course.code), sks: activeSks, resources: resourcesAdded, completedTasks: tasks.filter((task) => task.done).length }} onAdd={semesterData.addArchive} onRemove={semesterData.removeArchive} />

      <SemesterTimeline />

      <JourneyCard onOpen={onOpenJourney} setup={profile ?? null} />

      <AcademicEventCard onPrepare={onOpenExam} />

      <ExamCenter onOpen={onOpenExam} />

      <AcademicPerformance />

      <WeeklyReview completedTasks={tasks.filter(task => task.done).length} totalTasks={tasks.length} studySessions={studySessions} classesAttended={5} resourcesAdded={resourcesAdded} />

      <section><SectionHeader title="Quick actions" /><div className="grid grid-cols-4 gap-2 sm:gap-3">{quickActions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => navigate(id)} className="academic-card flex min-w-0 flex-col items-center gap-2 px-2 py-4 text-center transition-transform hover:-translate-y-0.5"><span className="grid size-9 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-4" /></span><span className="w-full truncate text-[11px] font-semibold sm:text-xs">{label}</span></button>)}</div></section>
    </div>
  </div>;
}

const SEMESTER_WEEKS = 16;
const CURRENT_WEEK = 5;
const SEMESTER_PROGRESS = 35;

type AcademicMilestone = { id: number; title: string; date: string; course: string; week: number };

const academicMilestones: AcademicMilestone[] = [
  { id: 1, title: "UTS — Ujian Tengah Semester", date: "12 October", course: "All courses", week: 7 },
  { id: 2, title: "Project Presentation", date: "20 October", course: "Metode Riset Bisnis", week: 8 },
  { id: 3, title: "Final Exam — UAS", date: "15 December", course: "All courses", week: 16 },
];

function SemesterTimeline() {
  const weeks = Array.from({ length: SEMESTER_WEEKS }, (_, index) => index + 1);
  const milestoneByWeek = new Map(academicMilestones.map(milestone => [milestone.week, milestone]));

  return (
    <section>
      <SectionHeader title="Semester timeline" action={<span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">Week {CURRENT_WEEK} of {SEMESTER_WEEKS}</span>} />
      <div className="academic-card p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:items-start">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Current semester</p>
                <h3 className="mt-1 text-lg font-bold">Semester Gasal 2026/2027</h3>
              </div>
              <p className="font-display text-2xl font-bold text-academic">{SEMESTER_PROGRESS}%</p>
            </div>
            <Progress value={SEMESTER_PROGRESS} className="mt-4 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">{SEMESTER_PROGRESS}% completed · week {CURRENT_WEEK} of {SEMESTER_WEEKS}</p>

            <div className="mt-6">
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-16">
                {weeks.map(week => {
                  const isPast = week < CURRENT_WEEK;
                  const isCurrent = week === CURRENT_WEEK;
                  const milestone = milestoneByWeek.get(week);
                  return (
                    <div key={week} className="group relative">
                      <div
                        title={`Week ${week}${milestone ? ` — ${milestone.title}` : ""}`}
                        className={`h-8 rounded-md border transition-colors ${isPast ? "border-academic bg-academic" : isCurrent ? "border-primary bg-primary shadow-[0_0_0_3px] shadow-primary/30" : "border-input bg-muted"} ${milestone && !isPast && !isCurrent ? "border-academic/50" : ""}`}
                      />
                      {milestone && <span className={`absolute -top-1.5 right-0 size-2 rounded-full ${isPast ? "bg-warning" : "bg-academic"}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>Week 1</span>
                <span className="flex items-center gap-1 font-bold text-academic"><Flag className="size-3 text-warning" />You are here — Week {CURRENT_WEEK}</span>
                <span>Week {SEMESTER_WEEKS}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-academic" />Completed weeks</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" />Current week</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-muted ring-1 ring-input" />Upcoming</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-academic" />Milestone</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Milestone className="size-4 text-academic" />Upcoming milestones</p>
            {academicMilestones.filter(milestone => milestone.week >= CURRENT_WEEK).map(milestone => (
              <article key={milestone.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl bg-muted p-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-academic"><Flag className="size-4" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="truncate text-sm font-bold">{milestone.title}</h4>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">{milestone.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{milestone.course} · Week {milestone.week}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-academic-foreground/10 p-3"><p className="truncate text-[9px] opacity-70">{label}</p><p className="mt-1 truncate text-xs font-bold">{value}</p></div>; }

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>; }

function CoursesView({ onOpen, courses, semesterLabel }: { onOpen: (course: Course) => void; courses: Course[]; semesterLabel: string }) {
  return <div><MobileTop eyebrow={semesterLabel} title="My Courses" /><div className="mb-7 hidden md:block"><p className="text-sm text-academic">{semesterLabel}</p><h1 className="mt-1 text-3xl font-bold">My Courses</h1></div><div className="mb-5 flex gap-2 overflow-x-auto pb-1"><span className="shrink-0 rounded-full bg-academic px-3 py-1.5 text-xs font-semibold text-academic-foreground">Current semester · {courses.length}</span><span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Today · 2 classes</span></div><div className="grid gap-4 sm:grid-cols-2">{courses.map(course => { const taskCount = course.tasks.filter(task => task.status !== "Completed").length; return <button key={course.code} onClick={() => onOpen(course)} className="academic-card group overflow-hidden text-left transition-transform hover:-translate-y-0.5"><div className={`h-2 ${course.accent}`} /><div className="p-5"><div className="flex items-start justify-between gap-4"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-academic">{course.code}{course.section && <span className="grid size-5 shrink-0 place-items-center rounded-md bg-academic text-[10px] font-bold text-academic-foreground">{course.section}</span>}</span><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{course.sks} SKS</span></div><h2 className="mt-3 min-h-12 text-base font-bold leading-6">{course.title}</h2><div className="mt-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Lecturer</p><p className="mt-1 line-clamp-1 text-sm font-medium">{course.lecturer}</p></div><div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-border pt-4"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Next class</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold"><CalendarDays className="size-3.5 shrink-0 text-academic" />{course.day}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5 shrink-0" />{course.time}</p></div><div className="text-right"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Room</p><p className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold"><MapPin className="size-3.5 text-academic" />{course.room}</p><span className="mt-2 inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{taskCount} upcoming {taskCount === 1 ? "task" : "tasks"}</span></div></div><div className="mt-4 flex items-center justify-between text-xs font-semibold text-academic"><span>Open workspace</span><ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></div></div></button>; })}</div></div>;
}

function CourseWorkspace({ course, onBack, onOpenExam, links, onAddLink, onRemoveLink, sessions, onAddSession, onRemoveSession }: { course: Course; onBack: () => void; onOpenExam: (code: string) => void; links: CourseLink[]; onAddLink: (link: Omit<CourseLink, "id">) => void; onRemoveLink: (id: number) => void; sessions: AssistantSession[]; onAddSession: (session: Omit<AssistantSession, "id">) => void; onRemoveSession: (id: number) => void }) {
  const courseExam = exams.find((item) => item.courseCode === course.code);
  const [notes, setNotes] = useState(course.notes);
  const [courseTasks, setCourseTasks] = useState(course.tasks);
  const [materials, setMaterials] = useState(course.materials);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", topic: "", body: "", attachment: "" });
  const assistantEvent = course.events.find(event => event.type === "Assistant");
  const completedTasks = courseTasks.filter(task => task.status === "Completed").length;
  const progress = courseTasks.length ? Math.round((completedTasks / courseTasks.length) * 100) : 0;
  const openTasks = courseTasks.filter(task => task.status !== "Completed");
  const resetNoteForm = () => { setShowNoteForm(false); setEditingNote(null); setNoteDraft({ title: "", topic: "", body: "", attachment: "" }); };
  const saveNote = () => { if (!noteDraft.title.trim() || !noteDraft.body.trim()) return; if (editingNote !== null) setNotes(items => items.map(note => note.id === editingNote ? { ...note, ...noteDraft, title: noteDraft.title.trim(), body: noteDraft.body.trim() } : note)); else setNotes(items => [{ id: Date.now(), ...noteDraft, title: noteDraft.title.trim(), body: noteDraft.body.trim() }, ...items]); resetNoteForm(); };
  const editNote = (note: CourseNote) => { setEditingNote(note.id); setNoteDraft({ title: note.title, topic: note.topic, body: note.body, attachment: note.attachment ?? "" }); setShowNoteForm(true); };
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: "", due: "" });
  const saveCourseTask = () => { const title = taskDraft.title.trim(); if (!title) return; setCourseTasks(items => [{ id: Date.now(), title, due: taskDraft.due.trim() || "This week", priority: "Medium", status: "Not started" }, ...items]); setTaskDraft({ title: "", due: "" }); setShowTaskForm(false); };
  const completeCourseTask = (id: number) => setCourseTasks(items => items.map(task => task.id === id ? { ...task, status: task.status === "Completed" ? "Not started" : "Completed" } : task));
  return <div className="page-enter"><Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2"><ArrowLeft /> Courses</Button><div className="mb-6 overflow-hidden rounded-2xl bg-academic p-5 text-academic-foreground md:p-8"><div className="flex items-center justify-between"><span className="text-xs font-semibold opacity-75">{course.code}</span><span className="rounded-lg bg-academic-foreground/15 px-2.5 py-1 text-xs font-semibold">{course.sks} SKS</span></div><h1 className="mt-5 max-w-3xl text-2xl font-bold md:text-3xl">{course.title}</h1><div className="mt-6 grid gap-4 border-t border-academic-foreground/15 pt-5 text-xs sm:grid-cols-2 lg:grid-cols-4"><HeaderInfo label="Lecturer" value={course.lecturer} /><HeaderInfo label="Assistant lecturer" value={course.assistant} /><HeaderInfo label="Weekly schedule" value={`${course.day}, ${course.time}`} /><HeaderInfo label="Room" value={course.room} /></div></div><Tabs defaultValue="overview"><TabsList className="mb-5 flex h-auto w-full justify-start overflow-x-auto bg-transparent p-0"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="materials">Materials</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="tasks">Tasks</TabsTrigger><TabsTrigger value="performance">Performance</TabsTrigger><TabsTrigger value="schedule">Schedule</TabsTrigger><TabsTrigger value="links">Resources</TabsTrigger><TabsTrigger value="assistant">Assistant</TabsTrigger><TabsTrigger value="exam">Exam prep</TabsTrigger></TabsList><TabsContent value="overview"><div className="grid gap-4 md:grid-cols-2"><InfoCard title="Course summary" icon={BookOpen}><p className="text-sm leading-6 text-muted-foreground">Your personal space to connect weekly concepts, prepare for class, and keep every resource and deadline for {course.title} in one place.</p><Info label="Course code" value={course.code} /><Info label="Academic period" value="Semester Gasal 2026/2027" /></InfoCard><InfoCard title="Current progress" icon={CheckCircle2}><div className="flex items-end justify-between"><div><p className="font-display text-3xl font-bold">{progress}%</p><p className="mt-1 text-xs text-muted-foreground">{completedTasks} of {courseTasks.length} tasks completed</p></div><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{openTasks.length} remaining</span></div><Progress value={progress} className="h-2" /></InfoCard><InfoCard title="Course team" icon={UserRound}><Info label="Lecturer" value={course.lecturer} /><Info label="Assistant lecturer" value={course.assistant} /><Info label="Assistant session" value={assistantEvent ? `${assistantEvent.day}, ${assistantEvent.time} · ${assistantEvent.room}` : "Not scheduled"} /></InfoCard><InfoCard title="Upcoming deadlines" icon={Clock3}>{openTasks.length ? openTasks.map(task => <div key={task.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">Due {task.due}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${task.priority === "High" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{task.priority}</span></div>) : <p className="text-sm text-muted-foreground">No outstanding deadlines.</p>}</InfoCard></div></TabsContent><TabsContent value="materials"><MaterialsPanel materials={materials} setMaterials={setMaterials} /></TabsContent><TabsContent value="notes"><NotesPanel notes={notes} showForm={showNoteForm} editingNote={editingNote} draft={noteDraft} setDraft={setNoteDraft} onCreate={() => { resetNoteForm(); setShowNoteForm(true); }} onSave={saveNote} onCancel={resetNoteForm} onEdit={editNote} onDelete={id => setNotes(items => items.filter(note => note.id !== id))} /></TabsContent><TabsContent value="tasks"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-bold">Course tasks</h2><p className="mt-1 text-xs text-muted-foreground">{openTasks.length} tasks still need your attention.</p></div><div className="flex items-center gap-3"><Button variant="yellow" size="sm" onClick={() => setShowTaskForm(true)}><Plus /> Add task</Button><span className="text-sm font-bold text-academic">{progress}%</span></div></div><Progress value={progress} className="mb-5 h-2" />{showTaskForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]"><input aria-label="Task title" value={taskDraft.title} onChange={event => setTaskDraft(current => ({ ...current, title: event.target.value }))} placeholder="Assignment title" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input aria-label="Due date" value={taskDraft.due} onChange={event => setTaskDraft(current => ({ ...current, due: event.target.value }))} placeholder="24 Sep" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setShowTaskForm(false)}>Cancel</Button><Button variant="academic" size="sm" onClick={saveCourseTask}><Save />Save task</Button></div></div>}{courseTasks.length ? <div className="space-y-3">{courseTasks.map(task => <CourseTaskRow key={task.id} task={task} onToggle={() => completeCourseTask(task.id)} />)}</div> : <EmptyState icon={ListTodo} eyebrow="Course tasks" title="No assignment for this course yet" description="Add the assignments, cases, and quizzes announced in class so this course keeps its own deadline list." actions={[{ label: "Create assignment", icon: Plus, onClick: () => setShowTaskForm(true) }]} hints={["Copy deadlines straight from the syllabus", "Weekly exercises count too", "Completed tasks feed the progress bar above"]} />}</TabsContent><TabsContent value="performance"><CoursePerformance courseTitle={course.title} /></TabsContent><TabsContent value="schedule"><SchedulePanel events={course.events} />{sessions.length ? <div className="mt-6"><h2 className="mb-3 text-base font-bold">Assistant sessions</h2><AssistantSessionList sessions={sessions} onRemove={onRemoveSession} /></div> : null}</TabsContent><TabsContent value="links"><CourseLinksPanel code={course.code} links={links} onAdd={onAddLink} onRemove={onRemoveLink} /></TabsContent><TabsContent value="assistant"><AssistantSessionsPanel code={course.code} section={course.section ?? "A"} assistant={course.assistant} sessions={sessions} onAdd={onAddSession} onRemove={onRemoveSession} /></TabsContent><TabsContent value="exam">{courseExam ? <div className="academic-card p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-academic">{courseExam.type}</span><h3 className="mt-3 text-lg font-bold">{courseExam.course}</h3><p className="mt-1 text-sm text-muted-foreground">{courseExam.date} · {courseExam.room}</p></div><span className="rounded-xl bg-academic px-3 py-2 text-xs font-semibold text-academic-foreground">{courseExam.daysLeft} days left</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{courseExam.resources.slice(0, 3).map(resource => <div key={resource.id} className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{resource.kind}</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{resource.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{resource.source}</p></div>)}</div><Button variant="academic" className="mt-5" onClick={() => onOpenExam(course.code)}>Open study command center<ChevronRight /></Button></div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No assessment scheduled for this course yet.</div>}</TabsContent></Tabs></div>;
}

function HeaderInfo({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="opacity-65">{label}</p><p className="mt-1 line-clamp-2 font-semibold">{value}</p></div>; }
function InfoCard({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: React.ReactNode }) { return <section className="academic-card p-5"><div className="mb-5 flex items-center gap-2"><Icon className="size-5 text-academic" /><h2 className="text-base font-bold">{title}</h2></div><div className="space-y-4">{children}</div></section>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
function MaterialsPanel({ materials, setMaterials }: { materials: CourseMaterial[]; setMaterials: React.Dispatch<React.SetStateAction<CourseMaterial[]>> }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<{ title: string; type: CourseMaterial["type"]; description: string; attachment: string }>({ title: "", type: "PDF", description: "", attachment: "" });
  const saveMaterial = () => { if (!draft.title.trim() || !draft.description.trim()) return; setMaterials(items => [{ id: Date.now(), ...draft, title: draft.title.trim(), description: draft.description.trim(), attachment: draft.attachment || "Saved resource" }, ...items]); setDraft({ title: "", type: "PDF", description: "", attachment: "" }); setShowForm(false); };
  const iconFor = (type: CourseMaterial["type"]) => type === "Textbook" ? BookOpen : type === "External link" || type === "Article" ? Link2 : FileText;
  return <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Academic resources</h2><p className="mt-1 text-xs text-muted-foreground">Reading, files, and references for this course.</p></div><Button variant="yellow" size="sm" onClick={() => setShowForm(true)}><Plus /> Add resource</Button></div>{showForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Resource title" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Resource title" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><select aria-label="Resource type" value={draft.type} onChange={event => setDraft(current => ({ ...current, type: event.target.value as CourseMaterial["type"] }))} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">{["Textbook", "Slides", "PDF", "External link", "Article"].map(type => <option key={type}>{type}</option>)}</select></div><textarea aria-label="Resource description" value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} placeholder="Brief description" className="mt-3 min-h-24 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground"><Paperclip className="size-4 text-academic" /><span className="min-w-0 flex-1 truncate">{draft.attachment || "Attach a file or save a link"}</span><input type="file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) setDraft(current => ({ ...current, attachment: file.name })); }} /></label><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="academic" size="sm" onClick={saveMaterial}><Save />Save resource</Button></div></div>}{materials.length ? <div className="academic-card divide-y divide-border">{materials.map(material => { const Icon = iconFor(material.type); const isLink = material.type === "External link" || material.type === "Article"; const ActionIcon = isLink ? ExternalLink : Download; return <article key={material.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-academic"><Icon className="size-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{material.title}</h3><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">{material.type}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{material.description}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-academic"><Paperclip className="size-3" />{material.attachment}</p></div><Button variant="ghost" size="sm" className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-auto"><ActionIcon />{isLink ? "Open" : "Download"}</Button></article>; })}</div> : <EmptyState icon={FileText} eyebrow="Course materials" title="No material saved for this course" description="Keep every slide deck, textbook chapter, and reading link for this course in one shelf so you never dig through chats before class." actions={[{ label: "Add first resource", icon: Plus, onClick: () => setShowForm(true) }]} hints={["Upload lecture slides right after class", "Save the reference textbook and its chapters", "Paste links to journal articles or recorded sessions"]} />}</div>;
}

function NotesPanel({ notes, showForm, editingNote, draft, setDraft, onCreate, onSave, onCancel, onEdit, onDelete }: { notes: CourseNote[]; showForm: boolean; editingNote: number | null; draft: { title: string; topic: string; body: string; attachment: string }; setDraft: React.Dispatch<React.SetStateAction<{ title: string; topic: string; body: string; attachment: string }>>; onCreate: () => void; onSave: () => void; onCancel: () => void; onEdit: (note: CourseNote) => void; onDelete: (id: number) => void }) { return <div><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-bold">Personal study notes</h2><p className="mt-1 text-xs text-muted-foreground">Organized by topic, just for you.</p></div><Button variant="yellow" size="sm" onClick={onCreate}><Plus /> New note</Button></div>{showForm && <div className="academic-card mb-4 p-4"><div className="grid gap-3 sm:grid-cols-2"><input aria-label="Note title" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Note title" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /><input aria-label="Note topic" value={draft.topic} onChange={event => setDraft(current => ({ ...current, topic: event.target.value }))} placeholder="Topic, e.g. Week 5" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><textarea aria-label="Note content" value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} placeholder="Write your study note…" className="mt-3 min-h-32 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-xs text-muted-foreground"><Paperclip className="size-4 text-academic" /><span className="min-w-0 flex-1 truncate">{draft.attachment || "Attach a file"}</span><input type="file" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (file) setDraft(current => ({ ...current, attachment: file.name })); }} /></label><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button><Button variant="academic" size="sm" onClick={onSave}><Save />{editingNote === null ? "Save note" : "Save changes"}</Button></div></div>}<div className="grid gap-3 md:grid-cols-2">{notes.map(note => <article key={note.id} className="academic-card p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{note.topic || "General"}</span><h3 className="mt-3 text-sm font-bold">{note.title}</h3></div><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Edit ${note.title}`} onClick={() => onEdit(note)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${note.title}`} onClick={() => onDelete(note.id)}><Trash2 /></Button></div></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>{note.attachment && <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs font-medium text-academic"><Paperclip className="size-3.5" />{note.attachment}</p>}</article>)}{!notes.length && <div className="md:col-span-2"><EmptyState icon={NotebookPen} eyebrow="Study notes" title="Your notes for this course start here" description="Write down the key idea from each session while it is fresh. Notes stay linked to this course and show up in global search." actions={[{ label: "Write first note", icon: Plus, onClick: onCreate }]} hints={["One note per week keeps exam revision easy", "Add the topic so you can filter later", "Attach a photo of the whiteboard or a file"]} /></div>}</div></div>; }

function CourseTaskRow({ task, onToggle }: { task: CourseTask; onToggle: () => void }) { const done = task.status === "Completed"; return <article className="academic-card grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><button onClick={onToggle} aria-label={done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${done ? "border-success bg-success text-academic-foreground" : "border-input bg-background"}`}>{done && <Check className="size-3.5" />}</button><div className="min-w-0"><h3 className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</h3><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">Due {task.due}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${task.priority === "High" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{task.priority} priority</span></div></div><span className={`col-start-2 text-xs font-semibold sm:col-start-auto ${done ? "text-success" : task.status === "In progress" ? "text-academic" : "text-muted-foreground"}`}>{task.status}</span></article>; }

function SchedulePanel({ events }: { events: CourseEvent[] }) { return <div><div className="mb-4"><h2 className="text-base font-bold">Course schedule</h2><p className="mt-1 text-xs text-muted-foreground">Lectures, assistant sessions, and academic milestones.</p></div><div className="academic-card divide-y divide-border">{events.map(event => <article key={`${event.type}-${event.title}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center"><div><p className="font-display text-sm font-bold text-academic">{event.time.split(" – ")[0]}</p><p className="mt-1 text-[10px] text-muted-foreground">{event.day}</p></div><div className="min-w-0 border-l-2 border-primary pl-4"><span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-academic">{event.type}</span><h3 className="mt-2 text-sm font-semibold">{event.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{event.room}</p></div><div className="col-start-2 text-xs text-muted-foreground sm:col-start-auto sm:text-right"><p>{event.date ?? "Every week"}</p><p className="mt-1">{event.time}</p></div></article>)}</div></div>; }

function CalendarView({ studySessions = [], assistantSessions = [] }: { studySessions?: PlannedSession[]; assistantSessions?: AssistantSession[] }) {
  const [selectedDay, setSelectedDay] = useState(today);
  const [filter, setFilter] = useState<"All" | EventType>("All");

  const allEvents = useMemo<CalendarEvent[]>(() => [
    ...calendarEvents,
    ...studySessions.map((session): CalendarEvent => ({
      id: session.id,
      type: "Study",
      day: session.day,
      title: `Study: ${session.topic}`,
      start: session.time,
      location: `${session.duration} focused session`,
      course: session.date,
    })),
    ...assistantSessions.map((session): CalendarEvent => ({
      id: session.id,
      type: "Assistant",
      day: session.day.slice(0, 3),
      title: `Assistant · ${courseByCode.get(session.code)?.name ?? session.code}`,
      start: session.start,
      location: session.room || "Online",
      course: `Class ${session.section} · ${session.assistant}`,
    })),
  ], [studySessions, assistantSessions]);

  const byDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const day of weekDays) {
      map[day.key] = allEvents
        .filter(event => event.day === day.key && (filter === "All" || event.type === filter))
        .sort((a, b) => a.start.localeCompare(b.start));
    }
    return map;
  }, [filter, allEvents]);

  const selected = weekDays.find(day => day.key === selectedDay) ?? weekDays[0]!;
  const todayLabel = weekDays.find(day => day.key === today);
  const todayEvents = useMemo(() => allEvents.filter(e => e.day === today).sort((a, b) => a.start.localeCompare(b.start)), [allEvents]);
  const upcomingDeadlines = useMemo(() => allEvents.filter(e => e.type === "Deadline").sort((a, b) => a.day.localeCompare(b.day)), [allEvents]);
  const filters: ("All" | EventType)[] = ["All", "Lecture", "Assistant", "Deadline", "Study"];

  return <div>
    <MobileTop eyebrow="September 2026" title="Academic Calendar" action={<Button variant="outline" size="icon" aria-label="Calendar options"><MoreHorizontal /></Button>} />
    <div className="mb-7 hidden items-end justify-between md:flex">
      <div><p className="text-sm text-academic">September 2026 · Week 3</p><h1 className="mt-1 text-3xl font-bold">Academic Calendar</h1></div>
      <div className="flex gap-2"><span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-academic">Week</span><span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">Month</span></div>
    </div>

    <section className="mb-7">
      <SectionHeader title="Today’s timeline" action={<span className="text-xs font-semibold text-academic">{todayLabel?.label}, {todayLabel?.date} September</span>} />
      <div className="academic-card p-4 md:p-5">
        {todayEvents.length ? <ol className="relative space-y-4 border-l border-border pl-5">
          {todayEvents.map(event => {
            const style = eventStyles[event.type];
            return <li key={event.id} className="relative">
              <span className={`absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-surface ${style.dot}`} />
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="font-display text-sm font-bold text-academic">{event.start}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{event.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{style.label}{event.location ? ` · ${event.location}` : ""}</p>
                </div>
              </div>
            </li>;
          })}
        </ol> : <p className="text-sm text-muted-foreground">No academic activity today — a good window for deep work.</p>}
        <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Prepare: </span>
          Chapter 5 recap before the problem-solving session, and bring the cost behavior worksheet draft.
        </div>
      </div>
    </section>

    <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {filters.map(value => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === value ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{value}</button>)}
    </div>

    <div className="mb-5 grid grid-cols-7 gap-1.5 sm:gap-2">
      {weekDays.map(day => {
        const count = byDay[day.key]?.length ?? 0;
        const active = selectedDay === day.key;
        return <button key={day.key} onClick={() => setSelectedDay(day.key)} className={`rounded-xl py-2.5 text-center transition-colors ${active ? "bg-academic text-academic-foreground shadow-md" : "bg-surface text-muted-foreground"} ${day.key === today && !active ? "ring-1 ring-academic/40" : ""}`}>
          <span className="block text-[10px] font-semibold">{day.key}</span>
          <span className="mt-1 block font-display text-base font-bold sm:text-lg">{day.date}</span>
          <span className={`mx-auto mt-1 block size-1.5 rounded-full ${count ? (active ? "bg-primary" : "bg-academic") : "bg-transparent"}`} />
        </button>;
      })}
    </div>

    <div className="md:hidden">
      <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{selected.label}, {selected.date} September</p>
      <div className="space-y-3">
        {byDay[selected.key]?.length ? byDay[selected.key]!.map(event => <EventCard key={event.id} event={event} />) : <div className="academic-card p-6 text-center text-sm text-muted-foreground">Nothing scheduled for this day.</div>}
      </div>
    </div>

    <div className="hidden gap-3 md:grid md:grid-cols-7">
      {weekDays.map(day => <div key={day.key} className={`min-h-[420px] rounded-2xl border p-2.5 ${day.key === today ? "border-academic/40 bg-accent/40" : "border-border bg-surface"}`}>
        <div className="mb-3 text-center">
          <p className="text-[11px] text-muted-foreground">{day.key}</p>
          <p className={`font-display text-lg font-bold ${day.key === today ? "text-academic" : ""}`}>{day.date}</p>
        </div>
        <div className="space-y-2.5">{byDay[day.key]?.map(event => <EventCard key={event.id} event={event} compact />)}</div>
      </div>)}
    </div>

    <section className="mt-8">
      <SectionHeader title="Coming up next" />
      <div className="grid gap-3 sm:grid-cols-2">
        {upcomingDeadlines.map(event => {
          const day = weekDays.find(d => d.key === event.day);
          return <article key={event.id} className="academic-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <span className="font-display text-base font-bold leading-none">{day?.date}</span>
              <span className="text-[9px] font-semibold uppercase">Sep</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{event.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{event.course} · due {event.start}</p>
            </div>
          </article>;
        })}
      </div>
    </section>

    <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
      <Legend color="bg-primary" label="Lecture" />
      <Legend color="bg-academic" label="Assistant session" />
      <Legend color="bg-destructive" label="Deadline" />
      <Legend color="bg-success" label="Personal study" />
    </div>
  </div>;
}

function EventCard({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const style = eventStyles[event.type];
  const Icon = style.icon;
  return <article className="academic-card overflow-hidden">
    <div className="flex">
      <div className={`w-1.5 shrink-0 ${style.bar}`} />
      <div className={`min-w-0 flex-1 ${compact ? "p-2.5" : "p-4"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`font-display font-bold text-academic ${compact ? "text-[11px]" : "text-xs"}`}>{event.start}{event.end ? ` – ${event.end}` : ""}</span>
          {!compact && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}><Icon className="size-3" />{style.label}</span>}
        </div>
        {compact && <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${style.chip}`}>{style.label}</span>}
        <h3 className={`mt-2 font-bold leading-5 ${compact ? "text-[11px]" : "text-sm"}`}>{event.title}</h3>
        <div className={`mt-2 space-y-1 text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>
          {event.location && <p className="flex items-center gap-1.5 truncate"><MapPin className="size-3 shrink-0" />{event.location}</p>}
          {event.person && <p className="flex items-center gap-1.5 truncate"><UserRound className="size-3 shrink-0" />{event.person}</p>}
          {event.course && <p className="flex items-center gap-1.5 truncate"><BookOpen className="size-3 shrink-0" />{event.course}</p>}
        </div>
      </div>
    </div>
  </article>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${color}`} />{label}</span>; }


function TasksView({ tasks, toggleTask, updateTask, addTask, navigate }: { tasks: Task[]; toggleTask: (id: number) => void; updateTask: (id: number, patch: Partial<Task>) => void; addTask: (task: Task) => void; navigate: (view: View) => void }) {
  const [filter, setFilter] = useState<"All" | TaskCategory>("All");
  const [openId, setOpenId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const scoped = useMemo(() => filter === "All" ? tasks : tasks.filter(task => task.category === filter), [tasks, filter]);
  const active = scoped.filter(task => !task.done);
  const today = active.filter(task => task.due === "Today");
  const upcoming = active.filter(task => task.due !== "Today");
  const completed = scoped.filter(task => task.done);
  const dueThisWeek = active.filter(task => ["Today", "18 Sep", "20 Sep"].includes(task.due));
  const openTask = tasks.find(task => task.id === openId) ?? null;

  if (openTask) return <TaskDetail task={openTask} onBack={() => setOpenId(null)} updateTask={updateTask} toggleTask={toggleTask} navigate={navigate} />;

  return <div>
    <MobileTop eyebrow="Semester Gasal 2026/2027" title="Tasks" action={<Button variant="yellow" size="icon" onClick={() => setShowAdd(true)} aria-label="Create assignment"><Plus /></Button>} />
    <div className="mb-7 hidden items-end justify-between md:flex"><div><p className="text-sm text-academic">Semester Gasal 2026/2027</p><h1 className="mt-1 text-3xl font-bold">Tasks</h1></div><Button variant="yellow" onClick={() => setShowAdd(true)}><Plus /> Create assignment</Button></div>

    <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
      <SummaryStat label="Active tasks" value={active.length} tone="text-academic" />
      <SummaryStat label="Due this week" value={dueThisWeek.length} tone="text-destructive" />
      <SummaryStat label="Completed" value={completed.length} tone="text-success" />
    </div>

    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {(["All", ...taskCategories] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filter === value ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{value}</button>)}
    </div>

    {showAdd && <CreateTaskForm onCancel={() => setShowAdd(false)} onCreate={task => { addTask(task); setShowAdd(false); }} />}

    {!scoped.length && !showAdd && <EmptyState
      icon={ListTodo}
      eyebrow={filter === "All" ? "Task center" : `${filter} tasks`}
      title={filter === "All" ? "No assignment tracked yet" : `Nothing filed under ${filter}`}
      description={filter === "All"
        ? "This is where every assignment, case, and paper of the semester lives — with its deadline, checklist, and course attached."
        : `You have no ${filter.toLowerCase()} work in this semester yet. Create one, or switch back to all tasks to see the rest.`}
      actions={filter === "All"
        ? [{ label: "Create assignment", icon: Plus, onClick: () => setShowAdd(true) }, { label: "Open a course", icon: BookOpen, onClick: () => navigate("courses") }]
        : [{ label: `Create ${filter.toLowerCase()} task`, icon: Plus, onClick: () => setShowAdd(true) }, { label: "Show all tasks", onClick: () => setFilter("All") }]}
      hints={["Set the due date so it appears in Today and Upcoming", "Break big papers into a checklist", "Link the task to its course to keep materials nearby"]}
      className="mb-8"
    />}

    {scoped.length > 0 && <section className="mb-8">
      <SectionHeader title="Today" action={<span className="text-xs font-semibold text-muted-foreground">{today.length} needs attention</span>} />
      <div className="grid gap-3 sm:grid-cols-2">
        {today.length ? today.map(task => <TaskCard key={task.id} task={task} toggleTask={toggleTask} onOpen={() => setOpenId(task.id)} />)
          : <div className="academic-card p-6 text-center sm:col-span-2"><CheckCircle2 className="mx-auto size-8 text-success" /><p className="mt-3 text-sm font-semibold">Nothing due today</p><p className="mt-1 text-xs text-muted-foreground">Use the free time to get ahead on upcoming work.</p></div>}
      </div>
    </section>}

    {scoped.length > 0 && <section className="mb-8">
      <SectionHeader title="Upcoming" />
      {upcoming.length ? <div className="academic-card overflow-hidden">
        {upcoming.map((task, index) => <button key={task.id} onClick={() => setOpenId(task.id)} className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left ${index ? "border-t border-border" : ""}`}>
          <div className="w-14 shrink-0 text-center"><p className="font-display text-lg font-bold text-academic">{task.due.split(" ")[0]}</p><p className="text-[10px] font-semibold uppercase text-muted-foreground">{task.due.split(" ")[1] ?? ""}</p></div>
          <div className="min-w-0 border-l border-border pl-3"><p className="truncate text-sm font-bold">{task.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{task.course}</p></div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority}</span>
        </button>)}
      </div> : <div className="academic-card p-6 text-center text-sm text-muted-foreground">No upcoming work in this filter.</div>}
    </section>}

    {completed.length > 0 && <section>
      <SectionHeader title="Completed" />
      <div className="academic-card divide-y divide-border">{completed.map(task => <button key={task.id} onClick={() => setOpenId(task.id)} className="flex w-full items-center gap-3 p-4 text-left"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-academic-foreground"><Check className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-muted-foreground line-through">{task.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{task.course}</span></span><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div>
    </section>}
  </div>;
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className="academic-card p-4"><p className={`font-display text-2xl font-bold ${tone}`}>{value}</p><p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p></div>;
}

function TaskCard({ task, toggleTask, onOpen }: { task: Task; toggleTask: (id: number) => void; onOpen: () => void }) {
  const progress = task.checklist.length ? Math.round((task.checklist.filter(item => item.done).length / task.checklist.length) * 100) : 0;
  return <article className="academic-card overflow-hidden">
    <div className="flex">
      <div className={`w-1.5 shrink-0 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-primary" : "bg-success"}`} />
      <div className="min-w-0 flex-1 p-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <button onClick={() => toggleTask(task.id)} aria-label={`Complete ${task.title}`} className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-input bg-background" />
          <button onClick={onOpen} className="min-w-0 text-left">
            <h3 className="truncate text-sm font-bold">{task.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><BookOpen className="size-3 shrink-0" />{task.course}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-academic">Due {task.due}</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority} priority</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>{task.status}</span>
            </div>
            {task.checklist.length > 0 && <div className="mt-4 flex items-center gap-3"><Progress value={progress} className="h-2 flex-1" /><span className="text-[11px] font-bold text-academic">{progress}%</span></div>}
          </button>
        </div>
      </div>
    </div>
  </article>;
}

function TaskDetail({ task, onBack, updateTask, toggleTask, navigate }: { task: Task; onBack: () => void; updateTask: (id: number, patch: Partial<Task>) => void; toggleTask: (id: number) => void; navigate: (view: View) => void }) {
  const progress = task.checklist.length ? Math.round((task.checklist.filter(item => item.done).length / task.checklist.length) * 100) : 0;
  const toggleItem = (itemId: number) => updateTask(task.id, { checklist: task.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item) });
  const setStatus = (status: TaskStatus) => updateTask(task.id, { status, done: status === "Completed" });

  return <div>
    <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-semibold text-academic"><ArrowLeft className="size-4" />Back to tasks</button>
    <header className="academic-card mb-6 overflow-hidden">
      <div className={`h-2 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-primary" : "bg-success"}`} />
      <div className="p-5 md:p-6">
        <p className="text-xs font-semibold uppercase text-academic">{task.category}</p>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">{task.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2"><BookOpen className="size-4 shrink-0 text-academic" />{task.course}{task.courseCode ? ` · ${task.courseCode}` : ""}</span>
          <span className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-academic" />Due {task.dueDate}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority} priority</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[task.status]}`}>{task.status}</span>
        </div>
      </div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="space-y-6">
        <section className="academic-card p-5"><h2 className="text-base font-bold">Description</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{task.description}</p></section>

        <section className="academic-card p-5">
          <div className="flex items-center justify-between"><h2 className="text-base font-bold">Checklist</h2><span className="text-xs font-bold text-academic">{progress}%</span></div>
          <Progress value={progress} className="mt-3 h-2" />
          <div className="mt-4 space-y-2">{task.checklist.length ? task.checklist.map(item => <button key={item.id} onClick={() => toggleItem(item.id)} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><span className={`grid size-5 shrink-0 place-items-center rounded-full border ${item.done ? "border-success bg-success text-academic-foreground" : "border-input bg-background"}`}>{item.done && <Check className="size-3" />}</span><span className={`min-w-0 flex-1 truncate text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>{item.label}</span></button>) : <p className="text-sm text-muted-foreground">No checklist items yet.</p>}</div>
        </section>

        <ResourcesPanel resources={task.resources} onChange={resources => updateTask(task.id, { resources })} />
      </div>

      <div className="space-y-6">
        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Status</h2>
          <div className="mt-3 space-y-2">{(["Not started", "In progress", "Completed"] as TaskStatus[]).map(status => <button key={status} onClick={() => setStatus(status)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${task.status === status ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{status}{task.status === status && <Check className="size-4" />}</button>)}</div>
          <Button variant={task.done ? "outline" : "yellow"} className="mt-4 w-full" onClick={() => toggleTask(task.id)}>{task.done ? "Reopen task" : "Mark as completed"}</Button>
        </section>

        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Connected</h2>
          <div className="mt-3 space-y-2">
            <button onClick={() => navigate("courses")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><BookOpen className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Course workspace</span><ChevronRight className="size-4 text-muted-foreground" /></button>
            <button onClick={() => navigate("calendar")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><CalendarDays className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">See on calendar</span><ChevronRight className="size-4 text-muted-foreground" /></button>
            <button onClick={() => navigate("library")} className="flex w-full items-center gap-3 rounded-xl bg-muted p-3 text-left"><Library className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate text-sm font-medium">Related materials</span><ChevronRight className="size-4 text-muted-foreground" /></button>
          </div>
        </section>
      </div>
    </div>
  </div>;
}

const fileKinds: Record<string, string> = { pdf: "PDF", doc: "DOC", docx: "DOCX", xls: "XLS", xlsx: "XLSX", ppt: "PPT", pptx: "PPTX", png: "Image", jpg: "Image", jpeg: "Image", webp: "Image", gif: "Image" };
const extOf = (name: string) => fileKinds[name.split(".").pop()?.toLowerCase() ?? ""] ?? "File";
const formatSize = (bytes?: number) => bytes === undefined ? "" : bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const normalizeUrl = (value: string) => { const trimmed = value.trim(); if (!trimmed) return ""; return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`; };
const isValidUrl = (value: string) => { try { const url = new URL(normalizeUrl(value)); return url.hostname.includes(".") && url.hostname.length > 3; } catch { return false; } };
const hostOf = (url?: string) => { try { return new URL(url ?? "").hostname.replace(/^www\./, ""); } catch { return "Link"; } };

function ResourcesPanel({ resources, onChange }: { resources: TaskResource[]; onChange: (resources: TaskResource[]) => void }) {
  const [showLink, setShowLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const invalid = linkUrl.trim().length > 0 && !isValidUrl(linkUrl);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: TaskResource[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index, kind: "file", title: file.name, ext: extOf(file.name), size: file.size, url: URL.createObjectURL(file),
    }));
    onChange([...resources, ...added]);
  };

  const saveLink = () => {
    if (!isValidUrl(linkUrl)) return;
    const url = normalizeUrl(linkUrl);
    onChange([...resources, { id: Date.now(), kind: "link", title: linkTitle.trim() || hostOf(url), url }]);
    setLinkTitle(""); setLinkUrl(""); setShowLink(false);
  };

  const remove = (id: number) => onChange(resources.filter(item => item.id !== id));
  const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Resources</h2><p className="mt-1 text-xs text-muted-foreground">Files, datasets, and reference links for this task.</p></div>
      <div className="flex gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-foreground"><Paperclip className="size-3.5 text-academic" />Upload file<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="sr-only" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} /></label>
        <Button variant="outline" size="sm" onClick={() => setShowLink(value => !value)}><Link2 /> Add link</Button>
      </div>
    </div>

    {showLink && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Title</span><input autoFocus value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Case Study Dataset" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL</span><input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="drive.google.com/…" className={field} /></label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Enter a valid address, e.g. drive.google.com/file/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={saveLink}><Save /> Save link</Button><Button variant="ghost" size="sm" onClick={() => setShowLink(false)}>Cancel</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {resources.length ? resources.map(item => <article key={item.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic">{item.kind === "file" ? <FileText className="size-5" /> : <Link2 className="size-5" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{item.kind === "file" ? item.ext ?? extOf(item.title) : "Link"}</span>{item.kind === "file" ? formatSize(item.size) : hostOf(item.url)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {item.kind === "file"
            ? <a href={item.url ?? "#"} download={item.title} className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Download className="size-3.5" />Download</a>
            : <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Open link</a>}
          <button onClick={() => remove(item.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Remove</button>
        </div>
      </article>) : <p className="text-sm text-muted-foreground sm:col-span-2">No resources yet. Upload assignment files or attach reference links.</p>}
    </div>
  </section>;
}

function CreateTaskForm({ onCreate, onCancel }: { onCreate: (task: Task) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [courseIndex, setCourseIndex] = useState(0);
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState<TaskResource[]>([]);

  const submit = () => {
    if (!title.trim()) return;
    const option = courseOptions[courseIndex]!;
    const dueLabel = due.trim() || "Today";
    onCreate({
      id: Date.now(), title: title.trim(), course: option.course, courseCode: option.courseCode, category: option.category,
      due: dueLabel, dueDate: `${dueLabel} 2026 · 23:59`, priority, status: "Not started", done: false,
      description: description.trim() || "No description added yet.",
      resources, checklist: [],
    });
  };

  const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
  return <section className="academic-card mb-6 p-5">
    <h2 className="text-base font-bold">New academic task</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Title</span><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Cost behavior worksheet" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Course</span><select value={courseIndex} onChange={e => setCourseIndex(Number(e.target.value))} className={field}>{courseOptions.map((option, index) => <option key={option.course} value={index}>{option.course}</option>)}</select></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Deadline</span><input value={due} onChange={e => setDue(e.target.value)} placeholder="22 Sep" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Priority</span><select value={priority} onChange={e => setPriority(e.target.value as Task["priority"])} className={field}><option>High</option><option>Medium</option><option>Low</option></select></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Resources</span><span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground"><Paperclip className="size-4 shrink-0 text-academic" /><span className="min-w-0 flex-1 truncate">{resources.length ? `${resources.length} file${resources.length > 1 ? "s" : ""} attached` : "Upload files"}</span><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="sr-only" onChange={e => { const files = e.target.files; if (files?.length) setResources(current => [...current, ...Array.from(files).map((file, index) => ({ id: Date.now() + index, kind: "file" as const, title: file.name, ext: extOf(file.name), size: file.size, url: URL.createObjectURL(file) }))]); e.target.value = ""; }} /></span></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What needs to be prepared?" className={field} /></label>
    </div>
    <div className="mt-4 flex gap-2"><Button variant="academic" onClick={submit}><Check /> Save task</Button><Button variant="outline" onClick={onCancel}><X /> Cancel</Button></div>
  </section>;
}

