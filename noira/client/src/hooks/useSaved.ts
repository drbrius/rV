/* ============================================================
   Merkliste
   Bewusst ohne Konto: Wer sich hier etwas merkt, soll dafür
   keine E-Mail-Adresse hinterlassen müssen. Die Liste lebt im
   Browser und geht uns nichts an.

   Ein winziger externer Store statt Context — so bleiben
   Kartenherz, Kopfzeile und Merklistenseite synchron, ohne
   dass die halbe App in einen Provider muss.
   ============================================================ */

import { useSyncExternalStore } from "react";

const KEY = "noira.saved.v1";

let ids: string[] = read();
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function commit(next: string[]) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Privater Modus: die Liste gilt dann nur für diese Sitzung */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Zweiter Tab derselben Person: dort geänderte Liste übernehmen.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    ids = read();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSavedIds() {
  return useSyncExternalStore(
    subscribe,
    () => ids,
    () => ids,
  );
}

export function isSaved(id: string) {
  return ids.includes(id);
}

/** Schaltet um und meldet den neuen Zustand zurück. */
export function toggleSaved(id: string) {
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  commit(next);
  return next.includes(id);
}

export function clearSaved() {
  commit([]);
}
