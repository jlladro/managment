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

    if (!file) return NextResponse.json({ error: "Keine Datei erhalten" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const fileBase64 = Buffer.from(arrayBuffer);
    
    // Wir versuchen den Upload mit dem Bucket 'invoices'
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(path, fileBase64, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      return NextResponse.json({ 
        error: `Supabase Fehler: ${error.message}`, 
        details: error 
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    console.error("General Upload Error:", e);
    return NextResponse.json({ error: `Server Fehler: ${e.message}` }, { status: 500 });
  }
}
