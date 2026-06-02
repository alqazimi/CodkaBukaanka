"use client";

import { useRouter } from "@/i18n/routing";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

export function SearchBar({
  placeholder,
  defaultValue = "",
  className = "",
}: {
  placeholder: string;
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-navy-200 bg-white py-3.5 pl-12 pr-4 text-navy-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
    </form>
  );
}
