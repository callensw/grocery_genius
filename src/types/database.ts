export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website?: string | null
          created_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          store_id: string | null
          item_name: string
          price: string | null
          price_numeric: number | null
          unit_price: string | null
          category: string | null
          valid_from: string | null
          valid_to: string | null
          source_flyer_id: string | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id?: string | null
          item_name: string
          price?: string | null
          price_numeric?: number | null
          unit_price?: string | null
          category?: string | null
          valid_from?: string | null
          valid_to?: string | null
          source_flyer_id?: string | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string | null
          item_name?: string
          price?: string | null
          price_numeric?: number | null
          unit_price?: string | null
          category?: string | null
          valid_from?: string | null
          valid_to?: string | null
          source_flyer_id?: string | null
          raw_data?: Json | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string | null
          zip_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          zip_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          zip_code?: string | null
          created_at?: string
        }
      }
      user_stores: {
        Row: {
          id: string
          user_id: string | null
          store_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          store_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          store_id?: string | null
          created_at?: string
        }
      }
      watch_list: {
        Row: {
          id: string
          user_id: string | null
          item_keyword: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          item_keyword: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          item_keyword?: string
          category?: string | null
          created_at?: string
        }
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
  }
}

// Convenience types
export type Store = Database['public']['Tables']['stores']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserStore = Database['public']['Tables']['user_stores']['Row']
export type WatchListItem = Database['public']['Tables']['watch_list']['Row']

// Extended types with joins
export type DealWithStore = Deal & {
  stores: Store | null
}
