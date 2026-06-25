"use client";

import { useEffect, useState } from 'react';
import { Bell, Loader2, AlertTriangle } from 'lucide-react';
import { useDemoDb } from '@/context/DemoDbContext';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    setDbError(null);
    if (!('Notification' in window)) return;
    
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const publicVapidKey = 'BOa-eL0GenxZGWFwYz92_Q44l-__KfnxhNaCVq4avdCnunPKW6Ud1hmY1HKfzYLk6BNQkf3dqFZ6O51bxQPJJJw';
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        const userData = {
          id: "chef_primary",
          name: "BOSS",
          active: true,
          role: "chef" as const,
          metadata: { pushSubscription: subscription }
        };

        const res = await fetch('/api/db', {
          method: 'POST',
          body: JSON.stringify({ table: 'users', data: userData })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`DB Fehler: ${errData.error}`);
        }
        
        alert("Benachrichtigungen sind aktiv! ✅");
        window.location.reload(); 
      }
    } catch (e: any) {
      setDbError(e.message);
      alert("Fehler: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Wenn alles erlaubt ist, zeigen wir gar nichts mehr an (aufgeräumt)
  if (permission === 'granted' && !dbError) return null;
  // Wenn abgelehnt wurde ohne Fehler, auch weg
  if (permission === 'denied' && !dbError) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-10">
      <div className="bg-[#12161F]/90 border border-orange-500/30 p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-[280px] backdrop-blur-md">
        
        {dbError && (
          <div className="bg-red-500/10 p-3 rounded-xl mb-4 flex items-center gap-2 border border-red-500/20">
             <AlertTriangle className="w-4 h-4 text-red-500" />
             <p className="text-[10px] text-red-500 font-bold leading-tight">{dbError}</p>
          </div>
        )}

        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
           <Bell className="w-7 h-7 text-orange-500" />
        </div>
        
        <h3 className="text-white font-bold mb-2">Push-Mitteilungen</h3>
        <p className="text-slate-500 text-xs mb-5 leading-relaxed">
          Möchtest du Alarme direkt auf dein Handy bekommen?
        </p>
        
        <button 
          onClick={requestPermission}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold active:scale-95 shadow-lg shadow-orange-500/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JETZT AKTIVIEREN"}
        </button>

        <button 
          onClick={() => setPermission('denied')}
          className="mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400"
        >
          Später
        </button>
      </div>
    </div>
  );
}
