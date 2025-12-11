import { loggerService } from "../loggerService";
import { LogLevel, DomEventLogEntry } from "../shared/types";
import { createId, nowIso } from "../shared/utils";

// DOM interactions için hafif bir queue tutuyoruz.
let maxEvents = 100;
const domEvents: DomEventLogEntry[] = [];

/**
 * Tutulacak max DOM event sayısını belirler.
 */
export function setDomEventLimit(limit: number) {
  maxEvents = Math.max(10, limit);
}

/**
 * Güncel DOM event'lerini kopyalayarak döndürür.
 */
export function getDomEvents(): DomEventLogEntry[] {
  return [...domEvents];
}

function trimEvents() {
  if (domEvents.length > maxEvents) {
    domEvents.splice(0, domEvents.length - maxEvents);
  }
}

/**
 * Click'leri yakalar; target tag ve text'i kısa tutar.
 */
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const entry: DomEventLogEntry = {
    id: createId(),
    timestamp: nowIso(),
    event: "click",
    target: target?.tagName ?? "UNKNOWN",
    text: target?.innerText?.slice(0, 120) ?? "",
    origin: "dom",
  };
  domEvents.push(entry);
  trimEvents();
  loggerService.emit("dom", "info", entry);
}

/**
 * Input değişimlerini yakalar; değeri sızdırmadan ilk 120 char alır.
 */
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  const entry: DomEventLogEntry = {
    id: createId(),
    timestamp: nowIso(),
    event: "input",
    target: target.tagName,
    text: target.value?.slice(0, 120) ?? "",
    origin: "dom",
  };
  domEvents.push(entry);
  trimEvents();
  loggerService.emit("dom", "info", entry);
}

/**
 * DOM logger'ı başlatır, temel listeners'ı ekler.
 */
export function initDomEventLogger() {
  if (typeof window === "undefined") return;
  window.addEventListener("click", handleClick, true);
  window.addEventListener("input", handleInput, true);
  loggerService.emit("dom", "info", {
    id: createId(),
    timestamp: nowIso(),
    event: "init",
    target: "window",
    text: "DOM logger basladi",
    origin: "dom",
  });
}
