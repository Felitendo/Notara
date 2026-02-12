"use client";

import { useEffect, useRef } from "react";
import type { Note } from "../types";

const POLL_INTERVAL = 30_000; // 30 seconds
const FIRED_KEY = "notara-fired-reminders";

function getFiredSet(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(FIRED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markFired(noteId: string) {
  const set = getFiredSet();
  set.add(noteId);
  sessionStorage.setItem(FIRED_KEY, JSON.stringify([...set]));
}

export function useReminderNotifications(notes: Note[]) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const check = () => {
      if (Notification.permission !== "granted") return;

      const now = Date.now();
      const fired = getFiredSet();

      for (const note of notes) {
        if (!note.reminderAt) continue;
        if (fired.has(note.id)) continue;

        const reminderTime = new Date(note.reminderAt).getTime();
        if (reminderTime <= now) {
          markFired(note.id);
          new Notification(note.title || "Reminder", {
            body: "You have a reminder for this note",
            icon: "/icon-192.png",
            tag: `reminder-${note.id}`,
          });
        }
      }
    };

    // Check immediately
    check();

    // Then poll
    intervalRef.current = setInterval(check, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [notes]);
}
