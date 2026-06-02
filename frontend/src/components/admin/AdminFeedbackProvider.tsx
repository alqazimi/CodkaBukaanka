"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type AdminFeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
};

const AdminFeedbackContext = createContext<AdminFeedbackContextValue | null>(null);

function useAdminFeedback() {
  const ctx = useContext(AdminFeedbackContext);
  if (!ctx) {
    throw new Error("useAdminFeedback must be used within AdminFeedbackProvider");
  }
  return ctx;
}

export function useAdminConfirm() {
  return useAdminFeedback().confirm;
}

export function useAdminToast() {
  return useAdminFeedback().toast;
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => setMounted(true), []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    window.setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const toast = {
    success: (title: string, description?: string) => pushToast("success", title, description),
    error: (title: string, description?: string) => pushToast("error", title, description),
    info: (title: string, description?: string) => pushToast("info", title, description),
  };

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const closeConfirm = useCallback((value: boolean) => {
    setConfirmState((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [confirmState, closeConfirm]);

  const variant = confirmState?.options.variant ?? "danger";
  const isDanger = variant === "danger";

  const portal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <>
            {confirmState && (
              <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
                <button
                  type="button"
                  className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
                  aria-label="Close dialog"
                  onClick={() => closeConfirm(false)}
                />
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  aria-describedby={confirmState.options.description ? descId : undefined}
                  className="relative w-full max-w-md animate-fade-in rounded-2xl border border-navy-100 bg-white p-6 shadow-2xl dark:border-navy-700 dark:bg-navy-900"
                >
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        isDanger ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-700"
                      )}
                    >
                      <AlertTriangle className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 id={titleId} className="font-serif text-lg font-semibold text-navy-900 dark:text-navy-50">
                        {confirmState.options.title}
                      </h2>
                      {confirmState.options.description && (
                        <p id={descId} className="mt-2 text-sm leading-relaxed text-navy-600 dark:text-navy-400">
                          {confirmState.options.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      ref={cancelRef}
                      type="button"
                      onClick={() => closeConfirm(false)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
                    >
                      {confirmState.options.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeConfirm(true)}
                      className={cn(
                        "inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white transition",
                        isDanger ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
                      )}
                    >
                      {confirmState.options.confirmLabel ?? (isDanger ? "Delete" : "Confirm")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div
              className="pointer-events-none fixed bottom-4 right-4 z-[110] flex w-full max-w-sm flex-col gap-2 p-4 sm:bottom-6 sm:right-6"
              aria-live="polite"
              aria-relevant="additions"
            >
              {toasts.map((t) => (
                <ToastNotification key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
              ))}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <AdminFeedbackContext.Provider value={{ confirm, toast }}>
      {children}
      {portal}
    </AdminFeedbackContext.Provider>
  );
}

function ToastNotification({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const Icon =
    toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? XCircle : Info;
  const styles =
    toast.variant === "success"
      ? "border-emerald-200 bg-white text-emerald-900 dark:border-emerald-800 dark:bg-navy-900 dark:text-emerald-300"
      : toast.variant === "error"
        ? "border-red-200 bg-white text-red-900 dark:border-red-900/60 dark:bg-navy-900 dark:text-red-300"
        : "border-navy-200 bg-white text-navy-900 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100";

  const iconStyles =
    toast.variant === "success"
      ? "text-emerald-600"
      : toast.variant === "error"
        ? "text-red-600"
        : "text-teal-600";

  return (
    <div
      className={cn(
        "pointer-events-auto flex animate-fade-in gap-3 rounded-xl border p-4 shadow-lg",
        styles
      )}
      role="status"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconStyles)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-800 dark:hover:text-navy-200"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
