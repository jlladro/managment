import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Der Generalschlüssel auf dem Server (Sicher vor fremden Blicken)
const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxOTEwMCwiZXhwIjoyMDk3Nzk1MTAwfQ.zK9bAwpewIz7ohB1Y9vQ5wMTGd0PgX39OxmdjmrFnrw'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const [{ data: projects }, { data: materials }, { data: workHours }, { data: users }] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('materials').select('*'),
      supabase.from('work_hours').select('*'),
      supabase.from('users').select('*')
    ]);
    return NextResponse.json({ projects, materials, workHours, users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { table, data } = await req.json();
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { table, id } = await req.json();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
