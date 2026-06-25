import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxOTEwMCwiZXhwIjoyMDk3Nzk1MTAwfQ.zK9bAwpewIz7ohB1Y9vQ5wMTGd0PgX39OxmdjmrFnrw'

const supabase = createClient(supabaseUrl, supabaseKey)

webpush.setVapidDetails(
  'mailto:jlladrovcijon@gmail.com',
  'BOa-eL0GenxZGWFwYz92_Q44l-__KfnxhNaCVq4avdCnunPKW6Ud1hmY1HKfzYLk6BNQkf3dqFZ6O51bxQPJJJw',
  '6b2e8orIgCizFEw272OziFG3mMEBbjBQ9vv6-jeHGbU'
)

async function triggerPush(title: string, body: string, url: string = '/dashboard'): Promise<{ count: number; report: string }> {
  let count = 0;
  let names = [];
  try {
    const { data: users, error: fetchError } = await supabase.from('users').select('*');
    if (fetchError) return { count: 0, report: "DB-FEHLER: " + fetchError.message };

    if (users) {
      for (const user of users) {
        const hasSub = !!(user.metadata?.pushSubscription || user.Metadata?.pushSubscription);
        names.push(`${user.name} (${hasSub ? 'OK' : 'KEIN PUSH'})`);
        if (hasSub) {
          try {
            const sub = user.metadata?.pushSubscription || user.Metadata?.pushSubscription;
            await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));
            count++;
          } catch (err: any) {
            console.error("Push failed", user.name, err.message);
          }
        }
      }
    }
  } catch (e: any) { names.push("CRASH: " + e.message); }
  return { count, report: names.join(", ") || "Leer" };
}

export async function GET() {
  try {
    const [{ data: projects }, { data: materials }, { data: workHours }, { data: users }, { data: messages }] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('materials').select('*'),
      supabase.from('work_hours').select('*'),
      supabase.from('users').select('*'),
      supabase.from('messages').select('*')
    ]);
    return NextResponse.json({ projects, materials, workHours, users, messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { table, data } = await req.json();
    
    // Wir loggen was reinkommt (nur für uns im Fehlerfall)
    console.log(`API POST [${table}]:`, data);

    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    
    if (error) {
       console.error("Supabase UPSERT Error:", error);
       return NextResponse.json({ error: `DB Fehler: ${error.message} (Code: ${error.code})` }, { status: 500 });
    }

    let debug = "";
    let pushCount = 0;
    
    // Wir prüfen bei JEDEM POST kurz nach Push-Empfängern im Test-Modus
    if (table === 'messages' && (!data.id.includes('msg_') || data.id.includes('test_'))) {
       const res = await triggerPush(data.title || "Test", data.body || "", "/dashboard/invoices");
       pushCount = res.count;
       debug = res.report;
    } else if (table === 'work_hours') {
       const res = await triggerPush("Bericht", `${data.employeeName}`, "/dashboard/reports");
       pushCount = res.count;
       debug = res.report;
    } else if (table === 'materials' && data.quantity <= (data.minimum || 0) && (data.minimum || 0) > 0) {
       // SPAM SCHUTZ: Wir holen das Material um zu sehen wann wir zuletzt gewarnt haben
       const { data: existingMaterial } = await supabase.from('materials').select('last_warned_at').eq('id', data.id).single();
       
       const lastWarned = existingMaterial?.last_warned_at ? new Date(existingMaterial.last_warned_at).getTime() : 0;
       const now = Date.now();
       
       // Nur warnen wenn die letzte Warnung länger als 60 Sekunden her ist
       if (now - lastWarned > 60000) {
         const diff = (data.minimum || 0) - data.quantity;
         const missingText = diff === 0 ? "Mindestmenge erreicht" : `${diff} ${data.unit || ''} zu wenig`;
         
         // 5 Sekunden warten damit der Mitarbeiter fertig tippen kann
         await new Promise(resolve => setTimeout(resolve, 5000));
         
         const res = await triggerPush(
           "Material-Warnung! ⚠️", 
           `${data.name}: ${missingText}! (Aktuell: ${data.quantity})`, 
           "/dashboard/projects"
         );
         
         // Zeitstempel aktualisieren
         await supabase.from('materials').update({ last_warned_at: new Date().toISOString() }).eq('id', data.id);
         
         pushCount = res.count;
         debug = res.report;
       }
    }

    return NextResponse.json({ success: true, pushCount, debug });
  } catch (e: any) {
    return NextResponse.json({ error: "Server-Crash: " + e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { table, id } = await req.json();
    if (!id) throw new Error("ID wird benötigt");
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
