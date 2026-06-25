"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Send, AlertTriangle } from 'lucide-react';
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
  const [testing, setTesting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const demoDb = useDemoDb();

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

        // HÄRTERER SPEICHER-VERSUCH
        const userData = {
          id: "chef_primary", // Wir nutzen eine feste ID für dich
          name: "BOSS",
          active: true,
          role: "chef" as const,
          metadata: { pushSubscription: subscription }
        };

        // Wir nutzen POST direkt um Fehler zu sehen
        const res = await fetch('/api/db', {
          method: 'POST',
          body: JSON.stringify({ table: 'users', data: userData })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`Konnte dich nicht in DB speichern: ${errData.error}`);
        }
        
        alert("GEIL! Du bist jetzt registriert. ✅\nDein Handy wurde als BOSS gespeichert.");
        // Wir refreshen die lokale DB
        window.location.reload(); 
      }
    } catch (e: any) {
      console.error("Push Error", e);
      setDbError(e.message);
      alert("FEHLER: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const testPush = async () => {
    setTesting(true);
    try {
      const data = await demoDb.addMessage({
        title: "Test-Signal 🔔",
        body: "Die Verbindung zum Chef-Handy steht! 🎉",
        targetType: "employee",
        targetProjectIds: [],
        id: "test_" + Date.now()
      });
      alert(`Test gesendet!\nEmpfänger online: ${data.pushCount}\nListe: ${data.debug}`);
    } catch (e: any) {
      alert("Test fehlgeschlagen: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (permission === 'denied' && !dbError) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-10">
      <div className="bg-[#12161F] border border-orange-500/30 p-6 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-[280px] backdrop-blur-md">
        
        {dbError && (
          <div className="bg-red-500/10 p-3 rounded-xl mb-4 flex items-center gap-2 border border-red-500/20">
             <AlertTriangle className="w-4 h-4 text-red-500" />
             <p className="text-[10px] text-red-500 font-bold leading-tight">{dbError}</p>
          </div>
        )}

        <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
           {permission === 'granted' ? <Bell className="w-7 h-7 text-green-500" /> : <Bell className="w-7 h-7 text-orange-500" />}
        </div>
        
        {permission === 'granted' ? (
          <>
            <h3 className="text-white font-bold mb-2">Push Aktiv ✅</h3>
            <button 
              onClick={testPush}
              disabled={testing}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> TEST-ALARM</>}
            </button>
            <button onClick={requestPermission} className="mt-3 text-[9px] text-slate-600 underline">Neu Registrieren</button>
          </>
        ) : (
          <>
            <h3 className="text-white font-bold mb-2">Push-Service</h3>
            <button 
              onClick={requestPermission}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold active:scale-95 shadow-lg shadow-orange-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JETZT AKTIVIEREN"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
