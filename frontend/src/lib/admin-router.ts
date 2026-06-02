"use client";

/** Full navigation so cookies and server layout run reliably (avoids blank client transitions). */
export function navigateAdmin(target: string) {
  window.location.assign(target);
}

export function navigateAfterLogin(target = "/admin") {
  navigateAdmin(target);
}
