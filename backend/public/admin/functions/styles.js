// Shared Tailwind class fragments and icon markup — kept in one place
// instead of a stylesheet so every dynamically-rendered piece of markup
// stays visually consistent without repeating a long class list at each
// call site. Constants, not functions, but grouped here since several
// function modules import from this file.
export const CARD = "bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6";
export const CARD_TITLE = "text-sm font-bold text-gray-900 mb-4";
export const TABLE_HEAD_CELL = "pb-2.5 font-semibold";
export const TABLE_ROW = "border-b border-gray-50 last:border-0";
export const TABLE_CELL = "py-2.5 pr-4";
export const INPUT =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent";

// hover:text-gray-900 is part of the toggled set (not baked into the static
// HTML) specifically so an *active* tab keeps its brand color under hover
// instead of the browser's real :hover state overriding it back to gray.
export const ACTIVE_TAB_CLASSES = ["text-brand-600", "border-brand-600"];
export const INACTIVE_TAB_CLASSES = ["text-gray-500", "border-transparent", "hover:text-gray-900"];

export const EYE_ICON = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />`;
export const EYE_OFF_ICON = `<path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><path d="M6.6 6.6C3.9 8.28 2 12 2 12s4 8 11 8a10.4 10.4 0 0 0 5.4-1.6" /><path d="M2 2l20 20" />`;
