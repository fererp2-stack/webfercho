// Configuración del backend Google Apps Script
export const SCRIPT_URL: string = "PEGA_AQUI_TU_URL_EXEC";

/**
 * Obtiene la URL efectiva del script, priorizando SCRIPT_URL si ya fue reemplazada,
 * o la URL guardada por el usuario en localStorage.
 */
export function getScriptUrl(): string {
  if (SCRIPT_URL && SCRIPT_URL !== "PEGA_AQUI_TU_URL_EXEC") {
    return SCRIPT_URL.trim();
  }
  const custom = localStorage.getItem("bi_script_url");
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return SCRIPT_URL;
}

export function isScriptUrlConfigured(): boolean {
  const url = getScriptUrl();
  return Boolean(url && url !== "PEGA_AQUI_TU_URL_EXEC" && url.startsWith("http"));
}

/**
 * Función central de comunicación con el backend Google Apps Script.
 * - Siempre realiza peticiones POST
 * - Header estricto: Content-Type: text/plain;charset=utf-8
 * - Envía { action, token, ...datos }
 * - Maneja sesion === false borrando el token y lanzando error
 */
export async function api<T = any>(action: string, datos: Record<string, any> = {}): Promise<T> {
  const url = getScriptUrl();

  if (!url || url === "PEGA_AQUI_TU_URL_EXEC") {
    throw new Error(
      "Por favor define la URL de tu Google Apps Script en SCRIPT_URL o mediante el menú de configuración."
    );
  }

  const token = localStorage.getItem("bi_token") || "";

  const payload: Record<string, any> = {
    action,
    token,
    ...datos,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (json.sesion === false) {
      localStorage.removeItem("bi_token");
      window.dispatchEvent(
        new CustomEvent("bi_session_expired", {
          detail: json.error || "La sesión ha expirado o es inválida.",
        })
      );
      throw new Error(json.error || "Sesión expirada. Por favor ingresa nuevamente.");
    }

    if (json.ok === false) {
      throw new Error(json.error || "Error al procesar la solicitud en el servidor.");
    }

    return json as T;
  } catch (error: any) {
    if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
      throw new Error(
        "No se pudo conectar con el Google Apps Script. Verifica la URL de implementación y los permisos de acceso."
      );
    }
    throw error;
  }
}
