import React, { useState } from "react";
import { Eye, EyeOff, Lightbulb, Lock, Mail, Loader2, Sparkles, Settings } from "lucide-react";
import { api, getScriptUrl, isScriptUrlConfigured } from "../api";
import { useToast } from "../context/ToastContext";

interface LoginProps {
  onSuccess: (correo: string) => void;
  onOpenConfig?: () => void;
}

export function Login({ onSuccess, onOpenConfig }: LoginProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { showToast } = useToast();
  const scriptConfigured = isScriptUrlConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contrasena) {
      setErrorMessage("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api<{ ok: boolean; token: string; correo: string }>("login", {
        correo: correo.trim(),
        contrasena,
      });

      if (res.token) {
        localStorage.setItem("bi_token", res.token);
        localStorage.setItem("bi_correo", res.correo || correo.trim());
        showToast("¡Bienvenido al Banco de Ideas!", "success");
        onSuccess(res.correo || correo.trim());
      } else {
        throw new Error("Respuesta de inicio de sesión no válida.");
      }
    } catch (err: any) {
      const msg = err.message || "Credenciales incorrectas o error en el servidor.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto">
        {/* Brand identity card */}
        <div
          className="rounded-2xl p-8 sm:p-10 shadow-lg border transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-main)",
          }}
        >
          {/* Header & Logo */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-sm"
              style={{
                backgroundColor: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              <Lightbulb className="w-8 h-8" strokeWidth={2.2} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Banco de Ideas</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Tu espacio personal para recopilar ideas visuales y prompts organizados.
            </p>
          </div>

          {/* Script URL Warning if not configured */}
          {!scriptConfigured && (
            <div
              className="mb-6 p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            >
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">Google Apps Script no configurado</span>
                Define tu <code>SCRIPT_URL</code> en el código o configúrala aquí.
              </div>
              {onOpenConfig && (
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Configurar
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="correo"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="correo"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg-app)",
                    borderColor: "var(--border-main)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="contrasena"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg-app)",
                    borderColor: "var(--border-main)",
                    color: "var(--text-main)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 leading-relaxed animate-in fade-in"
              >
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-60 shadow-sm active:scale-[0.99] cursor-pointer"
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          {/* Footer configuration link */}
          <div className="mt-6 pt-5 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--border-main)", color: "var(--text-muted)" }}>
            <span>Uso personal</span>
            {onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="inline-flex items-center gap-1.5 hover:underline transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar Apps Script</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
