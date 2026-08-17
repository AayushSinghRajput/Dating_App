import { esc } from "./esc.js";
import { getUserSearch } from "./state.js";
import { CARD, INPUT } from "./styles.js";

export function renderUserSearchBox() {
  return `<div class="${CARD}">
    <input type="text" placeholder="Search by username or email" id="userSearchInput" value="${esc(getUserSearch())}" class="${INPUT}" />
  </div>`;
}
