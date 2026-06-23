import { createClient } from '@supabase/supabase-js'

// DER RICHTIGE SCHLÜSSEL - Endlich geschafft!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTkxMDAsImV4cCI6MjA5Nzc5NTEwMH0.K0oI7oh6gmUQGwk6WzsuMQKxcAXqDsZd4GeRchbbuW0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
