"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";

const RESULT_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const PAID_KEY = "bigfive_paid_v1";

const LAST_ACTIVE_KEY = "personality_last_active_v1";
const PROGRESS_TTL_MS = 60 * 60 * 1000;

const SCALE_VALUES = [1, 2, 3, 4, 5] as const;

function normalizeAnswers(input: unknown, total: number): number[] | null {
  if (!Array.isArray(input) || input.length !== total) return null;
  const arr = input.map((v) =>
    Number.isInteger(v) && v >= 1 && v <= 5 ? v : 0
  );
  return arr;
}

function readLastActive(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function touchLastActive() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function clearProgressStorage() {
  try {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(PAID_KEY);
    localStorage.removeItem(RESULT_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export default function TestPage() {
  const router = useRouter();
  const t = useTranslations("Test");
  const s = useTranslations("Scale");
  const q = useTranslations("Questions");

  const total = QUESTIONS.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(0));

  // tap feedback
  const [tapSelected, setTapSelected] = useState<number | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // menu ⋯
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  // load progress + TTL
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      const hasAnswers = !!raw;

      if (hasAnswers) {
        const lastActiveAt = readLastActive();
        const expired =
          !lastActiveAt || Date.now() - lastActiveAt > PROGRESS_TTL_MS;

        if (expired) {
          clearProgressStorage();
          setAnswers(Array(total).fill(0));
          setIndex(0);
          setTapSelected(null);
          setIsAdvancing(false);
          return;
        }
      }

      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalized = normalizeAnswers(parsed, total);
      if (!normalized) return;

      setAnswers(normalized);
      const firstUnanswered = normalized.findIndex((v) => v === 0);
      setIndex(firstUnanswered === -1 ? total - 1 : firstUnanswered);
      setTapSelected(null);
      setIsAdvancing(false);
    } catch {
      // ignore
    }
  }, [total]);

  const progressText = t("progress", {
    current: Math.min(index + 1, total),
    total
  });

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((index + 1) / total) * 100);
  }, [index, total]);

  const currentQuestion = QUESTIONS[index];

  function persistAnswers(nextAnswers: number[]) {
    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(RESULT_KEY);
      touchLastActive();
      localStorage.setItem(ANSWERS_KEY, JSON.stringify(nextAnswers));
    } catch {
      // ignore
    }
  }

  function doReset() {
    clearProgressStorage();
    setAnswers(Array(total).fill(0));
    setIndex(0);
    setTapSelected(null);
    setIsAdvancing(false);
    setMenuOpen(false);
  }

  function goToStart() {
    setMenuOpen(false);
    router.push("/");
  }

  function commitAnswer(v: number) {
    const next = [...answers];
    next[index] = v;
    setAnswers(next);
    persistAnswers(next);

    const done = next.every((x) => x >= 1 && x <= 5);
    if (done) {
      if (index < total - 1) setIndex(index + 1);
      else router.push("/pay");
      return;
    }

    const firstUnanswered = next.findIndex((x) => x === 0);
    setIndex(firstUnanswered === -1 ? total - 1 : firstUnanswered);
  }

  function handleAnswer(v: number) {
    if (isAdvancing) return;

    setIsAdvancing(true);
    setTapSelected(v);

    window.setTimeout(() => {
      commitAnswer(v);
      setTapSelected(null);
      setIsAdvancing(false);
    }, 80);
  }

  function goBack() {
    if (index === 0 || isAdvancing) return;
    touchLastActive();
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!currentQuestion) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-4 py-6 text-white sm:px-6 sm:py-10">
      {/* tło jak wcześniej */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-xl">
        {/* Topbar */}
        <div className="relative z-30 mb-6 flex items-center justify-between">
          <div className="text-sm text-white/60">{progressText}</div>

          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              type="button"
              disabled={index === 0}
              className="inline-flex items-center justify-center text-white/60 transition hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-disabled={index === 0 || isAdvancing}
            >
              <span className="sr-only">{t("back")}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 840 818"
                className="h-5 w-5"
                fill="currentColor"
              >
                <g>
                  <path d="m 425.5,784.84376 c -52.117,-4.0508 -97.58568,-16.4994 -142.57803,-39.0357 -49.89693,-24.993 -95.73996,-63.1878 -129.08243,-107.547 -6.78764,-9.0303 -7.05537,-9.5862 -5.24611,-10.893 1.04861,-0.7574 11.78125,-8.3386 23.85031,-16.8471 l 21.94374,-15.4699 4.99151,6.6432 c 49.13277,65.3909 121.03233,108.6754 202.14505,121.6941 19.90533,3.1949 54.75151,4.3664 75.39833,2.5349 78.32115,-6.9475 149.36053,-42.2721 203.28844,-101.0858 45.04847,-49.1298 72.98653,-111.8239 79.76693,-178.99998 0.58289,-5.775 1.05981,-19.5 1.05981,-30.5 0,-11 -0.47692,-24.725 -1.05981,-30.5 C 752.65159,312.25436 720.76668,245.3541 669.3464,194.67667 654.61751,180.16057 650.5315,176.58501 636.71437,166.12118 595.81909,135.15084 547.40929,114.87397 494.75656,106.6609 482.37857,104.73011 476.48104,104.433 450,104.40611 c -33.87064,-0.0344 -42.42069,0.81244 -69.5,6.88354 -89.19999,19.99836 -164.79211,77.87101 -206.76554,158.29783 -3.22915,6.1875 -5.67167,11.25 -5.42782,11.25 0.69692,0 19.79132,-9.08645 73.47866,-34.96628 10.60692,-5.11304 19.47933,-9.10242 19.71646,-8.86529 0.95449,0.9545 24.49824,50.33924 24.49824,51.38688 0,0.6203 -4.8375,3.41466 -10.75,6.20969 -5.9125,2.79503 -45.82702,21.99133 -88.69894,42.65844 -42.87191,20.66711 -78.43739,37.57656 -79.03438,37.57656 -0.597,0 -15.894181,-30.7125 -33.993745,-68.25 -18.099563,-37.5375 -37.522991,-77.80929 -43.163172,-89.49288 -9.037953,-18.72204 -10.053429,-21.34955 -8.55732,-22.14176 12.015242,-6.36221 50.651483,-24.04108 51.201905,-23.42857 0.40193,0.44727 9.589172,19.26321 20.416094,41.81321 10.826918,22.55 20.055048,41.37103 20.506948,41.82452 0.4519,0.45348 3.8673,-4.94652 7.58978,-12 C 180.24007,131.89177 287.81966,59.628182 414,46.694802 c 16.07465,-1.64764 54.91639,-1.64824 71,-0.001 111.1792,11.38598 208.63824,69.476378 271.30597,161.711748 66.84815,98.38817 82.07347,224.02227 40.61042,335.10311 -30.2067,80.9247 -86.55924,147.9546 -161.20337,191.7472 -11.9433,7.007 -38.91201,20.1029 -51.42921,24.9739 -30.26178,11.7761 -66.25259,20.4185 -98.28381,23.6008 -14.86039,1.4764 -47.50668,2.0232 -60.5,1.0133 z" />
                </g>
              </svg>
            </button>

            {/* Menu ⋯ */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl
                  px-2.5 py-1.5 text-sm font-semibold tracking-tight
                  text-white/70 hover:text-white/90
                  border border-white/10 hover:border-white/20
                  bg-transparent hover:bg-white/5
                  transition focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("menu")}
              >
                ⋯
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-max
                    rounded-xl border border-white/10
                    bg-[#0B0C14]/90 backdrop-blur-xl
                    shadow-xl overflow-hidden p-1"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={doReset}
                    className="block w-full whitespace-nowrap rounded-lg
                      px-3 py-2 text-sm font-medium tracking-tight
                      text-white/75 hover:text-white hover:bg-white/8"
                    role="menuitem"
                  >
                    {t("reset")}
                  </button>
                  <button
                    type="button"
                    onClick={goToStart}
                    className="block w-full whitespace-nowrap rounded-lg
                      px-3 py-2 text-sm font-medium tracking-tight
                      text-white/75 hover:text-white hover:bg-white/8"
                    role="menuitem"
                  >
                    {t("start")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 h-[6px] w-full rounded-full bg-white/10">
          <div
            className="h-[6px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 transition-[width] duration-150"
            style={{
              width: `${progress}%`,
              minWidth: index === 0 ? "24px" : undefined
            }}
          />
        </div>

        {/* micro-slide USUNIĘTY: brak transition/translate */}
        <div className="relative z-10">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-2xl sm:p-6">
            <h2 className="mb-6 mt-2 text-xl font-semibold leading-snug tracking-tight">
              {q(currentQuestion.id)}
            </h2>

            <div className="space-y-3">
              {SCALE_VALUES.map((v) => {
                const selected = answers[index] === v;
                const tapping = tapSelected === v;

                // ✅ różnicowanie tła
                const baseTone =
                  v === 3
                    ? "border-white/22 bg-white/18"
                    : v === 2 || v === 4
                      ? "border-white/16 bg-white/13"
                      : "border-white/12 bg-white/9";

                const toneColor =
                  v === 3
                    ? "rgba(255, 255, 255, 0.18)"
                    : v === 2 || v === 4
                      ? "rgba(255, 255, 255, 0.13)"
                      : "rgba(255, 255, 255, 0.09)";

                const pressedToneColor =
                  v === 3
                    ? "rgba(255, 255, 255, 0.12)"
                    : v === 2 || v === 4
                      ? "rgba(255, 255, 255, 0.09)"
                      : "rgba(255, 255, 255, 0.06)";

                const gradientBorderBase =
                  "relative w-full rounded-2xl border border-transparent px-4 py-3 text-left backdrop-blur-xl sm:px-5 sm:py-4";

                const gradientBorderStyle = {
                  padding: "1px",
                  boxSizing: "border-box",
                  background:
                    "linear-gradient(to right, #6366F1, #8B5CF6, #EC4899)",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude"
                } as const;

                // ✅ NEW: pokazuj ramkę NATYCHMIAST na dotyku (przed onClick)
                const onPressStart = () => {
                  if (isAdvancing) return;
                  setTapSelected(v);
                };
                const onPressCancel = () => {
                  if (tapSelected === v) setTapSelected(null);
                };

                if (tapping || selected) {
                  const gradientTone = tapping ? pressedToneColor : toneColor;
                  return (
                    <button
                      key={v}
                      onPointerDown={onPressStart}
                      onPointerCancel={onPressCancel}
                      onClick={() => handleAnswer(v)}
                      aria-disabled={isAdvancing}
                      type="button"
                      className={[
                        gradientBorderBase,
                        isAdvancing ? "pointer-events-none cursor-not-allowed" : "",
                        "focus:outline-none focus-visible:outline-none",
                        "transition-transform duration-100 active:scale-[0.98]",
                        "[-webkit-tap-highlight-color:transparent]"
                      ].join(" ")}
                      style={{ backgroundColor: gradientTone }}
                    >
                      <span className="relative z-10 text-sm font-medium text-white/90">
                        {s(String(v))}
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-px rounded-[calc(1rem+1px)]"
                        style={gradientBorderStyle}
                      />
                    </button>
                  );
                }

                return (
                  <button
                    key={v}
                    onPointerDown={onPressStart}
                    onPointerCancel={onPressCancel}
                    onClick={() => handleAnswer(v)}
                    aria-disabled={isAdvancing}
                    type="button"
                    className={[
                      "w-full rounded-2xl border px-4 py-3 text-left backdrop-blur-xl sm:px-5 sm:py-4",
                      "focus:outline-none focus-visible:outline-none",
                      "[-webkit-tap-highlight-color:transparent]",
                      "active:bg-transparent",
                      "transition-[background-color,border-color,transform] duration-150 active:scale-[0.98]",
                      baseTone,
                      !isAdvancing
                        ? "md:hover:border-white/25 md:hover:bg-white/15"
                        : "",
                      isAdvancing ? "pointer-events-none cursor-not-allowed" : ""
                    ].join(" ")}
                  >
                    <span className="text-sm font-medium text-white/90">
                      {s(String(v))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
