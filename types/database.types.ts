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
      bookmarks: {
        Row: {
          id: string
          title: string
          url: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}

export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
