"use client";
import { useEffect, useRef } from "react";

/** Keep keyboard navigation in the active modal and restore its opener on close. */
export function useDialogFocus(open: boolean, close: () => void, busy: boolean) {
 const root = useRef<HTMLDivElement>(null);
 const state = useRef({ close, busy });
 state.current = { close, busy };
 useEffect(() => {
  const dialog = root.current;
  if (!open || !dialog) return;
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,[tabindex]"))
   .filter(element => !element.matches(":disabled") && element.tabIndex >= 0 && element.getClientRects().length > 0);
  (controls()[0] ?? dialog).focus();
  function keydown(event: KeyboardEvent) {
   if (event.key === "Escape") {
    event.preventDefault();
    if (!state.current.busy) state.current.close();
   } else if (event.key === "Tab") {
    const items = controls(), first = items[0], last = items[items.length - 1];
    if (!first) { event.preventDefault(); dialog!.focus(); }
    else if (!dialog!.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
     event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
   }
  }
  dialog.addEventListener("keydown", keydown);
  return () => {
   dialog.removeEventListener("keydown", keydown);
   document.body.style.overflow = previousOverflow;
   if (opener?.isConnected) opener.focus();
  };
 }, [open]);
 return root;
}
