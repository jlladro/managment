"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Send } from 'lucide-react';
import { useDemoDb } from '@/context/DemoDbContext';

export default function PushManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const demoDb = useDemoDb();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('SW registered', reg);
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Benachrichtigungen werden von diesem Browser leider nicht unterstützt.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BOa-eL0GenxZGWFwYz92_Q44l-__KfnxhNaCVq4avdCnunPKW6Ud1hmY1HKfzYLk6BNQkf3dqFZ6O51bxQPJJJw'
        });

        // Wir finden den Chef oder erstellen ihn
        // Wir suchen nach role: chef
        let chef = demoDb.db.users.find(u => u.role === 'chef');
        
        const userData = {
          name: "Chef",
          active: true,
          role: "chef" as const,
          metadata: { pushSubscription: sub }
        };

        if (chef) {
          await demoDb.updateUser(chef.id, userData);
        } else {
          await demoDb.addUser(userData);
        }
        
        alert("Benachrichtigungen sind jetzt aktiv! 🔔\nNutze den Test-Button, um es auszuprobieren.");
      }
    } catch (e: any) {
      console.error("Push Error", e);
      alert("Fehler bei der Aktivierung: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const testPush = async () => {
    setTesting(true);
    try {
      // Wir schicken einen Trigger an den Server
      // Da wir gerade nichts "echtes" speichern, schicken wir eine Test-Nachricht
      await demoDb.addMessage({
        title: "Test Benachrichtigung",
        body: "Glückwunsch! Die Push-Nachrichten funktionieren einwandfrei. 🎉",
        targetType: "employee",
        targetProjectIds: [],
        id: "test_" + Date.now() // Speziell für den Test-Trigger im Server
      });
      alert("Test-Signal gesendet! Warte einen Moment...");
    } catch (e: any) {
      alert("Test fehlgeschlagen: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (permission === 'denied') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-10">
      <div className="bg-[#12161F] border border-orange-500/30 p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-[280px] backdrop-blur-md">
        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
           {permission === 'granted' ? <Bell className="w-7 h-7 text-green-500" /> : <Bell className="w-7 h-7 text-orange-500" />}
        </div>
        
        {permission === 'granted' ? (
          <>
            <h3 className="text-white font-bold mb-2">Push ist aktiv! ✅</h3>
            <p className="text-slate-500 text-[10px] mb-5 leading-relaxed uppercase tracking-widest font-bold">
              Klicke unten für einen Test-Alarm
            </p>
            <button 
              onClick={testPush}
              disabled={testing}
              className="w-full bg-green-500/10 text-green-500 py-4 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 border border-green-500/20"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> TEST-ALARM</>}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-white font-bold mb-2">Push-Service 📡</h3>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Möchtest du sofort informiert werden, wenn etwas Neues passiert?
            </p>
            <button 
              onClick={requestPermission}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-orange-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JETZT AKTIVIEREN"}
            </button>
          </>
        )}
        
        <button 
          onClick={() => setPermission('denied')}
          className="mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400"
        >
          {permission === 'granted' ? "Schließen" : "Vielleicht später"}
        </button>
      </div>
    </div>
  );
}
