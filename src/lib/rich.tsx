'use client';

/** Sanitized inline HTML: allows only <strong>, <em>, <br> (legacy `rich()` parity). */
export function richHtml(source: string): string {
  if (typeof document === 'undefined') return escapeHtml(source);
  const allowed = new Set(['STRONG', 'EM', 'BR']);
  const template = document.createElement('template');
  template.innerHTML = String(source);
  const root = template.content;
  const clean = (node: Node): void => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 8) {
        node.removeChild(child);
        return;
      }
      if (child.nodeType !== 1) return;
      const el = child as Element;
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE'].includes(el.tagName)) {
        node.removeChild(child);
        return;
      }
      clean(el);
      if (!allowed.has(el.tagName)) {
        while (el.firstChild) node.insertBefore(el.firstChild, el);
        node.removeChild(el);
        return;
      }
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
    });
  };
  clean(root);
  return template.innerHTML;
}

export function escapeHtml(source: string): string {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
