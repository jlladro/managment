"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployee } from "@/context/EmployeeContext";

export default function MitarbeiterPage() {
  const { employeeName } = useEmployee();
  const router = useRouter();

  useEffect(() => {
    router.replace(employeeName ? "/mitarbeiter/home" : "/mitarbeiter/setup");
  }, [employeeName, router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]" />
    </div>
  );
}
