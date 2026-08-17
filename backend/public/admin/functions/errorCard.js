import { CARD } from "./styles.js";
import { esc } from "./esc.js";

export function errorCard(message) {
  return `<div class="${CARD}"><p class="text-sm text-red-600">${esc(message)}</p></div>`;
}
