import { useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, CalendarDays, ChevronRight, Download, ExternalLink, FileText,
  GraduationCap, Library, Link2, MapPin, NotebookPen, Paperclip, Plus, Save, Search, Trash2, UserRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";

type ResourceType = "Books" | "Lecture Slides" | "Practice Questions" | "Articles" | "External References" | "Files";
type WorkType = "Class summary" | "Personal note" | "Exercise answers" | "Project file" | "Study reflection";

type ArchiveItem = {
  id: number;
  title: string;
  description: string;
  type: string;
  kind: "file" | "link";
  meta?: string;
  url?: string;
};

type ArchiveNote = {
  id: number;
  title: string;
  topic: string;
  body: string;
  attachment?: string;
  link?: string;
};

type ClassLink = { id: number; title: string; url: string; category: string };

type ArchiveCourse = {
  code: string;
  title: string;
  sks: number;
  lecturer: string;
  assistant: string;
  day: string;
  time: string;
  room: string;
  accent: string;
  syllabus: string;
  links: ClassLink[];
  materials: ArchiveItem[];
  work: ArchiveItem[];
  notes: ArchiveNote[];
};

type Semester = { id: string; label: string; period: string; status: "Current" | "Archived"; courses: ArchiveCourse[] };

const resourceTypes: ResourceType[] = ["Books", "Lecture Slides", "Practice Questions", "Articles", "External References", "Files"];
const workTypes: WorkType[] = ["Class summary", "Personal note", "Exercise answers", "Project file", "Study reflection"];

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
};
const isValidUrl = (value: string) => {
  try {
    const url = new URL(normalizeUrl(value));
    return url.hostname.includes(".") && url.hostname.length > 3;
  } catch {
    return false;
  }
};
const hostOf = (url?: string) => {
  try {
    return new URL(url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
};
const formatSize = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const baseMaterials = (): ArchiveItem[] => [
  { id: 1, title: "Core textbook — selected chapters", description: "Required reading with the weekly chapter guide.", type: "Books", kind: "file", meta: "PDF · 8.2 MB" },
  { id: 2, title: "Lecture slides — Week 5", description: "Class deck with the lecturer's annotations.", type: "Lecture Slides", kind: "file", meta: "PPTX · 4.1 MB" },
  { id: 3, title: "Weekly practice set", description: "Exercises used in the assistant session.", type: "Practice Questions", kind: "file", meta: "PDF · 640 KB" },
  { id: 4, title: "Industry case reference", description: "Supplementary case for the next discussion.", type: "Articles", kind: "link", url: "https://hbr.org/topic/subject/strategy" },
  { id: 5, title: "FEB UI digital collection", description: "University e-library entry point for this subject.", type: "External References", kind: "link", url: "https://lib.ui.ac.id" },
];

const semesters: Semester[] = [
  {
    id: "2026-gasal",
    label: "Semester Gasal 2026/2027",
    period: "Aug 2026 – Jan 2027",
    status: "Current",
    courses: [
      {
        code: "ECAC600056", title: "Akuntansi Manajemen untuk Bisnis", sks: 3, accent: "bg-primary",
        lecturer: "Rahfiani Khairurzka, S.E., M.A.", assistant: "Nadia Putri, S.E.",
        day: "Tuesday", time: "08:00 – 10:30", room: "A303",
        syllabus: "Cost behaviour, contribution margin, budgeting, variance analysis, and decision-making for managers. Assessment: 30% assignments, 30% midterm, 40% final.",
        links: [
          { id: 1, title: "Course Google Drive", url: "https://drive.google.com/drive/folders/akuntansi-manajemen", category: "Google Drive" },
          { id: 2, title: "Grade recap sheet", url: "https://docs.google.com/spreadsheets/d/akm-grades", category: "Google Sheets" },
          { id: 3, title: "Google Classroom", url: "https://classroom.google.com/c/akm-2026", category: "Classroom" },
          { id: 4, title: "Assistant session Zoom", url: "https://ui-ac-id.zoom.us/j/akm-assistant", category: "Zoom" },
        ],
        materials: baseMaterials(),
        work: [
          { id: 1, title: "Week 3 class summary", description: "My recap of cost classification and the contribution margin model.", type: "Class summary", kind: "file", meta: "DOCX · 210 KB" },
          { id: 2, title: "Cost behaviour exercise answers", description: "Worked answers from the assistant practice set.", type: "Exercise answers", kind: "file", meta: "XLSX · 180 KB" },
        ],
        notes: [
          { id: 1, title: "Cost classification", topic: "Week 3", body: "Separate fixed, variable, and mixed costs before building the contribution margin model.", attachment: "cost-model.xlsx" },
        ],
      },
      {
        code: "ECMN600040", title: "Manajemen Produk dan Harga", sks: 3, accent: "bg-academic",
        lecturer: "Dr. Karto Adiwijaya, S.E., M.M.", assistant: "Sri Daryanti, S.E., M.M.",
        day: "Tuesday", time: "11:00 – 13:30", room: "A212",
        syllabus: "Product strategy, portfolio decisions, customer value, and value-based pricing. Assessment: 25% case work, 35% midterm case, 40% final project.",
        links: [
          { id: 1, title: "Pricing case drive", url: "https://drive.google.com/drive/folders/pricing-cases", category: "Google Drive" },
          { id: 2, title: "Case clinic Zoom", url: "https://ui-ac-id.zoom.us/j/pricing-clinic", category: "Zoom" },
          { id: 3, title: "EMAS course page", url: "https://emas2.ui.ac.id/course/pricing", category: "LMS" },
        ],
        materials: baseMaterials(),
        work: [
          { id: 1, title: "Pricing ladder project file", description: "Working analysis for the mid-semester product report.", type: "Project file", kind: "file", meta: "XLSX · 320 KB" },
          { id: 2, title: "Reflection — value perception", description: "What changed in how I read price sensitivity.", type: "Study reflection", kind: "file", meta: "DOCX · 96 KB" },
        ],
        notes: [
          { id: 1, title: "Value-based pricing", topic: "Pricing", body: "Pricing decisions connect customer value, demand elasticity, and the cost structure." },
        ],
      },
      {
        code: "ECMN600020", title: "Bisnis Internasional", sks: 3, accent: "bg-success",
        lecturer: "Aswin Dewanto Hadisumarto, S.E., M.I.A.", assistant: "Fikri Ramadhan, S.E.",
        day: "Wednesday", time: "08:00 – 10:30", room: "B111",
        syllabus: "Global trade, market entry modes, cross-cultural management, and international strategy. Assessment: 30% memo, 30% midterm, 40% final.",
        links: [
          { id: 1, title: "Reading pack drive", url: "https://drive.google.com/drive/folders/bisnis-internasional", category: "Google Drive" },
          { id: 2, title: "Discussion group notes", url: "https://www.notion.so/bisnis-internasional-notes", category: "Notion" },
        ],
        materials: baseMaterials(),
        work: [
          { id: 1, title: "Market entry memo draft", description: "First draft of the entry-mode recommendation.", type: "Project file", kind: "file", meta: "DOCX · 154 KB" },
        ],
        notes: [
          { id: 1, title: "Market entry modes", topic: "Week 4", body: "Compare control, commitment, and risk across exporting, licensing, joint ventures, and subsidiaries." },
        ],
      },
      {
        code: "ECMN600018", title: "Metode Riset Bisnis", sks: 3, accent: "bg-warning",
        lecturer: "Lenny Suardi, S.Si., M.Si.", assistant: "Alya Safira, S.E.",
        day: "Thursday", time: "14:00 – 16:30", room: "B101",
        syllabus: "Research design, literature review, sampling, measurement, and data analysis for business research. Assessment: 40% proposal, 30% matrix, 30% defense.",
        links: [
          { id: 1, title: "Literature matrix sheet", url: "https://docs.google.com/spreadsheets/d/literature-matrix", category: "Google Sheets" },
          { id: 2, title: "Scopus search", url: "https://www.scopus.com/search", category: "Website" },
          { id: 3, title: "Methods lab room link", url: "https://ui-ac-id.zoom.us/j/methods-lab", category: "Zoom" },
        ],
        materials: baseMaterials(),
        work: [
          { id: 1, title: "Research design summary", description: "My one-page map from question to analysis method.", type: "Class summary", kind: "file", meta: "PDF · 120 KB" },
        ],
        notes: [
          { id: 1, title: "Research design map", topic: "Methodology", body: "The research question determines the data, sampling strategy, and analysis method." },
        ],
      },
    ],
  },
  {
    id: "2026-genap",
    label: "Semester Genap 2025/2026",
    period: "Feb 2026 – Jul 2026",
    status: "Archived",
    courses: [
      {
        code: "ECAC600055", title: "Akuntansi Biaya", sks: 3, accent: "bg-primary",
        lecturer: "Dini Rahmawati, S.E., M.Ak.", assistant: "Bagas Prakoso, S.E.",
        day: "Monday", time: "08:00 – 10:30", room: "A201",
        syllabus: "Job order costing, process costing, overhead allocation, and cost reporting.",
        links: [{ id: 1, title: "Archive drive", url: "https://drive.google.com/drive/folders/akuntansi-biaya", category: "Google Drive" }],
        materials: baseMaterials().slice(0, 3),
        work: [{ id: 1, title: "Final project report", description: "Costing report for the semester project.", type: "Project file", kind: "file", meta: "PDF · 1.8 MB" }],
        notes: [{ id: 1, title: "Overhead allocation", topic: "Week 6", body: "Choose the allocation base that best explains overhead consumption." }],
      },
      {
        code: "ECMN600012", title: "Manajemen Operasi", sks: 3, accent: "bg-academic",
        lecturer: "Hendra Wijaya, S.T., M.M.", assistant: "Rani Oktaviani, S.E.",
        day: "Wednesday", time: "13:00 – 15:30", room: "B204",
        syllabus: "Process design, capacity planning, inventory, quality management, and supply chains.",
        links: [{ id: 1, title: "Simulation sheet", url: "https://docs.google.com/spreadsheets/d/ops-simulation", category: "Google Sheets" }],
        materials: baseMaterials().slice(0, 2),
        work: [{ id: 1, title: "Inventory simulation answers", description: "My solved EOQ and safety-stock cases.", type: "Exercise answers", kind: "file", meta: "XLSX · 240 KB" }],
        notes: [{ id: 1, title: "Little's Law", topic: "Week 5", body: "Work in process equals throughput multiplied by flow time." }],
      },
      {
        code: "ECEU600002", title: "Pengantar Ekonomi Makro", sks: 3, accent: "bg-success",
        lecturer: "Dr. Sari Handayani, S.E., M.Ec.", assistant: "Yoga Pratama, S.E.",
        day: "Friday", time: "10:00 – 12:30", room: "A105",
        syllabus: "National income, inflation, monetary and fiscal policy, and the open economy.",
        links: [{ id: 1, title: "BPS statistics", url: "https://www.bps.go.id", category: "Website" }],
        materials: baseMaterials().slice(0, 3),
        work: [{ id: 1, title: "Macro policy reflection", description: "What I learned about policy trade-offs.", type: "Study reflection", kind: "file", meta: "DOCX · 88 KB" }],
        notes: [{ id: 1, title: "Policy mix", topic: "Week 9", body: "Fiscal expansion with tight monetary policy pushes interest rates up." }],
      },
    ],
  },
  {
    id: "2025-gasal",
    label: "Semester Gasal 2025/2026",
    period: "Aug 2025 – Jan 2026",
    status: "Archived",
    courses: [
      {
        code: "ECAC600001", title: "Pengantar Akuntansi", sks: 3, accent: "bg-primary",
        lecturer: "Ratna Kusuma, S.E., M.Ak.", assistant: "Dimas Anggara, S.E.",
        day: "Tuesday", time: "08:00 – 10:30", room: "A101",
        syllabus: "Accounting cycle, financial statements, adjusting entries, and closing entries.",
        links: [{ id: 1, title: "Practice archive", url: "https://drive.google.com/drive/folders/pengantar-akuntansi", category: "Google Drive" }],
        materials: baseMaterials().slice(0, 2),
        work: [{ id: 1, title: "Accounting cycle summary", description: "Step-by-step recap from journal to statements.", type: "Class summary", kind: "file", meta: "PDF · 260 KB" }],
        notes: [{ id: 1, title: "Adjusting entries", topic: "Week 7", body: "Accruals and deferrals keep revenue and expense in the right period." }],
      },
      {
        code: "ECMN600001", title: "Pengantar Manajemen", sks: 3, accent: "bg-warning",
        lecturer: "Andi Nugroho, S.E., M.M.", assistant: "Putri Larasati, S.E.",
        day: "Thursday", time: "10:00 – 12:30", room: "B102",
        syllabus: "Planning, organising, leading, and controlling in modern organisations.",
        links: [{ id: 1, title: "Case library", url: "https://www.notion.so/pengantar-manajemen", category: "Notion" }],
        materials: baseMaterials().slice(0, 2),
        work: [{ id: 1, title: "Leadership reflection", description: "My reflection after the group project.", type: "Study reflection", kind: "file", meta: "DOCX · 74 KB" }],
        notes: [{ id: 1, title: "Organisational structure", topic: "Week 4", body: "Structure follows strategy; coordination cost rises with specialisation." }],
      },
    ],
  },
];

const field = "w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

export function LibraryView() {
  const [data, setData] = useState<Semester[]>(semesters);
  const [semesterId, setSemesterId] = useState(semesters[0]!.id);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const semester = data.find(item => item.id === semesterId)!;
  const course = semester.courses.find(item => item.code === openCode) ?? null;

  const summary = useMemo(() => {
    const resources = semester.courses.reduce((total, item) => total + item.materials.length + item.work.length + item.links.length, 0);
    const notes = semester.courses.reduce((total, item) => total + item.notes.length, 0);
    return { courses: semester.courses.length, resources, notes };
  }, [semester]);

  const updateCourse = (code: string, patch: Partial<ArchiveCourse>) =>
    setData(items => items.map(item => item.id !== semester.id ? item : { ...item, courses: item.courses.map(entry => entry.code === code ? { ...entry, ...patch } : entry) }));

  if (course) return <CourseArchive course={course} semester={semester} onBack={() => setOpenCode(null)} updateCourse={patch => updateCourse(course.code, patch)} />;

  const visible = semester.courses.filter(item => `${item.title} ${item.code} ${item.lecturer}`.toLowerCase().includes(query.toLowerCase()));

  return <div>
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 md:hidden">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-academic">Knowledge archive</p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold leading-8">Academic Library</h1>
      </div>
    </div>
    <div className="mb-7 hidden items-end justify-between md:flex">
      <div><p className="text-sm text-academic">Knowledge archive</p><h1 className="mt-1 text-3xl font-bold">Academic Library</h1></div>
      <p className="text-sm text-muted-foreground">{semester.label}</p>
    </div>

    <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {data.map(item => <button key={item.id} onClick={() => setSemesterId(item.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${item.id === semesterId ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{item.label}</button>)}
    </div>

    <section className="academic-card mb-6 overflow-hidden">
      <div className="h-2 bg-primary" />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold">{semester.label}</h2>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${semester.status === "Current" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>{semester.status}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{semester.period}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[{ label: "Courses", value: summary.courses, icon: GraduationCap }, { label: "Resources", value: summary.resources, icon: Library }, { label: "Personal notes", value: summary.notes, icon: NotebookPen }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl bg-muted p-3">
            <Icon className="size-4 text-academic" />
            <p className="mt-3 text-lg font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
          </div>)}
        </div>
      </div>
    </section>

    <label className="mb-5 flex items-center gap-3 rounded-xl border border-input bg-surface px-4 py-3">
      <Search className="size-4 text-muted-foreground" />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses in this semester" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
    </label>

    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-bold md:text-lg">Course archives</h2></div>
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map(item => <button key={item.code} onClick={() => setOpenCode(item.code)} className="academic-card overflow-hidden text-left">
        <div className={`h-1.5 ${item.accent}`} />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase text-academic">{item.code}</p>
          <h3 className="mt-2 text-sm font-bold leading-6">{item.title}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{item.sks} SKS · {item.lecturer}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{item.materials.length + item.work.length + item.links.length} resources · {item.notes.length} notes</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-academic">Open archive <ChevronRight className="size-4" /></span>
          </div>
        </div>
      </button>)}
      {!visible.length && <div className="md:col-span-2"><EmptyState
        icon={Search}
        eyebrow="Semester archive"
        title={query ? `No course matches “${query}”` : "This semester has no archived course yet"}
        description="Archived courses keep every material, note, and link from a semester you have finished. Search by course name, code, or lecturer."
        actions={query ? [{ label: "Clear search", onClick: () => setQuery("") }] : []}
        hints={["Try a course code such as ECMN600020", "Each archive keeps materials, personal work, links, and notes"]}
        compact
      /></div>}
    </div>
  </div>;
}

function CourseArchive({ course, semester, onBack, updateCourse }: { course: ArchiveCourse; semester: Semester; onBack: () => void; updateCourse: (patch: Partial<ArchiveCourse>) => void }) {
  return <div>
    <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm font-semibold text-academic"><ArrowLeft className="size-4" />Back to library</button>

    <header className="academic-card mb-6 overflow-hidden">
      <div className={`h-2 ${course.accent}`} />
      <div className="p-5 md:p-6">
        <p className="text-xs font-semibold uppercase text-academic">{course.code} · {semester.label}</p>
        <h1 className="mt-2 text-xl font-bold md:text-2xl">{course.title}</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2"><UserRound className="size-4 shrink-0 text-academic" />{course.lecturer}</span>
          <span className="flex items-center gap-2"><UserRound className="size-4 shrink-0 text-academic" />Assistant · {course.assistant}</span>
        </div>
      </div>
    </header>

    <Tabs defaultValue="info">
      <TabsList className="mb-5 w-full justify-start overflow-x-auto">
        <TabsTrigger value="info">Information</TabsTrigger>
        <TabsTrigger value="links">Class links</TabsTrigger>
        <TabsTrigger value="materials">Materials</TabsTrigger>
        <TabsTrigger value="work">My work</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <section className="academic-card p-5">
          <h2 className="text-base font-bold">Course information</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{course.syllabus}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: GraduationCap, label: "Credits", value: `${course.sks} SKS` },
              { icon: CalendarDays, label: "Schedule", value: `${course.day} · ${course.time}` },
              { icon: MapPin, label: "Room", value: course.room },
              { icon: UserRound, label: "Assistant", value: course.assistant },
            ].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <Icon className="size-4 shrink-0 text-academic" />
              <div className="min-w-0"><p className="text-[11px] text-muted-foreground">{label}</p><p className="truncate text-sm font-semibold">{value}</p></div>
            </div>)}
          </div>
        </section>
      </TabsContent>

      <TabsContent value="links">
        <ClassLinksPanel links={course.links} onChange={links => updateCourse({ links })} />
      </TabsContent>

      <TabsContent value="materials">
        <ItemPanel
          title="Learning materials" subtitle="Books, slides, practice questions, articles, and references."
          items={course.materials} types={resourceTypes} onChange={materials => updateCourse({ materials })}
        />
      </TabsContent>

      <TabsContent value="work">
        <ItemPanel
          title="My work" subtitle="Summaries, answers, project files, and reflections you produced."
          items={course.work} types={workTypes} onChange={work => updateCourse({ work })}
        />
      </TabsContent>

      <TabsContent value="notes">
        <NotesPanel notes={course.notes} onChange={notes => updateCourse({ notes })} />
      </TabsContent>
    </Tabs>
  </div>;
}

