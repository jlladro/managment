import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTkxMDAsImV4cCI6MjA5Nzc5NTEwMH0.K0oI7oh6gmUQGwk6WzsuMQKxcAXqDsZd4GeRchbbuW0'

// Debug-Check für den User
if (typeof window !== 'undefined') {
  console.log("Aktiver Supabase Key Check:", supabaseAnonKey.substring(0, 8));
  // Wir zeigen es kurz als Alert, damit wir 100% sicher sind
  (window as any).supabaseDebugKey = supabaseAnonKey.substring(0, 5);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
