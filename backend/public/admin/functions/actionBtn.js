export function actionBtn({ action, id, extraData = "", label, danger = false }) {
  const color = danger
    ? "text-red-600 border-red-200 hover:bg-red-50"
    : "text-gray-700 border-gray-200 hover:bg-gray-50";
  return `<button class="inline-flex items-center px-2.5 py-1.5 rounded-lg border bg-white text-xs font-medium mr-1.5 ${color}" data-action="${action}" data-id="${id}" ${extraData}>${label}</button>`;
}
