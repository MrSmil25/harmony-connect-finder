export type StudentProfile = {
  name: string;
  initials: string;
  program: string;
  faculty: string;
  university: string;
  entryYear: number;
  currentSemester: number;
  semesterLabel: string;
  targetGpa: number;
  targetSks: number;
};

export const studentProfile: StudentProfile = {
  name: "Rasyid",
  initials: "RS",
  program: "Manajemen",
  faculty: "Fakultas Ekonomi dan Bisnis",
  university: "Universitas Indonesia",
  entryYear: 2024,
  currentSemester: 5,
  semesterLabel: "Semester Gasal 2026/2027",
  targetGpa: 3.85,
  targetSks: 144,
};

export const profileLine = `${studentProfile.program} ${studentProfile.faculty.replace("Fakultas Ekonomi dan Bisnis", "FEB")} ${studentProfile.university.replace("Universitas Indonesia", "UI")}`;
