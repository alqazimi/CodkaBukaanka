"use client";

import { useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import {
  AdminCard,
  AdminListItem,
  AdminRowActions,
  AdminTableWrap,
  adminBtnDanger,
  adminBtnPrimary,
  adminBtnSecondary,
} from "@/components/admin/admin-ui";

export type RecycleBinItem = {
  id: string;
  entityType:
    | "case"
    | "hospital"
    | "patient"
    | "doctor"
    | "medication"
    | "evidence"
    | "contact_message";
  label: string;
  deletedAt: string;
  deletedById: string | null;
  deletedByName: string | null;
  meta?: string;
};

const ENTITY_LABELS: Record<RecycleBinItem["entityType"], string> = {
  case: "Case",
  hospital: "Hospital",
  patient: "Patient",
  doctor: "Doctor",
  medication: "Medication",
  evidence: "Evidence",
  contact_message: "Inbox message",
};

function formatDeletedAt(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RecycleBinManager({ initialItems }: { initialItems: RecycleBinItem[] }) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [items, setItems] = useState(initialItems);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  function itemKey(item: RecycleBinItem) {
    return `${item.entityType}:${item.id}`;
  }

  async function refreshList() {
    const result = await clientApi.get<{ items: RecycleBinItem[] }>("/api/admin/recycle-bin");
    if (result?.items) setItems(result.items);
  }

  async function onRestore(item: RecycleBinItem) {
    const ok = await confirm({
      title: "Restore item?",
      description: `"${item.label}" will be restored and visible again in the admin panel.`,
      confirmLabel: "Restore",
      variant: "default",
    });
    if (!ok) return;

    const key = itemKey(item);
    setBusyKey(key);
    try {
      const result = await clientApi.post(
        `/api/admin/recycle-bin/${item.entityType}/${item.id}/restore`,
        {}
      );
      if (!result) {
        toast.error("Could not restore item", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Item restored");
      setItems((prev) => prev.filter((row) => itemKey(row) !== key));
    } finally {
      setBusyKey(null);
    }
  }

  async function onPurge(item: RecycleBinItem) {
    const ok = await confirm({
      title: "Delete permanently?",
      description: `"${item.label}" will be removed forever. This cannot be undone.`,
      confirmLabel: "Delete permanently",
      variant: "danger",
    });
    if (!ok) return;

    const key = itemKey(item);
    setBusyKey(key);
    try {
      const result = await clientApi.delete(
        `/api/admin/recycle-bin/${item.entityType}/${item.id}`
      );
      if (!result) {
        toast.error("Could not delete item", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Item permanently deleted");
      setItems((prev) => prev.filter((row) => itemKey(row) !== key));
    } finally {
      setBusyKey(null);
    }
  }

  if (items.length === 0) {
    return (
      <AdminCard>
        <p className="text-sm text-navy-600 dark:text-navy-400">The recycle bin is empty.</p>
      </AdminCard>
    );
  }

  return (
    <AdminCard className="p-0">
      <AdminTableWrap className="border-0">
        <div className="divide-y divide-navy-100 dark:divide-navy-800">
          {items.map((item) => {
            const busy = busyKey === itemKey(item);
            const metaParts = [
              ENTITY_LABELS[item.entityType],
              item.meta,
              item.deletedByName ? `Deleted by ${item.deletedByName}` : null,
              formatDeletedAt(item.deletedAt),
            ].filter(Boolean);

            return (
              <AdminListItem
                key={itemKey(item)}
                title={item.label}
                meta={
                  <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
                    {metaParts.join(" · ")}
                  </p>
                }
                actions={
                  <AdminRowActions>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRestore(item)}
                      className={adminBtnPrimary}
                    >
                      {busy ? "Working…" : "Restore"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onPurge(item)}
                      className={adminBtnDanger}
                    >
                      Delete permanently
                    </button>
                  </AdminRowActions>
                }
              />
            );
          })}
        </div>
      </AdminTableWrap>
      <div className="border-t border-navy-100 px-4 py-3 dark:border-navy-800">
        <button type="button" onClick={refreshList} className={adminBtnSecondary}>
          Refresh list
        </button>
      </div>
    </AdminCard>
  );
}
