import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ClipboardList, Clock3, GraduationCap, MapPin, Plus, Sparkles, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { activateCurriculum, courseAvailability, sksTotal, usePrograms, useProgramCurriculum, type CatalogCourse } from "@/data/curriculum-catalog";
import { CLASS_DAYS, SECTIONS, type ActiveCourseConfig, type ClassDay, type CustomCourse, type Section, type StudentSetup } from "@/data/setup";

const steps = [
  { id: 1, label: "Academic identity", hint: "Who you are" },
  { id: 2, label: "Curriculum", hint: "Your degree map" },
  { id: 3, label: "Current semester", hint: "Where you are" },
  { id: 4, label: "Completed courses", hint: "What you finished" },
  { id: 5, label: "This semester", hint: "What you take now" },
  { id: 6, label: "Class setup", hint: "Section & schedule" },
  { id: 7, label: "Extra courses", hint: "Outside the curriculum" },
  { id: 8, label: "Your dashboard", hint: "Everything in one place" },
];

const fieldClass = "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-academic";

export function Onboarding({ onComplete }: { onComplete: (setup: StudentSetup) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [entryYear, setEntryYear] = useState(2024);
  const [semester, setSemester] = useState(5);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, ActiveCourseConfig>>({});
  const [customCourses, setCustomCourses] = useState<CustomCourse[]>([]);

  const addCustomCourse = () =>
    setCustomCourses((list) => [
      ...list,
      { code: `EXT-${list.length + 1}`, name: "", faculty: "", sks: 3, lecturer: "", day: "Monday", start: "08:00", end: "10:30", room: "", countsTowardGraduation: true },
    ]);
  const patchCustomCourse = (index: number, patch: Partial<CustomCourse>) =>
    setCustomCourses((list) => list.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  const removeCustomCourse = (index: number) => setCustomCourses((list) => list.filter((_, position) => position !== index));

  const { programs } = usePrograms();
  const [programId, setProgramId] = useState<string | null>(null);
  const selectedProgram = programs.find((item) => item.id === programId) ?? programs[0] ?? null;
  const { curriculum: catalog, loading: curriculumLoading } = useProgramCurriculum(selectedProgram);

  const program = catalog.program.name;
  const faculty = catalog.program.faculty;
  const university = catalog.program.university;
  const courses = catalog.courses;
  const semesterGroups = catalog.semesterGroups;
  const courseByCode = useMemo(() => new Map(courses.map((course) => [course.code, course])), [courses]);

  const completedSks = sksTotal(completed);
  const progress = {
    completedSks,
    remainingSks: Math.max(0, catalog.totalSks - completedSks),
    percent: Math.min(100, Math.round((completedSks / catalog.totalSks) * 100)),
  };
  const suggestedNow = useMemo(() => courses.filter((course) => course.semester === semester), [courses, semester]);

  const todayName = CLASS_DAYS[(new Date().getDay() + 6) % 7] ?? "Monday";
  const todaySchedule = useMemo(() => {
    const fromCurriculum = activeCodes.flatMap((code) => {
      const config = configs[code];
      const course = courses.find((item) => item.code === code);
      if (!config || !course || config.day !== todayName) return [];
      return [{ key: code, title: course.name, start: config.start, end: config.end, room: config.room }];
    });
    const fromCustom = customCourses
      .filter((course) => course.name.trim() && course.day === todayName)
      .map((course, index) => ({ key: `extra-${index}`, title: course.name.trim(), start: course.start, end: course.end, room: course.room }));
    return [...fromCurriculum, ...fromCustom].sort((a, b) => a.start.localeCompare(b.start));
  }, [activeCodes, configs, courses, customCourses, todayName]);

  const toggleCompleted = (code: string) =>
    setCompleted((list) => (list.includes(code) ? list.filter((item) => item !== code) : [...list, code]));

  const toggleActive = (code: string) =>
    setActiveCodes((list) => {
      if (list.includes(code)) return list.filter((item) => item !== code);
      setConfigs((current) => current[code] ? current : {
        ...current,
        [code]: { code, section: "A", lecturer: "", assistant: "", day: "Monday", start: "08:00", end: "10:30", room: "" },
      });
      return [...list, code];
    });

  const patchConfig = (code: string, patch: Partial<ActiveCourseConfig>) =>
    setConfigs((current) => {
      const existing = current[code];
      if (!existing) return current;
      return { ...current, [code]: { ...existing, ...patch } };
    });

  const markSemesterCompleted = (target: number) => {
    const codes = courses.filter((course) => course.semester <= target && course.category !== "Final Project" && course.category !== "Elective" && !course.note).map((course) => course.code);
    setCompleted((list) => Array.from(new Set([...list, ...codes])));
  };

  const canContinue =
    step === 1 ? name.trim().length > 1 :
    step === 5 ? activeCodes.length > 0 :
    true;

  const finish = () => {
    activateCurriculum(catalog);
    onComplete({
      name: name.trim(), program, faculty, university, entryYear, currentSemester: semester,
      ...(catalog.program.id.startsWith("fallback") ? {} : { programId: catalog.program.id }),
      completed, active: activeCodes.flatMap((code) => configs[code] ? [configs[code] as ActiveCourseConfig] : []),
      customCourses: customCourses
        .filter((course) => course.name.trim().length > 0)
        .map((course, index) => ({ ...course, code: course.code.trim() || `EXT-${index + 1}`, name: course.name.trim() })),
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><GraduationCap className="size-5" /></div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold">LET’S SET UP YOUR ACADEMIC LIFE</p>
            <p className="truncate text-xs text-muted-foreground">Step {step} of {steps.length} · {steps[step - 1]?.label}</p>
          </div>
        </div>
        <Progress value={(step / steps.length) * 100} className="h-1 rounded-none" />
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-7 pb-28">
        <div className="mb-7 hidden flex-wrap gap-2 md:flex">
          {steps.map((item) => (
            <span key={item.id} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${item.id === step ? "bg-academic text-academic-foreground" : item.id < step ? "bg-accent text-academic" : "bg-muted text-muted-foreground"}`}>
              {item.id < step ? <Check className="mr-1 inline size-3" /> : null}{item.label}
            </span>
          ))}
        </div>

        <div key={step} className="page-enter space-y-5">
          {step === 1 && (
            <section className="academic-card p-6">
              <StepTitle icon={UserRound} eyebrow="Step 1" title="Tell us who you are" subtitle="This personalises your dashboard, journey, and performance pages." />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Rasyid" className={fieldClass} /></Field>
                <Field label="Study program">
                  <select value={selectedProgram?.id ?? ""} onChange={(event) => setProgramId(event.target.value)} className={fieldClass}>
                    {programs.map((item) => (
                      <option key={item.id} value={item.id}>{item.degree} {item.name} · Kurikulum {item.curriculumYear}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Faculty"><input value={faculty} readOnly className={fieldClass} /></Field>
                <Field label="University"><input value={university} readOnly className={fieldClass} /></Field>
                <Field label="Entry year">
                  <select value={entryYear} onChange={(event) => setEntryYear(Number(event.target.value))} className={fieldClass}>
                    {Array.from({ length: 8 }, (_, index) => 2026 - index).map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="academic-card p-6">
              <StepTitle icon={Sparkles} eyebrow="Step 3" title="Which semester are you in?" subtitle="We use this for your dashboard, academic journey, and curriculum progress." />
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
                  <button key={value} onClick={() => setSemester(value)} className={`rounded-2xl border p-4 text-left transition-colors ${semester === value ? "border-academic bg-accent" : "border-input bg-surface hover:bg-muted"}`}>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Semester</p>
                    <p className={`mt-1 font-display text-2xl font-bold ${semester === value ? "text-academic" : ""}`}>{value}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{courses.filter((course) => course.semester === value).length} courses</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div className="academic-card overflow-hidden">
                <div className="bg-academic p-6 text-academic-foreground">
                  <p className="text-xs font-semibold opacity-80">{curriculumLoading ? "DETECTING CURRICULUM…" : "CURRICULUM DETECTED AUTOMATICALLY"}</p>
                  <h2 className="mt-2 text-2xl font-bold">{catalog.program.degree === "Sarjana (S1)" ? "Bachelor of " : ""}{catalog.program.name} — {catalog.program.faculty.includes("Ekonomi") ? "FEB" : catalog.program.faculty} {catalog.program.university.includes("Indonesia") ? "UI" : catalog.program.university}</h2>
                  <p className="mt-1 text-sm opacity-85">Curriculum {catalog.program.curriculumYear} · {catalog.totalSks} SKS required to graduate</p>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  <Stat label="Program" value={`${catalog.program.name} (${catalog.program.degree})`} />
                  <Stat label="Curriculum year" value={`${catalog.program.curriculumYear}`} />
                  <Stat label="Graduation requirement" value={`${catalog.totalSks} SKS`} />
                </div>
                <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-5">
                  {catalog.structure.map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-sm font-bold">{item.sks} SKS</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><BookOpen className="size-4 text-academic" />Semester roadmap</p>
                <div className="mt-4 space-y-3">
                  {semesterGroups.map((group) => (
                    <div key={group.semester} className="rounded-xl bg-muted p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">Semester {group.semester}</p>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-academic">{sksTotal(group.courses.map((course) => course.code))} SKS</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{group.courses.map((course) => course.name).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={CheckCircle2} eyebrow="Step 4" title="Which courses have you completed?" subtitle="Tick everything you already passed. Your degree progress updates instantly." />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Completed" value={`${progress.completedSks} SKS`} />
                  <Stat label="Remaining" value={`${progress.remainingSks} SKS`} />
                  <Stat label="Degree progress" value={`${progress.percent}%`} />
                </div>
                <Progress value={progress.percent} className="mt-4 h-2" />
                {semester > 1 && (
                  <button onClick={() => markSemesterCompleted(semester - 1)} className="mt-4 text-xs font-semibold text-academic">
                    Mark everything up to semester {semester - 1} as completed
                  </button>
                )}
              </div>
              {semesterGroups.map((group) => (
                <div key={group.semester} className="academic-card p-5">
                  <p className="text-sm font-bold">Semester {group.semester}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.courses.map((course) => {
                      const picked = completed.includes(course.code);
                      return (
                        <button key={course.code} onClick={() => toggleCompleted(course.code)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${picked ? "border-academic bg-accent" : "border-input bg-surface hover:bg-muted"}`}>
                          <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${picked ? "border-academic bg-academic text-academic-foreground" : "border-input"}`}>{picked && <Check className="size-3.5" />}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-5">{course.name}</span>
                            <span className="block text-[11px] text-muted-foreground">{course.code} · {course.sks} SKS · {course.group}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={ClipboardList} eyebrow="Step 5" title="What are you taking this semester?" subtitle={`Suggested from semester ${semester} of the curriculum. You can pick from any semester below.`} />
                <p className="mt-4 text-xs font-semibold text-academic">{activeCodes.length} selected · {sksTotal(activeCodes)} SKS</p>
              </div>
              <CoursePicker title={`Suggested — semester ${semester}`} courses={suggestedNow} selected={activeCodes} completed={completed} onToggle={toggleActive} />
              {semesterGroups.filter((group) => group.semester !== semester).map((group) => (
                <CoursePicker key={group.semester} title={`Semester ${group.semester}`} courses={group.courses} selected={activeCodes} completed={completed} onToggle={toggleActive} />
              ))}
            </section>
          )}

          {step === 6 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={Clock3} eyebrow="Step 6" title="Set up your classes" subtitle="Section, lecturer, assistant, weekly schedule, and room for each active course." />
              </div>
              {activeCodes.map((code) => {
                const course = courseByCode.get(code);
                const config = configs[code];
                if (!course || !config) return null;
                return (
                  <div key={code} className="academic-card overflow-hidden">
                    <div className="border-b border-border bg-muted px-5 py-3.5">
                      <p className="text-[11px] font-semibold text-academic">{course.code} · {course.sks} SKS</p>
                      <h3 className="mt-0.5 text-base font-bold">{course.name}</h3>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Class section</p>
                        <div className="mt-2 flex gap-2">
                          {SECTIONS.map((section) => (
                            <button key={section} onClick={() => patchConfig(code, { section: section as Section })} className={`grid size-10 place-items-center rounded-xl border text-sm font-bold transition-colors ${config.section === section ? "border-academic bg-academic text-academic-foreground" : "border-input bg-surface hover:bg-muted"}`}>{section}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Lecturer"><input value={config.lecturer} onChange={(event) => patchConfig(code, { lecturer: event.target.value })} placeholder="Lecturer name" className={fieldClass} /></Field>
                        <Field label="Assistant lecturer"><input value={config.assistant} onChange={(event) => patchConfig(code, { assistant: event.target.value })} placeholder="Assistant name" className={fieldClass} /></Field>
                        <Field label="Day">
                          <select value={config.day} onChange={(event) => patchConfig(code, { day: event.target.value as ClassDay })} className={fieldClass}>
                            {CLASS_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                          </select>
                        </Field>
                        <Field label="Room"><input value={config.room} onChange={(event) => patchConfig(code, { room: event.target.value })} placeholder="e.g. A212" className={fieldClass} /></Field>
                        <Field label="Start time"><input type="time" value={config.start} onChange={(event) => patchConfig(code, { start: event.target.value })} className={fieldClass} /></Field>
                        <Field label="End time"><input type="time" value={config.end} onChange={(event) => patchConfig(code, { end: event.target.value })} className={fieldClass} /></Field>
                      </div>
                      <p className="flex flex-wrap items-center gap-3 rounded-xl bg-muted px-3.5 py-2.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-academic">Class {config.section}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{config.day} · {config.start} – {config.end}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{config.room || "Room TBA"}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {step === 7 && (
            <section className="space-y-4">
              <div className="academic-card p-6">
                <StepTitle icon={Plus} eyebrow="Step 7" title="Any courses outside your curriculum?" subtitle="Cross-faculty classes, MBKM, or extra learning. Skip this if you have none." />
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Extra courses" value={`${customCourses.length}`} />
                  <Stat label="Extra SKS" value={`${customCourses.reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS`} />
                  <Stat label="Counted for graduation" value={`${customCourses.filter((course) => course.countsTowardGraduation).reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS`} />
                </div>
                <Button variant="academic" className="mt-4" onClick={addCustomCourse}><Plus className="size-4" />Add a course</Button>
              </div>

              {customCourses.map((course, index) => (
                <div key={index} className="academic-card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3.5">
                    <p className="text-sm font-bold">{course.name.trim() || `Extra course ${index + 1}`}</p>
                    <button onClick={() => removeCustomCourse(index)} className="text-muted-foreground transition-colors hover:text-destructive" aria-label="Remove course"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2">
                    <Field label="Course name"><input value={course.name} onChange={(event) => patchCustomCourse(index, { name: event.target.value })} placeholder="e.g. Data Science for Business" className={fieldClass} /></Field>
                    <Field label="Faculty"><input value={course.faculty} onChange={(event) => patchCustomCourse(index, { faculty: event.target.value })} placeholder="e.g. Fakultas Ilmu Komputer" className={fieldClass} /></Field>
                    <Field label="Credits (SKS)"><input type="number" min={1} max={12} value={course.sks} onChange={(event) => patchCustomCourse(index, { sks: Number(event.target.value) })} className={fieldClass} /></Field>
                    <Field label="Lecturer"><input value={course.lecturer} onChange={(event) => patchCustomCourse(index, { lecturer: event.target.value })} placeholder="Lecturer name" className={fieldClass} /></Field>
                    <Field label="Day">
                      <select value={course.day} onChange={(event) => patchCustomCourse(index, { day: event.target.value as ClassDay })} className={fieldClass}>
                        {CLASS_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                      </select>
                    </Field>
                    <Field label="Room"><input value={course.room} onChange={(event) => patchCustomCourse(index, { room: event.target.value })} placeholder="e.g. B301" className={fieldClass} /></Field>
                    <Field label="Start time"><input type="time" value={course.start} onChange={(event) => patchCustomCourse(index, { start: event.target.value })} className={fieldClass} /></Field>
                    <Field label="End time"><input type="time" value={course.end} onChange={(event) => patchCustomCourse(index, { end: event.target.value })} className={fieldClass} /></Field>
                    <label className="sm:col-span-2 flex items-center gap-3 rounded-xl bg-muted px-3.5 py-3 text-sm">
                      <input type="checkbox" checked={course.countsTowardGraduation} onChange={(event) => patchCustomCourse(index, { countsTowardGraduation: event.target.checked })} className="size-4 accent-current text-academic" />
                      <span className="font-semibold">Count toward graduation credits</span>
                    </label>
                  </div>
                </div>
              ))}
            </section>
          )}

          {step === 8 && (
            <section className="space-y-4">
              <div className="academic-card overflow-hidden">
                <div className="bg-academic p-6 text-academic-foreground">
                  <p className="text-xs font-semibold opacity-80">YOUR ACADEMIC OPERATING SYSTEM IS READY</p>
                  <h2 className="mt-2 text-2xl font-bold">{name.trim() || "Student"} · Semester {semester}</h2>
                  <p className="mt-1 text-sm opacity-85">{catalog.program.name} · {faculty} · {university} · Angkatan {entryYear}</p>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-4">
                  <Stat label="Current semester" value={`Semester ${semester}`} />
                  <Stat label="Credits completed" value={`${progress.completedSks} / ${catalog.totalSks} SKS`} />
                  <Stat label="Remaining" value={`${progress.remainingSks} SKS`} />
                  <Stat label="Degree progress" value={`${progress.percent}%`} />
                </div>
                <div className="px-5 pb-5"><Progress value={progress.percent} className="h-2" /></div>
              </div>

              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><ClipboardList className="size-4 text-academic" />Courses this semester · {sksTotal(activeCodes) + customCourses.reduce((total, course) => total + (Number(course.sks) || 0), 0)} SKS</p>
                <div className="mt-3 space-y-2">
                  {activeCodes.map((code) => {
                    const course = courseByCode.get(code);
                    const config = configs[code];
                    if (!course || !config) return null;
                    return (
                      <div key={code} className="rounded-xl bg-muted p-3.5">
                        <p className="text-sm font-bold">{course.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">Class {config.section} · {course.sks} SKS · {config.lecturer || "Lecturer TBA"} · {config.day} {config.start}–{config.end} · {config.room || "Room TBA"}</p>
                      </div>
                    );
                  })}
                  {customCourses.filter((course) => course.name.trim()).map((course, index) => (
                    <div key={`extra-${index}`} className="rounded-xl bg-muted p-3.5">
                      <p className="text-sm font-bold">{course.name} <span className="text-[10px] font-semibold text-academic">EXTRA</span></p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{course.faculty || "Outside curriculum"} · {course.sks} SKS · {course.day} {course.start}–{course.end} · {course.countsTowardGraduation ? "Counts toward graduation" : "Not counted"}</p>
                    </div>
                  ))}
                  {!activeCodes.length && !customCourses.length && <p className="text-sm text-muted-foreground">No active courses picked yet.</p>}
                </div>
              </div>

              <div className="academic-card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Clock3 className="size-4 text-academic" />Today · {todayName}</p>
                <div className="mt-3 space-y-2">
                  {todaySchedule.length ? todaySchedule.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 rounded-xl bg-muted p-3.5">
                      <span className="font-display text-sm font-bold text-academic">{item.start}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{item.start} – {item.end} · {item.room || "Room TBA"}</span>
                      </span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Nothing scheduled today — a good day to get ahead.</p>}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <Button variant="ghost" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}><ArrowLeft className="size-4" />Back</Button>
          <p className="hidden text-xs text-muted-foreground sm:block">{steps[step - 1]?.hint}</p>
          {step < steps.length
            ? <Button variant="academic" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Continue<ArrowRight className="size-4" /></Button>
            : <Button variant="academic" onClick={finish}>Open my dashboard<ArrowRight className="size-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

function CoursePicker({ title, courses, selected, completed, onToggle }: { title: string; courses: CatalogCourse[]; selected: string[]; completed: string[]; onToggle: (code: string) => void }) {
  return (
    <div className="academic-card p-5">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {courses.map((course) => {
          const picked = selected.includes(course.code);
          const { status, missing } = courseAvailability(course, completed);
          const locked = status === "Locked" && !picked;
          return (
            <button key={course.code} onClick={() => onToggle(course.code)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${picked ? "border-academic bg-accent" : locked ? "border-input bg-muted/60 opacity-70 hover:opacity-100" : "border-input bg-surface hover:bg-muted"}`}>
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${picked ? "border-academic bg-academic text-academic-foreground" : "border-input"}`}>{picked && <Check className="size-3.5" />}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5">{course.name}</span>
                <span className="block text-[11px] text-muted-foreground">{course.code} · {course.sks} SKS · {course.category}</span>
                {locked && <span className="mt-1 block text-[11px] font-semibold text-destructive">Locked · needs {missing.join(", ")}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepTitle({ icon: Icon, eyebrow, title, subtitle }: { icon: typeof UserRound; eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-academic"><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase text-academic">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold leading-7">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>{children}</label>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