function ClassLinksPanel({ links, onChange }: { links: ClassLink[]; onChange: (links: ClassLink[]) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Google Drive");
  const invalid = url.trim().length > 0 && !isValidUrl(url);

  const save = () => {
    if (!isValidUrl(url)) return;
    onChange([...links, { id: Date.now(), title: title.trim() || hostOf(normalizeUrl(url)), url: normalizeUrl(url), category }]);
    setTitle(""); setUrl(""); setOpen(false);
  };

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Class links</h2><p className="mt-1 text-xs text-muted-foreground">Drive, sheets, classroom, and meeting rooms for this course.</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> Add link</Button>
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Title</span><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Course Google Drive" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Category</span><select value={category} onChange={e => setCategory(e.target.value)} className={field}>{["Google Drive", "Google Sheets", "Classroom", "LMS", "Zoom", "Notion", "Website"].map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">URL</span><input value={url} onChange={e => setUrl(e.target.value)} placeholder="drive.google.com/…" className={field} /></label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Enter a valid address, e.g. drive.google.com/drive/folders/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Save link</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {links.length ? links.map(link => <article key={link.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic"><Link2 className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{link.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{link.category}</span>{hostOf(link.url)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Open link</a>
          <button onClick={() => onChange(links.filter(item => item.id !== link.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Remove</button>
        </div>
      </article>) : <div className="sm:col-span-2"><EmptyState
        icon={Link2}
        eyebrow="Class links"
        title="Keep every class link in one place"
        description="Save the course Google Drive, class spreadsheet, LMS page, or recurring meeting room so you never search your chat history again."
        actions={[{ label: "Add first link", icon: Plus, onClick: () => setOpen(true) }]}
        hints={["Drive and Sheets for shared materials", "Zoom or Classroom for the weekly session"]}
        compact
      /></div>}
    </div>
  </section>;
}

function ItemPanel({ title, subtitle, items, types, onChange }: { title: string; subtitle: string; items: ArchiveItem[]; types: string[]; onChange: (items: ArchiveItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [draft, setDraft] = useState({ title: "", description: "", type: types[0]!, url: "" });
  const [file, setFile] = useState<{ name: string; meta: string; url: string } | null>(null);
  const invalid = draft.url.trim().length > 0 && !isValidUrl(draft.url);

  const save = () => {
    if (!draft.title.trim()) return;
    if (draft.url.trim() && !isValidUrl(draft.url)) return;
    const item: ArchiveItem = draft.url.trim()
      ? { id: Date.now(), title: draft.title.trim(), description: draft.description.trim() || "External reference.", type: draft.type, kind: "link", url: normalizeUrl(draft.url) }
      : { id: Date.now(), title: draft.title.trim(), description: draft.description.trim() || "Saved resource.", type: draft.type, kind: "file", meta: file?.meta ?? "File", url: file?.url ?? "" };
    onChange([item, ...items]);
    setDraft({ title: "", description: "", type: types[0]!, url: "" });
    setFile(null);
    setOpen(false);
  };

  const shown = filter === "All" ? items : items.filter(item => item.type === filter);

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> Add resource</Button>
    </div>

    <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {["All", ...types].map(item => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === item ? "bg-academic text-academic-foreground" : "bg-muted text-muted-foreground"}`}>{item}</button>)}
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Title</span><input autoFocus value={draft.title} onChange={e => setDraft(current => ({ ...current, title: e.target.value }))} placeholder="Resource title" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Type</span><select value={draft.type} onChange={e => setDraft(current => ({ ...current, type: e.target.value }))} className={field}>{types.map(item => <option key={item}>{item}</option>)}</select></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Description</span><textarea value={draft.description} onChange={e => setDraft(current => ({ ...current, description: e.target.value }))} rows={2} placeholder="What is this resource for?" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">External URL</span><input value={draft.url} onChange={e => setDraft(current => ({ ...current, url: e.target.value }))} placeholder="lib.ui.ac.id/…" className={field} /></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">File upload</span>
        <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
          <Paperclip className="size-4 shrink-0 text-academic" />
          <span className="min-w-0 flex-1 truncate">{file?.name ?? "Upload a file"}</span>
          <input type="file" className="sr-only" onChange={e => { const picked = e.target.files?.[0]; if (picked) setFile({ name: picked.name, meta: `${picked.name.split(".").pop()?.toUpperCase() ?? "FILE"} · ${formatSize(picked.size)}`, url: URL.createObjectURL(picked) }); e.target.value = ""; }} />
        </span>
      </label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Enter a valid address, e.g. drive.google.com/file/123</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Save resource</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X /> Cancel</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {shown.length ? shown.map(item => <article key={item.id} className="rounded-xl border border-border bg-muted p-3">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-academic">{item.kind === "link" ? <Link2 className="size-5" /> : item.type === "Books" ? <BookOpen className="size-5" /> : <FileText className="size-5" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span className="rounded-full bg-background px-2 py-0.5">{item.type}</span>{item.kind === "link" ? hostOf(item.url) : item.meta}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {item.kind === "link"
            ? <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Open link</a>
            : <a href={item.url || "#"} download={item.title} className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Download className="size-3.5" />Download</a>}
          <button onClick={() => onChange(items.filter(entry => entry.id !== item.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"><Trash2 className="size-3.5" />Remove</button>
        </div>
      </article>) : <div className="sm:col-span-2"><EmptyState
        icon={FileText}
        eyebrow={title}
        title={filter === "All" ? `Start building your ${title.toLowerCase()}` : `Nothing filed under ${filter} yet`}
        description={subtitle}
        actions={[
          { label: "Add resource", icon: Plus, onClick: () => setOpen(true) },
          ...(filter === "All" ? [] : [{ label: "Show all types", onClick: () => setFilter("All") }]),
        ]}
        hints={["Upload a file or paste a link — both are searchable", "Give each item a short description so future you remembers why it matters"]}
        compact
      /></div>}
    </div>
  </section>;
}

function NotesPanel({ notes, onChange }: { notes: ArchiveNote[]; onChange: (notes: ArchiveNote[]) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", topic: "", body: "", link: "" });
  const [attachment, setAttachment] = useState("");
  const invalid = draft.link.trim().length > 0 && !isValidUrl(draft.link);

  const save = () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    if (draft.link.trim() && !isValidUrl(draft.link)) return;
    const note: ArchiveNote = {
      id: Date.now(), title: draft.title.trim(), topic: draft.topic.trim() || "General", body: draft.body.trim(),
      ...(attachment ? { attachment } : {}),
      ...(draft.link.trim() ? { link: normalizeUrl(draft.link) } : {}),
    };
    onChange([note, ...notes]);
    setDraft({ title: "", topic: "", body: "", link: "" });
    setAttachment("");
    setOpen(false);
  };

  return <section className="academic-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold">Notes</h2><p className="mt-1 text-xs text-muted-foreground">Your knowledge notes, with files and linked resources.</p></div>
      <Button variant="yellow" size="sm" onClick={() => setOpen(value => !value)}><Plus /> New note</Button>
    </div>

    {open && <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-input p-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Title</span><input autoFocus value={draft.title} onChange={e => setDraft(current => ({ ...current, title: e.target.value }))} placeholder="Note title" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Topic</span><input value={draft.topic} onChange={e => setDraft(current => ({ ...current, topic: e.target.value }))} placeholder="Week 5" className={field} /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Note</span><textarea value={draft.body} onChange={e => setDraft(current => ({ ...current, body: e.target.value }))} rows={4} placeholder="Write your study note…" className={field} /></label>
      <label><span className="mb-1 block text-xs font-semibold text-muted-foreground">Linked resource</span><input value={draft.link} onChange={e => setDraft(current => ({ ...current, link: e.target.value }))} placeholder="notion.so/…" className={field} /></label>
      <label className="flex flex-col"><span className="mb-1 block text-xs font-semibold text-muted-foreground">Attachment</span>
        <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground">
          <Paperclip className="size-4 shrink-0 text-academic" />
          <span className="min-w-0 flex-1 truncate">{attachment || "Attach a file"}</span>
          <input type="file" className="sr-only" onChange={e => { const picked = e.target.files?.[0]; if (picked) setAttachment(picked.name); e.target.value = ""; }} />
        </span>
      </label>
      {invalid && <p className="text-xs font-medium text-destructive sm:col-span-2">Enter a valid address for the linked resource.</p>}
      <div className="flex gap-2 sm:col-span-2"><Button variant="academic" size="sm" onClick={save}><Save /> Save note</Button><Button variant="ghost" size="sm" onClick={() => setOpen(false)}><X /> Cancel</Button></div>
    </div>}

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {notes.length ? notes.map(note => <article key={note.id} className="rounded-xl border border-border bg-muted p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="truncate text-sm font-bold">{note.title}</h3><p className="mt-1 text-[10px] font-semibold uppercase text-academic">{note.topic}</p></div>
          <button onClick={() => onChange(notes.filter(item => item.id !== note.id))} className="text-muted-foreground" aria-label="Delete note"><Trash2 className="size-4" /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {note.attachment && <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><Paperclip className="size-3.5" />{note.attachment}</span>}
          {note.link && <a href={note.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1.5 text-xs font-semibold text-academic"><ExternalLink className="size-3.5" />Open resource</a>}
        </div>
      </article>) : <div className="md:col-span-2"><EmptyState
        icon={NotebookPen}
        eyebrow="Notes"
        title="Your understanding lives here"
        description="Write what you understood in your own words after each session. Notes can carry an attachment and a linked resource, and they show up in global search."
        actions={[{ label: "Write first note", icon: Plus, onClick: () => setOpen(true) }]}
        hints={["One note per topic or week works best", "Attach the slide or reading you took it from"]}
        compact
      /></div>}
    </div>
  </section>;
}
