import { createClient } from '@supabase/supabase-js'

// Finaler Schlüssel-Fix mit dem Legacy-Generalschlüssel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxOTEwMCwiZXhwIjoyMDk3Nzk1MTAwfQ.zK9bAwpewIz7ohB1Y9vQ5wMTGd0PgX39OxmdjmrFnrw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
