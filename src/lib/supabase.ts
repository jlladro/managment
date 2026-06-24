import { createClient } from '@supabase/supabase-js'

// Wir nutzen jetzt wieder den NEUEN Schlüssel-Typ, da dein Projekt offensichtlich darauf besteht.
const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = 'sb_publishable_JyLGJEa05SvhhwUN50EvDA_gayrvPnW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
})

if (typeof window !== 'undefined') {
  (window as any).supabaseDebugKey = "SB_NEW";
}
