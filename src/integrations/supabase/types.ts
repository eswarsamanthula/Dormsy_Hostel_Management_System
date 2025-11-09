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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          college_id: string
          created_at: string
          department: string | null
          employee_id: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          department?: string | null
          employee_id: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          department?: string | null
          employee_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_type: string | null
          college_id: string
          created_at: string | null
          date: string
          hostel_id: string
          id: string
          marked_by: string | null
          meal_type: string | null
          mess_attendance: boolean | null
          notes: string | null
          room_attendance: boolean | null
          self_marked: boolean | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_type?: string | null
          college_id: string
          created_at?: string | null
          date: string
          hostel_id: string
          id?: string
          marked_by?: string | null
          meal_type?: string | null
          mess_attendance?: boolean | null
          notes?: string | null
          room_attendance?: boolean | null
          self_marked?: boolean | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_type?: string | null
          college_id?: string
          created_at?: string | null
          date?: string
          hostel_id?: string
          id?: string
          marked_by?: string | null
          meal_type?: string | null
          mess_attendance?: boolean | null
          notes?: string | null
          room_attendance?: boolean | null
          self_marked?: boolean | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          college_id: string | null
          created_at: string
          hostel_id: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          college_id?: string | null
          created_at?: string
          hostel_id?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          college_id?: string | null
          created_at?: string
          hostel_id?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          category: string
          college_id: string
          created_at: string | null
          description: string
          hostel_id: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          student_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          college_id: string
          created_at?: string | null
          description: string
          hostel_id: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          college_id?: string
          created_at?: string | null
          description?: string
          hostel_id?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_records: {
        Row: {
          amount: number
          college_id: string
          created_at: string | null
          due_date: string
          fee_type: string
          hostel_id: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          college_id: string
          created_at?: string | null
          due_date: string
          fee_type: string
          hostel_id: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          college_id?: string
          created_at?: string | null
          due_date?: string
          fee_type?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_records_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_records_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          amount: number
          college_id: string
          created_at: string
          created_by: string
          due_date: string
          fine_reason: string
          hostel_id: string
          id: string
          notes: string | null
          payment_date: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          college_id: string
          created_at?: string
          created_by: string
          due_date: string
          fine_reason: string
          hostel_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          college_id?: string
          created_at?: string
          created_by?: string
          due_date?: string
          fine_reason?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hostel_rules: {
        Row: {
          category: string
          college_id: string
          created_at: string | null
          description: string
          hostel_id: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          college_id: string
          created_at?: string | null
          description: string
          hostel_id: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          college_id?: string
          created_at?: string | null
          description?: string
          hostel_id?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rules_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_rules_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          college_id: string
          created_at: string
          current_occupancy: number
          floors: number
          id: string
          is_active: boolean
          name: string
          rooms_per_floor: number
          total_capacity: number
          type: string
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          current_occupancy?: number
          floors?: number
          id?: string
          is_active?: boolean
          name: string
          rooms_per_floor?: number
          total_capacity?: number
          type: string
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          current_occupancy?: number
          floors?: number
          id?: string
          is_active?: boolean
          name?: string
          rooms_per_floor?: number
          total_capacity?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostels_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          college_id: string
          created_at: string | null
          end_date: string
          hostel_id: string
          id: string
          leave_type: string
          reason: string
          rejected_at: string | null
          start_date: string
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          college_id: string
          created_at?: string | null
          end_date: string
          hostel_id: string
          id?: string
          leave_type?: string
          reason: string
          rejected_at?: string | null
          start_date: string
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          college_id?: string
          created_at?: string | null
          end_date?: string
          hostel_id?: string
          id?: string
          leave_type?: string
          reason?: string
          rejected_at?: string | null
          start_date?: string
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      mess_menu: {
        Row: {
          college_id: string
          created_at: string | null
          date: string | null
          day_of_week: number | null
          description: string | null
          hostel_id: string
          id: string
          is_template: boolean
          is_vegetarian: boolean | null
          meal_type: string
          name: string
        }
        Insert: {
          college_id: string
          created_at?: string | null
          date?: string | null
          day_of_week?: number | null
          description?: string | null
          hostel_id: string
          id?: string
          is_template?: boolean
          is_vegetarian?: boolean | null
          meal_type: string
          name: string
        }
        Update: {
          college_id?: string
          created_at?: string | null
          date?: string | null
          day_of_week?: number | null
          description?: string | null
          hostel_id?: string
          id?: string
          is_template?: boolean
          is_vegetarian?: boolean | null
          meal_type?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mess_menu_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mess_menu_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          college_id: string | null
          created_at: string
          expires_at: string | null
          hostel_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category: string
          college_id?: string | null
          created_at?: string
          expires_at?: string | null
          hostel_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          college_id?: string | null
          created_at?: string
          expires_at?: string | null
          hostel_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fee_record_id: string | null
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fee_record_id?: string | null
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fee_record_id?: string | null
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_record_id_fkey"
            columns: ["fee_record_id"]
            isOneToOne: false
            referencedRelation: "fee_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          code_data: string
          code_type: string
          college_id: string
          created_at: string
          expires_at: string | null
          hostel_id: string | null
          id: string
          is_active: boolean
          max_usage: number | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          code_data: string
          code_type: string
          college_id: string
          created_at?: string
          expires_at?: string | null
          hostel_id?: string | null
          id?: string
          is_active?: boolean
          max_usage?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          code_data?: string
          code_type?: string
          college_id?: string
          created_at?: string
          expires_at?: string | null
          hostel_id?: string | null
          id?: string
          is_active?: boolean
          max_usage?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          current_occupancy: number
          floor_number: number
          hostel_id: string
          id: string
          is_active: boolean
          room_number: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          floor_number: number
          hostel_id: string
          id?: string
          is_active?: boolean
          room_number: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_occupancy?: number
          floor_number?: number
          hostel_id?: string
          id?: string
          is_active?: boolean
          room_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          college_id: string
          course: string | null
          created_at: string
          emergency_contact: string | null
          guardian_name: string | null
          guardian_phone: string | null
          hostel_id: string | null
          id: string
          profile_id: string
          room_id: string | null
          student_id: string
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          college_id: string
          course?: string | null
          created_at?: string
          emergency_contact?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          hostel_id?: string | null
          id?: string
          profile_id: string
          room_id?: string | null
          student_id: string
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          college_id?: string
          course?: string | null
          created_at?: string
          emergency_contact?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          hostel_id?: string | null
          id?: string
          profile_id?: string
          room_id?: string | null
          student_id?: string
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          college_id: string
          created_at: string
          hostel_id: string
          id: string
          qr_code: string | null
          relationship: string
          status: string
          student_id: string
          updated_at: string
          visit_date: string
          visit_purpose: string | null
          visit_time_from: string
          visit_time_to: string
          visitor_id_proof: string
          visitor_name: string
          visitor_phone: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          college_id: string
          created_at?: string
          hostel_id: string
          id?: string
          qr_code?: string | null
          relationship: string
          status?: string
          student_id: string
          updated_at?: string
          visit_date: string
          visit_purpose?: string | null
          visit_time_from: string
          visit_time_to: string
          visitor_id_proof: string
          visitor_name: string
          visitor_phone: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          college_id?: string
          created_at?: string
          hostel_id?: string
          id?: string
          qr_code?: string | null
          relationship?: string
          status?: string
          student_id?: string
          updated_at?: string
          visit_date?: string
          visit_purpose?: string | null
          visit_time_from?: string
          visit_time_to?: string
          visitor_id_proof?: string
          visitor_name?: string
          visitor_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visitors_student_id"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      wardens: {
        Row: {
          college_id: string
          created_at: string
          department: string | null
          employee_id: string
          hostel_id: string | null
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          department?: string | null
          employee_id: string
          hostel_id?: string | null
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          department?: string | null
          employee_id?: string
          hostel_id?: string | null
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wardens_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardens_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_find_profile_by_email: {
        Args: { p_email: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "admin" | "warden" | "student"
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
      user_role: ["admin", "warden", "student"],
    },
  },
} as const
