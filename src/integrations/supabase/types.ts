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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          direction: string
          id: string
          instrument_id: string
          is_active: boolean
          last_triggered_at: string | null
          metric: string
          threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          instrument_id: string
          is_active?: boolean
          last_triggered_at?: string | null
          metric?: string
          threshold: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          instrument_id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          metric?: string
          threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_curves: {
        Row: {
          as_of: string
          created_at: string
          curve: string
          id: string
          rate: number
          source: string
          tenor_years: number
        }
        Insert: {
          as_of: string
          created_at?: string
          curve: string
          id?: string
          rate: number
          source: string
          tenor_years: number
        }
        Update: {
          as_of?: string
          created_at?: string
          curve?: string
          id?: string
          rate?: number
          source?: string
          tenor_years?: number
        }
        Relationships: []
      }
      content_translations: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          locale: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          locale: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          locale?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crawler_hits: {
        Row: {
          bot: string
          hit_at: string
          id: string
          path: string
          user_agent: string | null
        }
        Insert: {
          bot: string
          hit_at?: string
          id?: string
          path: string
          user_agent?: string | null
        }
        Update: {
          bot?: string
          hit_at?: string
          id?: string
          path?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      data_feed_runs: {
        Row: {
          id: string
          message: string | null
          ran_at: string
          records: number
          source: string
          status: string
        }
        Insert: {
          id?: string
          message?: string | null
          ran_at?: string
          records?: number
          source: string
          status: string
        }
        Update: {
          id?: string
          message?: string | null
          ran_at?: string
          records?: number
          source?: string
          status?: string
        }
        Relationships: []
      }
      deal_candidates: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          headline: string
          id: string
          instrument_id: string | null
          issuer_guess: string | null
          notes: string | null
          published_at: string | null
          publisher: string | null
          size_amount: number | null
          stage: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          headline: string
          id?: string
          instrument_id?: string | null
          issuer_guess?: string | null
          notes?: string | null
          published_at?: string | null
          publisher?: string | null
          size_amount?: number | null
          stage?: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          headline?: string
          id?: string
          instrument_id?: string | null
          issuer_guess?: string | null
          notes?: string | null
          published_at?: string | null
          publisher?: string | null
          size_amount?: number | null
          stage?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_candidates_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          instrument_id: string | null
          message: string
          partner_id: string | null
          routed_at: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          instrument_id?: string | null
          message: string
          partner_id?: string | null
          routed_at?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          instrument_id?: string | null
          message?: string
          partner_id?: string | null
          routed_at?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          as_of: string
          currency: string
          rate_to_usd: number
          source: string
          updated_at: string
        }
        Insert: {
          as_of: string
          currency: string
          rate_to_usd: number
          source: string
          updated_at?: string
        }
        Update: {
          as_of?: string
          currency?: string
          rate_to_usd?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          nominal: number
          notes: string | null
          purchase_date: string
          purchase_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          nominal: number
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          nominal?: number
          notes?: string | null
          purchase_date?: string
          purchase_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          aaoifi_compliant: boolean
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          description_ms: string | null
          featured: boolean
          governing_law: string | null
          id: string
          indicative_price: number | null
          instrument_type: Database["public"]["Enums"]["instrument_kind"]
          is_esg: boolean
          is_tokenized: boolean
          isin: string | null
          issue_date: string | null
          issuer_id: string
          listing_venue: string | null
          maturity_date: string | null
          min_investment: number | null
          name: string
          name_ar: string | null
          name_ms: string | null
          payment_frequency: string | null
          price_as_of: string | null
          price_source: string
          profit_rate: number | null
          rate_type: string | null
          rating_fitch: string | null
          rating_moodys: string | null
          rating_sp: string | null
          shariah_advisor: string | null
          size_amount: number | null
          slug: string
          spread_bps: number | null
          status: Database["public"]["Enums"]["instrument_status"]
          structure: string | null
          token_standard: string | null
          underlying_asset: string | null
          use_of_proceeds: string | null
          yield_to_maturity: number | null
        }
        Insert: {
          aaoifi_compliant?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          description_ms?: string | null
          featured?: boolean
          governing_law?: string | null
          id?: string
          indicative_price?: number | null
          instrument_type?: Database["public"]["Enums"]["instrument_kind"]
          is_esg?: boolean
          is_tokenized?: boolean
          isin?: string | null
          issue_date?: string | null
          issuer_id: string
          listing_venue?: string | null
          maturity_date?: string | null
          min_investment?: number | null
          name: string
          name_ar?: string | null
          name_ms?: string | null
          payment_frequency?: string | null
          price_as_of?: string | null
          price_source?: string
          profit_rate?: number | null
          rate_type?: string | null
          rating_fitch?: string | null
          rating_moodys?: string | null
          rating_sp?: string | null
          shariah_advisor?: string | null
          size_amount?: number | null
          slug: string
          spread_bps?: number | null
          status?: Database["public"]["Enums"]["instrument_status"]
          structure?: string | null
          token_standard?: string | null
          underlying_asset?: string | null
          use_of_proceeds?: string | null
          yield_to_maturity?: number | null
        }
        Update: {
          aaoifi_compliant?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          description_ms?: string | null
          featured?: boolean
          governing_law?: string | null
          id?: string
          indicative_price?: number | null
          instrument_type?: Database["public"]["Enums"]["instrument_kind"]
          is_esg?: boolean
          is_tokenized?: boolean
          isin?: string | null
          issue_date?: string | null
          issuer_id?: string
          listing_venue?: string | null
          maturity_date?: string | null
          min_investment?: number | null
          name?: string
          name_ar?: string | null
          name_ms?: string | null
          payment_frequency?: string | null
          price_as_of?: string | null
          price_source?: string
          profit_rate?: number | null
          rate_type?: string | null
          rating_fitch?: string | null
          rating_moodys?: string | null
          rating_sp?: string | null
          shariah_advisor?: string | null
          size_amount?: number | null
          slug?: string
          spread_bps?: number | null
          status?: Database["public"]["Enums"]["instrument_status"]
          structure?: string | null
          token_standard?: string | null
          underlying_asset?: string | null
          use_of_proceeds?: string | null
          yield_to_maturity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instruments_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["id"]
          },
        ]
      }
      issuers: {
        Row: {
          country: string
          country_code: string
          created_at: string
          description: string | null
          id: string
          issuer_type: Database["public"]["Enums"]["issuer_kind"]
          name: string
          name_ar: string | null
          name_ms: string | null
          sector: string | null
          slug: string
          website: string | null
        }
        Insert: {
          country: string
          country_code: string
          created_at?: string
          description?: string | null
          id?: string
          issuer_type?: Database["public"]["Enums"]["issuer_kind"]
          name: string
          name_ar?: string | null
          name_ms?: string | null
          sector?: string | null
          slug: string
          website?: string | null
        }
        Update: {
          country?: string
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          issuer_type?: Database["public"]["Enums"]["issuer_kind"]
          name?: string
          name_ar?: string | null
          name_ms?: string | null
          sector?: string | null
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          contact_email: string | null
          country: string
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          regulator: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          country: string
          country_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          regulator?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          country?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          regulator?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          as_of: string
          created_at: string
          id: string
          instrument_id: string
          price: number | null
          source: string
          spread_bps: number | null
          yield_to_maturity: number | null
        }
        Insert: {
          as_of?: string
          created_at?: string
          id?: string
          instrument_id: string
          price?: number | null
          source?: string
          spread_bps?: number | null
          yield_to_maturity?: number | null
        }
        Update: {
          as_of?: string
          created_at?: string
          id?: string
          instrument_id?: string
          price?: number | null
          source?: string
          spread_bps?: number | null
          yield_to_maturity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          investor_type: string | null
          preferred_language: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          investor_type?: string | null
          preferred_language?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          investor_type?: string | null
          preferred_language?: string
        }
        Relationships: []
      }
      saved_screens: {
        Row: {
          created_at: string
          id: string
          name: string
          search: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          search: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          search?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          instrument_id: string
          notes: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          instrument_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          instrument_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      instrument_kind: "sukuk" | "bond"
      instrument_status: "open" | "listed" | "matured" | "upcoming"
      issuer_kind:
        | "sovereign"
        | "quasi_sovereign"
        | "corporate"
        | "financial_institution"
        | "supranational"
      request_status:
        | "submitted"
        | "under_review"
        | "allocated"
        | "rejected"
        | "withdrawn"
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
      app_role: ["admin", "user"],
      instrument_kind: ["sukuk", "bond"],
      instrument_status: ["open", "listed", "matured", "upcoming"],
      issuer_kind: [
        "sovereign",
        "quasi_sovereign",
        "corporate",
        "financial_institution",
        "supranational",
      ],
      request_status: [
        "submitted",
        "under_review",
        "allocated",
        "rejected",
        "withdrawn",
      ],
    },
  },
} as const
