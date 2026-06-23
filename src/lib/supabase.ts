import { createClient } from '@supabase/supabase-js'

// Wir nutzen die Keys direkt, damit Vercel-Einstellungsfehler uns nicht mehr aufhalten können.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JyLGJEa05SvhhwUN50EvDA_gayrvPnW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
