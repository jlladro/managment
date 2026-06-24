import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const supabaseUrl = 'https://dqgaejjdiggdwmcsmyju.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZ2FlampkaWdnZHdtY3NteWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxOTEwMCwiZXhwIjoyMDk3Nzk1MTAwfQ.zK9bAwpewIz7ohB1Y9vQ5wMTGd0PgX39OxmdjmrFnrw'

const supabase = createClient(supabaseUrl, supabaseKey)

// VAPID Keys für Push
webpush.setVapidDetails(
  'mailto:jlladrovcijon@gmail.com',
  'BOa-eL0GenxZGWFwYz92_Q44l-__KfnxhNaCVq4avdCnunPKW6Ud1hmY1HKfzYLk6BNQkf3dqFZ6O51bxQPJJJw',
  '6b2e8orIgCizFEw272OziFG3mMEBbjBQ9vv6-jeHGbU'
)

async function triggerPush(title: string, body: string, url: string = '/dashboard') {
  console.log(`Push Triggered: ${title} - ${body}`);
  try {
    const { data: chefs, error } = await supabase.from('users').select('*').eq('role', 'chef');
    if (error) console.error("Error fetching chefs for push:", error);
    
    console.log(`Found ${chefs?.length || 0} chefs for push.`);
    
    if (chefs) {
      for (const chef of chefs) {
        if (chef.metadata?.pushSubscription) {
          console.log(`Sending push to ${chef.name}...`);
          try {
            await webpush.sendNotification(
              chef.metadata.pushSubscription,
              JSON.stringify({ title, body, url })
            );
            console.log(`Push sent successfully to ${chef.name}`);
          } catch (err: any) {
            console.error("Push failed for user", chef.name, err.statusCode, err.message);
          }
        } else {
          console.log(`Chef ${chef.name} has no push subscription.`);
        }
      }
    }
  } catch (e) {
    console.error("General Push Error", e);
  }
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
    const { error } = await supabase.from(table).upsert(data);
    
    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    // PUSH LOGIC
    if (table === 'messages' && (!data.id.includes('msg_') || data.id.includes('test_'))) { // Neue Rechnungen oder Test
       await triggerPush(data.title || "Neue Nachricht", data.body || "", "/dashboard/invoices");
    } else if (table === 'work_hours') {
       await triggerPush("Neuer Tagesbericht", `${data.employeeName} hat gebucht`, "/dashboard/reports");
    } else if (table === 'materials' && data.quantity <= (data.minimum || 0) && (data.minimum || 0) > 0) {
       await triggerPush("Material Warnung ⚠️", `${data.name} ist fast leer: nur noch ${data.quantity} ${data.unit} übrig!`, "/dashboard/projects");
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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
