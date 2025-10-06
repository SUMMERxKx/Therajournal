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
      users: {
        Row: {
          user_id: string
          created_at: string
          tz: string
        }
        Insert: {
          user_id: string
          created_at?: string
          tz?: string
        }
        Update: {
          user_id?: string
          created_at?: string
          tz?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      entries: {
        Row: {
          id: string
          user_id: string
          created_at: string
          entry_at: string
          mood: number | null
          title_enc: string // bytea as string
          body_enc: string // bytea as string
          iv: string // bytea as string
          tags_enc: string | null // bytea as string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          entry_at?: string
          mood?: number | null
          title_enc: string // bytea as string
          body_enc: string // bytea as string
          iv: string // bytea as string
          tags_enc?: string | null // bytea as string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          entry_at?: string
          mood?: number | null
          title_enc?: string // bytea as string
          body_enc?: string // bytea as string
          iv?: string // bytea as string
          tags_enc?: string | null // bytea as string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          created_at: string
          title_enc: string | null // bytea as string
          iv: string // bytea as string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          title_enc?: string | null // bytea as string
          iv: string // bytea as string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          title_enc?: string | null // bytea as string
          iv?: string // bytea as string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          created_at: string
          role: string
          body_enc: string // bytea as string
          iv: string // bytea as string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          created_at?: string
          role: string
          body_enc: string // bytea as string
          iv: string // bytea as string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          created_at?: string
          role?: string
          body_enc?: string // bytea as string
          iv?: string // bytea as string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          }
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
