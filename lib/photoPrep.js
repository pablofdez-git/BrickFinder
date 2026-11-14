import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;

// Reduce la foto a ~1024 px de ancho y la guarda como JPEG. Una foto de móvil pesa varios MB: reducida sube mucho
// más rápido y el reconocimiento no pierde nada (el servicio trabaja con imágenes pequeñas).
// Devuelve la ruta (uri) de la imagen reducida.
export async function shrinkPhoto(uri) {
  const context = ImageManipulator.manipulate(uri);
  try {
    context.resize({ width: MAX_WIDTH });
    const image = await context.renderAsync();
    try {
      const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
      return result.uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}
