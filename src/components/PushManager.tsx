"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useDemoDb } from '@/context/DemoDbContext';

export default function PushManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const demoDb = useDemoDb();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Register SW
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

        // Finde oder erstelle den Chef-User in der DB
        let chef = demoDb.db.users.find(u => u.role === 'chef');
        
        if (chef) {
          await demoDb.updateUser(chef.id, { metadata: { pushSubscription: sub } });
        } else {
          await demoDb.addUser({
            name: "Chef",
            active: true,
            role: "chef",
            metadata: { pushSubscription: sub }
          });
        }
        
        alert("Benachrichtigungen sind jetzt aktiv! 🔔\nDu erhältst jetzt Push-Nachrichten für Berichte und Rechnungen.");
      }
    } catch (e: any) {
      console.error("Push Error", e);
      alert("Fehler: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (permission === 'granted') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-10">
      <div className="bg-[#12161F] border border-orange-500/30 p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-[280px] backdrop-blur-md">
        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
           <Bell className="w-7 h-7 text-orange-500" />
        </div>
        <h3 className="text-white font-bold mb-2">Push-Benachrichtigungen</h3>
        <p className="text-slate-500 text-xs mb-5 leading-relaxed">
          Möchtest du sofort auf deinem Handy informiert werden, wenn etwas Neues passiert?
        </p>
        <button 
          onClick={requestPermission}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JETZT AKTIVIEREN"}
        </button>
        <button 
          onClick={() => setPermission('denied')}
          className="mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400"
        >
          Nicht jetzt
        </button>
      </div>
    </div>
  );
}
