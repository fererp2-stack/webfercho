/**
 * Normaliza un texto eliminando acentos/tildes y convirtiendo a minúsculas
 * para búsquedas flexibles e insensibles.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Sugiere un título basado en las primeras 6-8 palabras de un texto.
 */
export function suggestTitle(text: string): string {
  if (!text) return "";
  const cleaned = text.trim().replace(/^#+\s*/, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const count = Math.min(words.length, 7);
  const title = words.slice(0, count).join(" ");
  return title.length > 50 ? title.substring(0, 47) + "…" : title;
}

/**
 * Copia texto al portapapeles usando navigator.clipboard y fallback con textarea
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Continúa al método fallback
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Error al copiar texto", err);
    return false;
  }
}

/**
 * Redimensiona una imagen a máximo 1600px de ancho o alto y comprime a JPEG 0.85
 */
export function processImageFile(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto del canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        resolve({
          base64,
          mimeType: "image/jpeg",
          previewUrl: dataUrl,
        });
      };
      img.onerror = () => reject(new Error("Error al procesar la imagen"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Lee un archivo no imagen (PDF, doc, video) como base64
 */
export function processGenericFile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve({
        base64,
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsDataURL(file);
  });
}
