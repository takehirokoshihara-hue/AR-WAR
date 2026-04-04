import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Team = {
  id: string
  name: string
  ar_balance: number
  created_at: string
}

export type GameState = {
  id: number
  phase: string
  metadata: Record<string, any>
}

export type Bet = {
  id: string
  team_id: string
  game: string
  target: string
  amount: number
  created_at: string
}
