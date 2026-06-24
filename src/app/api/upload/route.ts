import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxOTEwMCwiZXhwIjoyMDk3Nzk1MTAwfQ.zK9bAwpewIz7ohB1Y9vQ5wMTGd0PgX39OxmdjmrFnrw'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: "Datei oder Pfad fehlt" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    console.error("Upload Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
