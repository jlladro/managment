"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

export function useCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  transform: (id: string, data: Record<string, unknown>) => T
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) =>
          transform(doc.id, doc.data() as Record<string, unknown>)
        );
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { data, loading, error };
}

export function timestampToDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return undefined;
}
