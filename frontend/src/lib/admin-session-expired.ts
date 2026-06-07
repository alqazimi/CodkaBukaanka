type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;

export function setAdminSessionExpiredHandler(next: SessionExpiredHandler | null): void {
  handler = next;
}

export function notifyAdminSessionExpired(): void {
  handler?.();
}
