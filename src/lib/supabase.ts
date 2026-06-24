import { createClient } from '@supabase/supabase-js'

// Wir nutzen neue Namen, damit Vercel unsere Schlüssel nicht mehr mit alten Werten überschreiben kann.
const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTkxMDAsImV4cCI6MjA5Nzc5NTEwMH0.K0oI7oh6gmUQGwk6WzsuMQKxcAXqDsZd4GeRchbbuW0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
