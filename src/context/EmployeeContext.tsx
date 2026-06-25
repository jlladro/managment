"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface EmployeeContextType {
  employeeName: string | null;
  setEmployeeName: (name: string) => void;
  clearEmployee: () => void;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);
const STORAGE_KEY = "baustellen_employee_name";

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employeeName, setName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setName(stored);
      }
    } catch (e) {
      console.error("Local storage access failed");
    } finally {
      setLoaded(true);
    }
  }, []);

  const setEmployeeName = useCallback((name: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, name);
      setName(name);
    } catch (e) {
      console.error("Failed to save employee name");
    }
  }, []);

  const clearEmployee = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setName(null);
    } catch (e) {
      console.error("Failed to clear employee name");
    }
  }, []);

  // Während wir laden, zeigen wir den Spinner im neuen Premium-Look
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <EmployeeContext.Provider
      value={{ employeeName, setEmployeeName, clearEmployee }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error("useEmployee must be used within EmployeeProvider");
  return ctx;
}
