"use client";

import { useEffect } from "react";
import type { ClientLocationInfo } from "@/lib/ipwhois-api-contract";
import { DEFAULT_FEEDBACK_EVENT_ID } from "@/lib/feedback-options";
import { resolveEventJoinContext } from "@/lib/event-join-context";
import { isEventPubliclyEnded } from "@/lib/event-registration-window";
import { ROUTES } from "@/lib/routes";
import * as eventService from "@/services/event.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useHomeDataStore } from "@/store/useHomeDataStore";

export const LOCATION_PERMISSION_PROMPT_KEY = "location_permission_prompt";

export function destinationShouldPromptLocation(destination: string): boolean {
  if (destination === ROUTES.home || destination === "/") return true;
  return destination === "/dashboard" || destination.startsWith("/dashboard/");
}

export function markLocationPermissionPrompt(source: "login" | "registration") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOCATION_PERMISSION_PROMPT_KEY, source);
}

export function markLocationPermissionPromptForDestination(
  destination: string,
  source: "login" | "registration",
) {
  if (destinationShouldPromptLocation(destination)) {
    markLocationPermissionPrompt(source);
  }
}

export function consumeLocationPermissionPrompt():
  | "login"
  | "registration"
  | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(LOCATION_PERMISSION_PROMPT_KEY);
  sessionStorage.removeItem(LOCATION_PERMISSION_PROMPT_KEY);
  return value === "login" || value === "registration" ? value : null;
}

async function fetchIpWhoisLocationFromApi(): Promise<
  ClientLocationInfo & { error?: string | null }
> {
  try {
    const response = await fetch("/api/ip-lookup", { cache: "no-store" });
    const data = (await response.json()) as ClientLocationInfo & { error?: string | null };
    return {
      ip: data.ip ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      error: data.error ?? (response.ok ? null : `IP lookup failed (${response.status})`),
    };
  } catch (err) {
    return {
      ip: null,
      region: null,
      country: null,
      latitude: null,
      longitude: null,
      error: err instanceof Error ? err.message : "IP lookup failed",
    };
  }
}

function resolveJoinEventId(preferredEventId?: string | null): string {
  const preferred = preferredEventId?.trim();
  if (preferred) return preferred;
  const upcoming = useHomeDataStore.getState().upcomingEvents;
  const fromHome = upcoming[0]?.id?.trim();
  if (fromHome) return fromHome;
  return DEFAULT_FEEDBACK_EVENT_ID;
}

function readBrowserGeolocation(): Promise<{
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}> {
  if (!("geolocation" in navigator)) {
    return Promise.resolve({ latitude: null, longitude: null, accuracy: null });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        resolve({ latitude: null, longitude: null, accuracy: null });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  });
}

/**
 * Resolve IP + optional browser GPS and POST /events/event/:id/join/.
 * `location_accuracy` is always sent as `0`; lat/long are rounded to 5 decimals in the service.
 */
export async function joinEventFromClient(eventId?: string | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (isEventPubliclyEnded()) return;

  const location = await fetchIpWhoisLocationFromApi();
  const browser = await readBrowserGeolocation();
  const resolvedEventId = resolveJoinEventId(eventId);
  const joinContext = await resolveEventJoinContext(resolvedEventId);

  try {
    await eventService.joinEvent(resolvedEventId, {
      ipAddress: location.ip ?? "",
      latitude: browser.latitude ?? location.latitude,
      longitude: browser.longitude ?? location.longitude,
      locationAccuracy: 0,
      state: location.region ?? "",
      country: location.country ?? "",
      dayId: joinContext.dayId,
      sessionId: joinContext.sessionId,
    });
  } catch {
    // Join location is best-effort; don't block Watch Live / home flow.
  }
}

/**
 * After login/registration: resolve IP geo via ipwhois.io and
 * POST /events/event/:id/join/ with `{ ip_address, latitude, longitude, location_accuracy, state, country }`.
 */
export async function requestLocationPermission(_source: "login" | "registration") {
  await joinEventFromClient();
}

/** Run on home or dashboard after login / post-registration redirect. */
export function useLocationPermissionPromptOnMount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;

    const source = consumeLocationPermissionPrompt();
    if (!source) return;

    void requestLocationPermission(source);
  }, [hasHydrated, isAuthenticated]);
}
