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
      admin_requests: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["admin_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admin_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["admin_request_status"]
          user_id?: string
        }
        Relationships: []
      }
      admin_role_revocations: {
        Row: {
          email: string
          first_name: string
          id: string
          last_name: string
          revoked_at: string
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          email: string
          first_name: string
          id?: string
          last_name: string
          revoked_at?: string
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          revoked_at?: string
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          published_at: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_index: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_index: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenge_attempts: {
        Row: {
          challenge_date: string
          challenge_id: string
          completed_at: string
          id: string
          is_correct: boolean
          selected_index: number
          user_id: string
        }
        Insert: {
          challenge_date: string
          challenge_id: string
          completed_at?: string
          id?: string
          is_correct: boolean
          selected_index: number
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          completed_at?: string
          id?: string
          is_correct?: boolean
          selected_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges_public"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          bible_reference: string | null
          challenge_date: string
          correct_index: number
          created_at: string
          created_by: string | null
          id: string
          options: Json
          prompt: string
        }
        Insert: {
          bible_reference?: string | null
          challenge_date: string
          correct_index: number
          created_at?: string
          created_by?: string | null
          id?: string
          options: Json
          prompt: string
        }
        Update: {
          bible_reference?: string | null
          challenge_date?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          id?: string
          options?: Json
          prompt?: string
        }
        Relationships: []
      }
      daily_gospel: {
        Row: {
          commentary: string | null
          created_at: string
          gospel_date: string
          id: string
          reference: string
          verse: string
        }
        Insert: {
          commentary?: string | null
          created_at?: string
          gospel_date?: string
          id?: string
          reference: string
          verse: string
        }
        Update: {
          commentary?: string | null
          created_at?: string
          gospel_date?: string
          id?: string
          reference?: string
          verse?: string
        }
        Relationships: []
      }
      daily_quotes: {
        Row: {
          commentary: string | null
          created_at: string
          id: string
          quote: string
          quote_date: string
          reference: string
        }
        Insert: {
          commentary?: string | null
          created_at?: string
          id?: string
          quote: string
          quote_date?: string
          reference: string
        }
        Update: {
          commentary?: string | null
          created_at?: string
          id?: string
          quote?: string
          quote_date?: string
          reference?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          age: number | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          parent_first_name: string | null
          parent_last_name: string | null
          parent_phone: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          age?: number | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          age?: number | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          parent_first_name?: string | null
          parent_last_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          bible_reference: string | null
          correct_index: number
          created_at: string
          id: string
          options: Json
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          bible_reference?: string | null
          correct_index: number
          created_at?: string
          id?: string
          options: Json
          position?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          bible_reference?: string | null
          correct_index?: number
          created_at?: string
          id?: string
          options?: Json
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          quiz_id: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          bible_reference: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          publish_date: string
          title: string
          updated_at: string
        }
        Insert: {
          bible_reference?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          publish_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          bible_reference?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          publish_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          day_of_week: string
          description: string | null
          id: string
          location: string | null
          position: number
          time: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          description?: string | null
          id?: string
          location?: string | null
          position?: number
          time: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          description?: string | null
          id?: string
          location?: string | null
          position?: number
          time?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      daily_challenges_public: {
        Row: {
          bible_reference: string | null
          challenge_date: string | null
          created_at: string | null
          id: string | null
          options: Json | null
          prompt: string | null
        }
        Insert: {
          bible_reference?: string | null
          challenge_date?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          prompt?: string | null
        }
        Update: {
          bible_reference?: string | null
          challenge_date?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          prompt?: string | null
        }
        Relationships: []
      }
      questions_public: {
        Row: {
          bible_reference: string | null
          created_at: string | null
          id: string | null
          options: Json | null
          position: number | null
          prompt: string | null
          quiz_id: string | null
        }
        Insert: {
          bible_reference?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          position?: number | null
          prompt?: string | null
          quiz_id?: string | null
        }
        Update: {
          bible_reference?: string | null
          created_at?: string | null
          id?: string | null
          options?: Json | null
          position?: number | null
          prompt?: string | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_admin_user_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_admin_access: {
        Args: { _email: string; _first_name: string; _last_name: string }
        Returns: Database["public"]["Enums"]["admin_request_status"]
      }
      submit_daily_challenge: {
        Args: { _challenge_id: string; _selected_index: number }
        Returns: boolean
      }
      submit_quiz: { Args: { _answers: Json; _quiz_id: string }; Returns: Json }
    }
    Enums: {
      admin_request_status: "pending" | "approved" | "rejected"
      app_role: "admin" | "enfant" | "super_admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_request_status: ["pending", "approved", "rejected"],
      app_role: ["admin", "enfant", "super_admin"],
    },
  },
} as const
