export function badge(text, color) {
  const colors = {
    red: "bg-red-100 text-red-600",
    brand: "bg-brand-100 text-brand-600",
    blue: "bg-blue-100 text-blue-600",
  };
  return `<span class="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}">${text}</span>`;
}
