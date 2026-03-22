export function parseManaSymbols(text: string): string {
  if (!text) return "";
  return text.replace(/\{([^}]+)\}/g, (_, symbol: string) => {
    return `<span class="mana-cost ms ms-${symbol.toLowerCase()}" title="{${symbol}}"></span>`;
  });
}
