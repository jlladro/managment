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
    setName(localStorage.getItem(STORAGE_KEY));
    setLoaded(true);
  }, []);

  const setEmployeeName = useCallback((name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setName(name);
  }, []);

  const clearEmployee = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setName(null);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]" />
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
