import { colors } from './theme';

// Mezcla un color hex de Rebrickable (sin '#', ej. 'C91A09') con blanco.
// amount 0 = el color tal cual, 1 = blanco. Devuelve '#RRGGBB'.
export function tint(hex, amount) {
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return colors.card;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const to2 = (v) => v.toString(16).padStart(2, '0');
  return `#${to2(mix((n >> 16) & 255))}${to2(mix((n >> 8) & 255))}${to2(mix(n & 255))}`;
}

// Colores para la tarjeta de una pieza: fondo suave y borde con el color real.
// Si el color es casi blanco el borde se haría invisible, así que se usa el gris de siempre.
export function cardColorsFor(hex) {
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b; // 0 = negro, 255 = blanco
  return {
    body: tint(hex, 0.86),
    edge: luminance > 225 ? colors.border : `#${hex}`,
  };
}
