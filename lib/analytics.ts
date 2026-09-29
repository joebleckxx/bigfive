"use client";

import posthog from "posthog-js";
import { track as vercelTrack } from "@vercel/analytics";
import { ANALYTICS_VERSION, POSTHOG_HOST, POSTHOG_KEY } from "./analytics-config";

type Properties = Record<string, string | number | boolean | null>;
type Attempt = { id: string; started: boolean; completed: boolean; activeAt: number };
const ATTEMPT_KEY = "tmj_analytics_attempt_v1";
const TEST_KEY = "tmj_analytics_test_v1";
const TTL = 30 * 60 * 1000;
let initialized = false;
let attempt: Attempt | undefined;

function isTestTraffic() {
  try {
    if (new URLSearchParams(location.search).get("tmj_analytics_test") === "1") sessionStorage.setItem(TEST_KEY, "1");
    return sessionStorage.getItem(TEST_KEY) === "1";
  } catch { return false; }
}

function client() {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return null;
  const production = ["hellotmj.com", "www.hellotmj.com", "tellmejoe.site", "www.tellmejoe.site", "bigfive-delta.vercel.app"].includes(location.hostname);
  if (!production && !isTestTraffic()) return null;
  if (!initialized) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ui_host: "https://eu.posthog.com",
      persistence: "sessionStorage",
      person_profiles: "never",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_exceptions: false,
      capture_performance: false,
      advanced_disable_feature_flags: true,
      respect_dnt: true,
      before_send: (event) => {
        if (!event) return event;
        // Never send checkout session IDs, arbitrary query strings, or URL fragments.
        for (const key of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"]) {
          if (typeof event.properties[key] === "string") {
            try { const url = new URL(event.properties[key]); event.properties[key] = url.origin + url.pathname; }
            catch { delete event.properties[key]; }
          }
        }
        return event;
      },
    });
    initialized = true;
  }
  return posthog;
}

function currentAttempt(): Attempt {
  if (!attempt) {
    try { attempt = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || "null") || undefined; } catch { /* storage unavailable */ }
  }
  if (!attempt || typeof attempt.id !== "string" || typeof attempt.activeAt !== "number" || Date.now() - attempt.activeAt > TTL) {
    attempt = { id: crypto.randomUUID(), started: false, completed: false, activeAt: Date.now() };
  }
  return attempt;
}

function saveAttempt() {
  if (!attempt) return;
  attempt.activeAt = Date.now();
  try { sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt)); } catch { /* memory fallback */ }
}

export function resetTestTracking() {
  attempt = undefined;
  try { sessionStorage.removeItem(ATTEMPT_KEY); } catch { /* storage unavailable */ }
}

export function analyticsContext() {
  try {
    const ph = client();
    if (!ph) return { enabled: false };
    return { enabled: true, distinctId: ph.get_distinct_id(), testAttemptId: currentAttempt().id, isTest: isTestTraffic() };
  } catch { return { enabled: false }; }
}

export function track(name: string, properties: Properties = {}) {
  // Neither analytics provider may interrupt answering, checkout, or PDF generation.
  try { if (!isTestTraffic()) vercelTrack(name, properties); } catch { /* best effort */ }
  try {
    client()?.capture(name, {
      ...properties,
      test_attempt_id: currentAttempt().id,
      analytics_version: ANALYTICS_VERSION,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || (location.hostname === "localhost" ? "development" : "production"),
      integration_test: isTestTraffic(),
      $process_person_profile: false,
    });
    saveAttempt();
  } catch { /* best effort */ }
}

export function startTestTracking(locale: string) {
  const state = currentAttempt();
  if (state.started || state.completed) return;
  state.started = true;
  saveAttempt();
  track("test_started", { locale });
}

export function completeTestTracking(locale: string, totalQuestions: number) {
  const state = currentAttempt();
  if (state.completed) return;
  state.completed = true;
  saveAttempt();
  track("test_completed", { locale, totalQuestions });
}

let lastPage = "";
export function trackPage(pathname: string) {
  if (pathname === lastPage) return;
  lastPage = pathname;
  const properties: Properties = { $current_url: location.origin + pathname, $pathname: pathname, locale: pathname.split("/")[1] || "en" };
  const params = new URLSearchParams(location.search);
  for (const name of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = params.get(name);
    if (value) properties[name] = value.slice(0, 200);
  }
  // Vercel already captures pageviews through its Analytics component.
  try {
    client()?.capture("$pageview", { ...properties, test_attempt_id: currentAttempt().id, environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "production", analytics_version: ANALYTICS_VERSION, integration_test: isTestTraffic(), $process_person_profile: false });
  } catch { /* best effort */ }
  if (pathname.endsWith("/pay")) track("pay_viewed", { locale: String(properties.locale) });
}
