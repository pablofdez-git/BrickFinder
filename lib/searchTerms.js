// Búsqueda en español: el catálogo de Rebrickable solo tiene nombres en inglés, así que las palabras
// en español se traducen ANTES de buscar. Lo escrito en inglés (o los números) pasa tal cual.
// Para ampliar el diccionario basta con añadir líneas aquí (sin tildes y en minúsculas).

const DICTIONARY = {
  // ── Tipos de pieza ──
  ladrillo: 'brick', placa: 'plate', teja: 'slope', pendiente: 'slope', rampa: 'slope', inclinado: 'slope',
  liso: 'tile', lisa: 'tile', baldosa: 'tile', azulejo: 'tile',
  rueda: 'wheel', neumatico: 'tyre', llanta: 'tyre',
  ventana: 'window', puerta: 'door', bisagra: 'hinge', cuna: 'wedge',
  redondo: 'round', redonda: 'round', esquina: 'corner', arco: 'arch', curvo: 'curved', curva: 'curved',
  eje: 'axle', viga: 'beam', pasador: 'pin', engranaje: 'gear', cremallera: 'rack', cadena: 'chain',
  barra: 'bar', escalera: 'ladder', valla: 'fence', parabrisas: 'windscreen', cristal: 'windscreen',
  techo: 'roof', cono: 'cone', cilindro: 'cylinder', cupula: 'dome', plato: 'dish',
  antena: 'antenna', bandera: 'flag', pegatina: 'sticker', gancho: 'hook', soporte: 'support',
  muelle: 'spring', iman: 'magnet', manguera: 'hose', tubo: 'tube', cuerda: 'string',
  ala: 'wing', helice: 'propeller', motor: 'motor', teton: 'stud', agujero: 'hole', marco: 'frame',
  // ── Minifiguras ──
  cabeza: 'head', pierna: 'leg', brazo: 'arm', mano: 'hand', casco: 'helmet', sombrero: 'hat',
  pelo: 'hair', cabello: 'hair', gafas: 'glasses', capa: 'cape', espada: 'sword', escudo: 'shield',
  arbol: 'tree', planta: 'plant', hoja: 'leaf', flor: 'flower',
  // ── Adjetivos y conectores ──
  con: 'with', sin: 'without', y: 'and', grande: 'large', pequeno: 'small', largo: 'long', plano: 'flat',
  doble: 'double', invertido: 'inverted', abierto: 'open', cerrado: 'closed', modificado: 'modified',
  impreso: 'print', estampado: 'print',
  // ── Colores ──
  rojo: 'red', roja: 'red', azul: 'blue', verde: 'green', amarillo: 'yellow', amarilla: 'yellow',
  negro: 'black', negra: 'black', blanco: 'white', blanca: 'white', gris: 'gray', naranja: 'orange',
  marron: 'brown', rosa: 'pink', morado: 'purple', morada: 'purple', purpura: 'purple', violeta: 'violet',
  lila: 'lavender', celeste: 'light blue', turquesa: 'turquoise', beige: 'tan', arena: 'sand',
  oro: 'gold', dorado: 'gold', dorada: 'gold', plata: 'silver', plateado: 'silver', plateada: 'silver',
  cobre: 'copper', cromado: 'chrome', perla: 'pearl', oliva: 'olive', piel: 'nougat', lima: 'lime',
  transparente: 'trans', claro: 'light', clara: 'light', oscuro: 'dark', oscura: 'dark',
  brillante: 'bright', medio: 'medium', media: 'medium', muy: 'very', neon: 'neon', metalico: 'metallic',
  rojizo: 'reddish', azulado: 'bluish', verdoso: 'greenish', purpurina: 'glitter',
};

// Palabras que sobran al hablar ("ladrillo DE 2x4") y no aparecen en los nombres.
const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'para']);

// Minúsculas y sin tildes: "Cuña" → "cuna".
export function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Busca la palabra tal cual y, si no está, probando sin la terminación de plural ("tetones" → "teton").
function lookup(word) {
  if (DICTIONARY[word]) return DICTIONARY[word];
  if (word.endsWith('es') && DICTIONARY[word.slice(0, -2)]) return DICTIONARY[word.slice(0, -2)];
  if (word.endsWith('s') && DICTIONARY[word.slice(0, -1)]) return DICTIONARY[word.slice(0, -1)];
  return null;
}

// Traduce una lista de términos. Los números, las medidas ("2 x 4") y lo que ya esté en inglés no cambian.
// Una palabra puede dar varias ("celeste" → "light", "blue"). Si todo eran palabras de relleno, se devuelve igual.
export function translateTerms(terms) {
  const out = [];
  for (const term of terms) {
    const word = normalize(term);
    if (/\d/.test(word)) {
      out.push(term); // números y medidas: tal cual
    } else if (STOPWORDS.has(word)) {
      continue;
    } else {
      const english = lookup(word);
      if (english) out.push(...english.split(' '));
      else out.push(term);
    }
  }
  return out.length > 0 ? out : terms;
}

// ¿`text` contiene todas las palabras de `query`? (en español o inglés, sin importar tildes ni orden).
// Se usa para filtrar listas locales, como los colores.
export function matchesQuery(text, query) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(text);
  return translateTerms(terms).every((t) => haystack.includes(normalize(t)));
}
