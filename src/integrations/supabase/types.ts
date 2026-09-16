export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assistant_sessions: {
        Row: {
          assistant: string | null
          course_code: string
          created_at: string
          day: string | null
          end_time: string | null
          enrollment_id: string | null
          id: string
          link: string | null
          room: string | null
          section: string | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          assistant?: string | null
          course_code: string
          created_at?: string
          day?: string | null
          end_time?: string | null
          enrollment_id?: string | null
          id?: string
          link?: string | null
          room?: string | null
          section?: string | null
          start_time?: string | null
          user_id?: string
        }
        Update: {
          assistant?: string | null
          course_code?: string
          created_at?: string
          day?: string | null
          end_time?: string | null
          enrollment_id?: string | null
          id?: string
          link?: string | null
          room?: string | null
          section?: string | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_code: string
          course_name: string | null
          created_at: string
          curriculum_course_id: string | null
          custom_course_id: string | null
          id: string
          lecturer: string | null
          semester_id: string | null
          sks: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_code: string
          course_name?: string | null
          created_at?: string
          curriculum_course_id?: string | null
          custom_course_id?: string | null
          id?: string
          lecturer?: string | null
          semester_id?: string | null
          sks?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          course_code?: string
          course_name?: string | null
          created_at?: string
          curriculum_course_id?: string | null
          custom_course_id?: string | null
          id?: string
          lecturer?: string | null
          semester_id?: string | null
          sks?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_curriculum_course_id_fkey"
            columns: ["curriculum_course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_custom_course_id_fkey"
            columns: ["custom_course_id"]
            isOneToOne: false
            referencedRelation: "custom_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prerequisites: {
        Row: {
          course_id: string
          id: string
          prerequisite_code: string
        }
        Insert: {
          course_id: string
          id?: string
          prerequisite_code: string
        }
        Update: {
          course_id?: string
          id?: string
          prerequisite_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "curriculum_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          assistant: string | null
          created_at: string
          enrollment_id: string
          id: string
          lecturer: string | null
          room: string | null
          section: string
          user_id: string
        }
        Insert: {
          assistant?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          lecturer?: string | null
          room?: string | null
          section: string
          user_id?: string
        }
        Update: {
          assistant?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          lecturer?: string | null
          room?: string | null
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_courses: {
        Row: {
          category: string | null
          code: string
          course_group: string | null
          created_at: string
          id: string
          name: string
          note: string | null
          program_id: string | null
          semester: number | null
          sks: number
          track: string | null
        }
        Insert: {
          category?: string | null
          code: string
          course_group?: string | null
          created_at?: string
          id?: string
          name: string
          note?: string | null
          program_id?: string | null
          semester?: number | null
          sks?: number
          track?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          course_group?: string | null
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          program_id?: string | null
          semester?: number | null
          sks?: number
          track?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_courses: {
        Row: {
          code: string
          counts_toward_graduation: boolean
          course_group: string | null
          created_at: string
          day: string | null
          end_time: string | null
          faculty: string | null
          id: string
          lecturer: string | null
          name: string
          note: string | null
          room: string | null
          semester: number | null
          sks: number
          start_time: string | null
          user_id: string
        }
        Insert: {
          code: string
          counts_toward_graduation?: boolean
          course_group?: string | null
          created_at?: string
          day?: string | null
          end_time?: string | null
          faculty?: string | null
          id?: string
          lecturer?: string | null
          name: string
          note?: string | null
          room?: string | null
          semester?: number | null
          sks?: number
          start_time?: string | null
          user_id?: string
        }
        Update: {
          code?: string
          counts_toward_graduation?: boolean
          course_group?: string | null
          created_at?: string
          day?: string | null
          end_time?: string | null
          faculty?: string | null
          id?: string
          lecturer?: string | null
          name?: string
          note?: string | null
          room?: string | null
          semester?: number | null
          sks?: number
          start_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          course_code: string | null
          created_at: string
          enrollment_id: string | null
          exam_date: string | null
          id: string
          kind: string
          readiness: number
          room: string | null
          start_time: string | null
          title: string
          topics: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          exam_date?: string | null
          id?: string
          kind?: string
          readiness?: number
          room?: string | null
          start_time?: string | null
          title: string
          topics?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          exam_date?: string | null
          id?: string
          kind?: string
          readiness?: number
          room?: string | null
          start_time?: string | null
          title?: string
          topics?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          component: string | null
          course_code: string | null
          created_at: string
          enrollment_id: string | null
          grade_point: number | null
          id: string
          letter: string | null
          score: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          component?: string | null
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          grade_point?: number | null
          id?: string
          letter?: string | null
          score?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Update: {
          component?: string | null
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          grade_point?: number | null
          id?: string
          letter?: string | null
          score?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          attachment: string | null
          body: string | null
          course_code: string | null
          created_at: string
          enrollment_id: string | null
          id: string
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment?: string | null
          body?: string | null
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          title: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          attachment?: string | null
          body?: string | null
          course_code?: string | null
          created_at?: string
          enrollment_id?: string | null
          id?: string
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          code: string
          created_at: string
          curriculum_year: number
          degree: string | null
          faculty: string
          id: string
          is_active: boolean
          name: string
          total_sks: number
          university: string
        }
        Insert: {
          code: string
          created_at?: string
          curriculum_year?: number
          degree?: string | null
          faculty: string
          id?: string
          is_active?: boolean
          name: string
          total_sks?: number
          university: string
        }
        Update: {
          code?: string
          created_at?: string
          curriculum_year?: number
          degree?: string | null
          faculty?: string
          id?: string
          is_active?: boolean
          name?: string
          total_sks?: number
          university?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          course_code: string | null
          created_at: string
          description: string | null
          enrollment_id: string | null
          file_path: string | null
          file_size: number | null
          id: string
          kind: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          description?: string | null
          enrollment_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          description?: string | null
          enrollment_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          kind?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          day: string
          end_time: string
          enrollment_id: string | null
          id: string
          kind: string
          room: string | null
          section_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          end_time: string
          enrollment_id?: string | null
          id?: string
          kind?: string
          room?: string | null
          section_id?: string | null
          start_time: string
          user_id?: string
        }
        Update: {
          created_at?: string
          day?: string
          end_time?: string
          enrollment_id?: string | null
          id?: string
          kind?: string
          room?: string | null
          section_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          academic_year: string | null
          created_at: string
          gpa: number | null
          id: string
          notes: string | null
          number: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          gpa?: number | null
          id?: string
          notes?: string | null
          number: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          gpa?: number | null
          id?: string
          notes?: string | null
          number?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          current_semester: number
          entry_year: number
          faculty: string
          id: string
          name: string
          onboarding_completed_at: string | null
          program: string
          program_id: string | null
          target_gpa: number
          target_sks: number
          university: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_semester?: number
          entry_year?: number
          faculty?: string
          id?: string
          name?: string
          onboarding_completed_at?: string | null
          program?: string
          program_id?: string | null
          target_gpa?: number
          target_sks?: number
          university?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          current_semester?: number
          entry_year?: number
          faculty?: string
          id?: string
          name?: string
          onboarding_completed_at?: string | null
          program?: string
          program_id?: string | null
          target_gpa?: number
          target_sks?: number
          university?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          checklist: Json
          course_code: string | null
          created_at: string
          description: string | null
          done: boolean
          due_date: string | null
          enrollment_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checklist?: Json
          course_code?: string | null
          created_at?: string
          description?: string | null
          done?: boolean
          due_date?: string | null
          enrollment_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          checklist?: Json
          course_code?: string | null
          created_at?: string
          description?: string | null
          done?: boolean
          due_date?: string | null
          enrollment_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
