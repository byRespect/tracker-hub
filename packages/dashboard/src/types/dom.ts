/**
 * DOM Types - DOM event veri modelleri
 */

export interface DOMEvent {
  id: string;
  timestamp: string | number;
  type: string;                    // click, scroll, input, etc.
  target: string;                  // CSS selector veya element tanımı
  data?: unknown;                  // Event'e özel ek veri
}
