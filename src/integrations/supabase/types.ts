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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          responsible_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      corrective_actions: {
        Row: {
          assigned_to: string
          created_at: string | null
          due_date: string | null
          id: string
          inspection_id: string
          item_response_id: string | null
          notes: string
          resolution_notes: string | null
          status: Database["public"]["Enums"]["corrective_action_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          inspection_id: string
          item_response_id?: string | null
          notes: string
          resolution_notes?: string | null
          status?:
            | Database["public"]["Enums"]["corrective_action_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          inspection_id?: string
          item_response_id?: string | null
          notes?: string
          resolution_notes?: string | null
          status?:
            | Database["public"]["Enums"]["corrective_action_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corrective_actions_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corrective_actions_item_response_id_fkey"
            columns: ["item_response_id"]
            isOneToOne: false
            referencedRelation: "inspection_item_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_item_responses: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          inspection_id: string
          inspection_item_id: string
          photos: string[] | null
          state: Database["public"]["Enums"]["item_state"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          inspection_id: string
          inspection_item_id: string
          photos?: string[] | null
          state: Database["public"]["Enums"]["item_state"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          inspection_id?: string
          inspection_item_id?: string
          photos?: string[] | null
          state?: Database["public"]["Enums"]["item_state"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_item_responses_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_item_responses_inspection_item_id_fkey"
            columns: ["inspection_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_items: {
        Row: {
          attachment_schema: Json | null
          created_at: string | null
          description: string | null
          id: string
          inspection_id: string
          label: string
          order_index: number
          required: boolean | null
        }
        Insert: {
          attachment_schema?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_id: string
          label: string
          order_index: number
          required?: boolean | null
        }
        Update: {
          attachment_schema?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          inspection_id?: string
          label?: string
          order_index?: number
          required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          area_id: string
          assigned_to: string | null
          created_at: string | null
          created_by: string
          finished_at: string | null
          force_close_reason: string | null
          id: string
          notes: string | null
          percent_complete: number | null
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["inspection_status"] | null
          updated_at: string | null
        }
        Insert: {
          area_id: string
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          finished_at?: string | null
          force_close_reason?: string | null
          id?: string
          notes?: string | null
          percent_complete?: number | null
          scheduled_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"] | null
          updated_at?: string | null
        }
        Update: {
          area_id?: string
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          finished_at?: string | null
          force_close_reason?: string | null
          id?: string
          notes?: string | null
          percent_complete?: number | null
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["inspection_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          link: string | null
          meta: Json | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          link?: string | null
          meta?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          link?: string | null
          meta?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "operario" | "auditor" | "operator"
      corrective_action_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
      inspection_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "incomplete"
        | "forced_closed"
      item_state: "OK" | "NOK" | "NA" | "PENDING"
      notification_priority: "low" | "normal" | "high" | "urgent"
      notification_type:
        | "delivery_alert"
        | "inspection_assigned"
        | "inspection_overdue"
        | "inventory_low"
        | "corrective_action"
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
      app_role: ["admin", "supervisor", "operario", "auditor", "operator"],
      corrective_action_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
      ],
      inspection_status: [
        "pending",
        "in_progress",
        "completed",
        "incomplete",
        "forced_closed",
      ],
      item_state: ["OK", "NOK", "NA", "PENDING"],
      notification_priority: ["low", "normal", "high", "urgent"],
      notification_type: [
        "delivery_alert",
        "inspection_assigned",
        "inspection_overdue",
        "inventory_low",
        "corrective_action",
      ],
    },
  },
} as const
