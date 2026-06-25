"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Send } from 'lucide-react';
import { useDemoDb } from '@/context/DemoDbContext';

// Hilfsfunktion zur Umwandlung des VAPID Keys
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
  const demoDb = useDemoDb();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert("Push-Benachrichtigungen werden von diesem Browser/Handy leider nicht unterstützt.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        if (!('serviceWorker' in navigator)) throw new Error("Service Worker nicht unterstützt");
        
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const publicVapidKey = 'BOa-eL0GenxZGWFwYz92_Q44l-__KfnxhNaCVq4avdCnunPKW6Ud1hmY1HKfzYLk6BNQkf3dqFZ6O51bxQPJJJw';
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Speichern in der DB
        // Wir erstellen/updaten einen User "Chef"
        await demoDb.addUser({
           name: "Chef_" + Math.floor(Math.random()*1000), // Eindeutiger Name für den Test
           active: true,
           role: "chef",
           metadata: { pushSubscription: subscription }
        });
        
        alert("Perfekt! Dein Handy ist jetzt registriert. ✅\nProbiere jetzt den TEST-ALARM Button.");
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
      await demoDb.addMessage({
        title: "Test-Signal 🔔",
        body: "Wenn du das siehst, funktioniert alles perfekt! 🎉",
        targetType: "employee",
        targetProjectIds: [],
        id: "test_" + Date.now()
      });
      alert("Test-Signal an Server gesendet...");
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
           {permission === 'granted' ? <Bell className="w-7 h-7 text-green-500 animate-bounce" /> : <Bell className="w-7 h-7 text-orange-500" />}
        </div>
        
        {permission === 'granted' ? (
          <>
            <h3 className="text-white font-bold mb-2">Verbindung steht! ✅</h3>
            <p className="text-slate-500 text-[10px] mb-5 leading-relaxed uppercase tracking-widest font-bold">
              Klicke für den finalen Test
            </p>
            <button 
              onClick={testPush}
              disabled={testing}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> TEST-ALARM</>}
            </button>
          </>
        ) : (
          <>
            <h3 className="text-white font-bold mb-2">Push-Zentrale 📡</h3>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Willst du Baustellen-Alarme direkt auf dein Handy bekommen?
            </p>
            <button 
              onClick={requestPermission}
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-orange-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "JETZT FREISCHALTEN"}
            </button>
          </>
        )}
        
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
