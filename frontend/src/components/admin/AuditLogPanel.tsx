"use client";

import { useCallback, useEffect, useState } from "react";
import { clientApi } from "@/lib/api";
import { adminInputClass } from "@/components/admin/admin-ui";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  admin?: { name: string; email: string } | null;
};

type AuditLogPanelProps = {
  canViewGlobalAudit: boolean;
  initialData?: { items: AuditItem[]; total: number; page: number } | null;
  serverPrefetched?: boolean;
};

export function AuditLogPanel({
  canViewGlobalAudit,
  initialData = null,
  serverPrefetched = false,
}: AuditLogPanelProps) {
  const [items, setItems] = useState<AuditItem[]>(initialData?.items ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [page, setPage] = useState(initialData?.page ?? 1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(!serverPrefetched);
  const [skipFirstFetch, setSkipFirstFetch] = useState(
    serverPrefetched && (initialData?.page ?? 1) === 1 && !action
  );

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (action) params.set("action", action);
    const res = await clientApi.get<{ items: AuditItem[]; total: number }>(`/api/admin/audit?${params.toString()}`);
    if (res) {
      setItems(res.items);
      setTotal(res.total);
    }
    setLoading(false);
  }, [page, action]);

  useEffect(() => {
    if (skipFirstFetch) {
      setSkipFirstFetch(false);
      return;
    }
    load();
  }, [load, skipFirstFetch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={adminInputClass}>
          <option value="">All actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="PUBLISH">Publish</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
          <option value="LOGIN_FAILED">Login failed</option>
        </select>
        <p className="text-sm text-navy-500">{total} entries · {canViewGlobalAudit ? "All admins" : "Your actions only"}</p>
      </div>

      {loading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : (
        <ul className="admin-surface-list">
          {items.map((log) => (
            <li key={log.id} className="px-4 py-3 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-navy-800 dark:text-navy-200">
                  <span className="font-medium">{log.action}</span> {log.entityType}
                  {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ""}
                  {canViewGlobalAudit && log.admin ? ` · ${log.admin.name}` : ""}
                </span>
                <time className="text-xs text-navy-400">{new Date(log.createdAt).toLocaleString()}</time>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 50 && (
        <div className="flex justify-end gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
            Previous
          </button>
          <button type="button" disabled={page * 50 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
