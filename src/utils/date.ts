/**
 * Convierte una fecha (ISO, timestamp o texto) a formato relativo en español
 * Ejemplo: "hace un momento", "hace 5 minutos", "hace 2 horas", "ayer", "hace 3 días"
 */
export function formatRelativeDate(dateInput: string | number | null | undefined): string {
  if (!dateInput) return "Recientemente";

  let date: Date;
  if (typeof dateInput === "number") {
    // Si viene en segundos (UNIX timestamp corto de 10 dígitos)
    date = new Date(dateInput < 10000000000 ? dateInput * 1000 : dateInput);
  } else {
    // Si es string numérico
    if (/^\d+$/.test(dateInput)) {
      const num = parseInt(dateInput, 10);
      date = new Date(num < 10000000000 ? num * 1000 : num);
    } else {
      date = new Date(dateInput);
    }
  }

  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) {
    return "hace un momento";
  }
  if (diffMin < 60) {
    return diffMin === 1 ? "hace 1 minuto" : `hace ${diffMin} minutos`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
  }
  if (diffDays === 1) {
    return "ayer";
  }
  if (diffDays < 7) {
    return `hace ${diffDays} días`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  }

  const years = Math.floor(diffDays / 365);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}
