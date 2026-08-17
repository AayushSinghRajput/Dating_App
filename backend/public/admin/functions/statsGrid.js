export function statsGrid(...stats) {
  return `<div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-5">${stats.join("")}</div>`;
}
