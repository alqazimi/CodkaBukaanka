"use client";

import { useEffect, useState } from "react";
import { clientApi } from "@/lib/api";

export function AdminInboxBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    clientApi.get<{ count: number }>("/api/admin/inbox/unread-count").then((data) => {
      if (data) setCount(data.count);
    });
  }, []);

  if (count <= 0) return null;

  return (
    <span className="ml-auto rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>
  );
}
