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
      profiles: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      ssr_assets: {
        Row: {
          asset_code: string
          asset_type: string
          created_at: string
          designation: string
          id: string
          nsn: string
          short_name: string | null
          ssr_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          asset_code: string
          asset_type: string
          created_at?: string
          designation: string
          id?: string
          nsn: string
          short_name?: string | null
          ssr_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          asset_code?: string
          asset_type?: string
          created_at?: string
          designation?: string
          id?: string
          nsn?: string
          short_name?: string | null
          ssr_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ssr_assets_ssr_id_fkey"
            columns: ["ssr_id"]
            isOneToOne: false
            referencedRelation: "ssrs"
            referencedColumns: ["id"]
          },
        ]
      }
      ssrs: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_team: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role_type: string
          status: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_team: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          role_type: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_team?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role_type?: string
          status?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tds_entries: {
        Row: {
          admin_comment: string | null
          alest: string
          asset_code: string
          asset_type: string
          authorised_person_confirmed: boolean | null
          classification: string | null
          created_at: string | null
          crew_number: string | null
          data_responsibility_confirmed: boolean | null
          designation: string
          dual_carriage: string | null
          fuel_capacity: string | null
          height: string
          id: string
          laden_weight: string
          length: string
          licence: string | null
          lims_25: string
          lims_28: string
          max_speed: string | null
          mlc: string
          nsn: string
          out_of_service_date: string
          owner_nation: string
          passenger_capacity: string | null
          range: string | null
          reference: string
          review_responsibility_confirmed: boolean | null
          ric_code: string
          service: string
          short_name: string
          single_carriage: string | null
          ssr_approval_confirmed: boolean | null
          ssr_email: string
          ssr_name: string
          status: string
          submitted_by: string
          unladen_weight: string
          updated_at: string | null
          user_comment: string | null
          width: string
        }
        Insert: {
          admin_comment?: string | null
          alest: string
          asset_code: string
          asset_type: string
          authorised_person_confirmed?: boolean | null
          classification?: string | null
          created_at?: string | null
          crew_number?: string | null
          data_responsibility_confirmed?: boolean | null
          designation: string
          dual_carriage?: string | null
          fuel_capacity?: string | null
          height: string
          id?: string
          laden_weight: string
          length: string
          licence?: string | null
          lims_25: string
          lims_28: string
          max_speed?: string | null
          mlc: string
          nsn: string
          out_of_service_date: string
          owner_nation: string
          passenger_capacity?: string | null
          range?: string | null
          reference: string
          review_responsibility_confirmed?: boolean | null
          ric_code: string
          service: string
          short_name: string
          single_carriage?: string | null
          ssr_approval_confirmed?: boolean | null
          ssr_email: string
          ssr_name: string
          status?: string
          submitted_by: string
          unladen_weight: string
          updated_at?: string | null
          user_comment?: string | null
          width: string
        }
        Update: {
          admin_comment?: string | null
          alest?: string
          asset_code?: string
          asset_type?: string
          authorised_person_confirmed?: boolean | null
          classification?: string | null
          created_at?: string | null
          crew_number?: string | null
          data_responsibility_confirmed?: boolean | null
          designation?: string
          dual_carriage?: string | null
          fuel_capacity?: string | null
          height?: string
          id?: string
          laden_weight?: string
          length?: string
          licence?: string | null
          lims_25?: string
          lims_28?: string
          max_speed?: string | null
          mlc?: string
          nsn?: string
          out_of_service_date?: string
          owner_nation?: string
          passenger_capacity?: string | null
          range?: string | null
          reference?: string
          review_responsibility_confirmed?: boolean | null
          ric_code?: string
          service?: string
          short_name?: string
          single_carriage?: string | null
          ssr_approval_confirmed?: boolean | null
          ssr_email?: string
          ssr_name?: string
          status?: string
          submitted_by?: string
          unladen_weight?: string
          updated_at?: string | null
          user_comment?: string | null
          width?: string
        }
        Relationships: []
      }
      tds_entry_comments: {
        Row: {
          admin_id: string
          admin_name: string
          comment: string
          created_at: string
          entry_id: string
          id: string
          status: string
        }
        Insert: {
          admin_id: string
          admin_name: string
          comment: string
          created_at?: string
          entry_id: string
          id?: string
          status: string
        }
        Update: {
          admin_id?: string
          admin_name?: string
          comment?: string
          created_at?: string
          entry_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tds_entry_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "tds_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tds_entry_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "user_tds_entries_view"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_tds_entries_view: {
        Row: {
          admin_comment: string | null
          alest: string | null
          asset_code: string | null
          asset_type: string | null
          authorised_person_confirmed: boolean | null
          classification: string | null
          created_at: string | null
          crew_number: string | null
          data_responsibility_confirmed: boolean | null
          designation: string | null
          dual_carriage: string | null
          fuel_capacity: string | null
          height: string | null
          id: string | null
          laden_weight: string | null
          length: string | null
          licence: string | null
          lims_25: string | null
          lims_28: string | null
          max_speed: string | null
          mlc: string | null
          nsn: string | null
          out_of_service_date: string | null
          owner_nation: string | null
          passenger_capacity: string | null
          range: string | null
          reference: string | null
          review_responsibility_confirmed: boolean | null
          ric_code: string | null
          service: string | null
          short_name: string | null
          single_carriage: string | null
          ssr_approval_confirmed: boolean | null
          ssr_name: string | null
          status: string | null
          submitted_by: string | null
          unladen_weight: string | null
          updated_at: string | null
          width: string | null
        }
        Insert: {
          admin_comment?: string | null
          alest?: string | null
          asset_code?: string | null
          asset_type?: string | null
          authorised_person_confirmed?: boolean | null
          classification?: string | null
          created_at?: string | null
          crew_number?: string | null
          data_responsibility_confirmed?: boolean | null
          designation?: string | null
          dual_carriage?: string | null
          fuel_capacity?: string | null
          height?: string | null
          id?: string | null
          laden_weight?: string | null
          length?: string | null
          licence?: string | null
          lims_25?: string | null
          lims_28?: string | null
          max_speed?: string | null
          mlc?: string | null
          nsn?: string | null
          out_of_service_date?: string | null
          owner_nation?: string | null
          passenger_capacity?: string | null
          range?: string | null
          reference?: string | null
          review_responsibility_confirmed?: boolean | null
          ric_code?: string | null
          service?: string | null
          short_name?: string | null
          single_carriage?: string | null
          ssr_approval_confirmed?: boolean | null
          ssr_name?: string | null
          status?: string | null
          submitted_by?: string | null
          unladen_weight?: string | null
          updated_at?: string | null
          width?: string | null
        }
        Update: {
          admin_comment?: string | null
          alest?: string | null
          asset_code?: string | null
          asset_type?: string | null
          authorised_person_confirmed?: boolean | null
          classification?: string | null
          created_at?: string | null
          crew_number?: string | null
          data_responsibility_confirmed?: boolean | null
          designation?: string | null
          dual_carriage?: string | null
          fuel_capacity?: string | null
          height?: string | null
          id?: string | null
          laden_weight?: string | null
          length?: string | null
          licence?: string | null
          lims_25?: string | null
          lims_28?: string | null
          max_speed?: string | null
          mlc?: string | null
          nsn?: string | null
          out_of_service_date?: string | null
          owner_nation?: string | null
          passenger_capacity?: string | null
          range?: string | null
          reference?: string | null
          review_responsibility_confirmed?: boolean | null
          ric_code?: string | null
          service?: string | null
          short_name?: string | null
          single_carriage?: string | null
          ssr_approval_confirmed?: boolean | null
          ssr_name?: string | null
          status?: string | null
          submitted_by?: string | null
          unladen_weight?: string | null
          updated_at?: string | null
          width?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_tds_reference: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
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
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
