import { cachePartImages } from './inventoryApi';
import { fetchPartImages } from './rebrickable';

// Piezas ya consultadas a Rebrickable en esta sesión (tengan o no imagen): no se repite la petición.
const attempted = new Set();

// Pide a Rebrickable las fotos de las piezas indicadas (una sola petición por bloque), las guarda en
// parts.img_url como caché y devuelve { part_num: url } con las que ha encontrado.
export async function loadMissingImages(partNums) {
  const todo = [...new Set(partNums)].filter((n) => !attempted.has(n));
  if (todo.length === 0) return {};
  todo.forEach((n) => attempted.add(n));

  const images = await fetchPartImages(todo);
  if (Object.keys(images).length > 0) cachePartImages(images); // sin esperar
  return images;
}
