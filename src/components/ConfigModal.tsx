import React, { useState, useEffect } from "react";
import { SCRIPT_URL, getScriptUrl } from "../api";
import { X, Check, Globe, HelpCircle, ExternalLink } from "lucide-react";
import { useToast } from "../context/ToastContext";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ConfigModal({ isOpen, onClose, onSaved }: ConfigModalProps) {
  const [url, setUrl] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setUrl(getScriptUrl() === "PEGA_AQUI_TU_URL_EXEC" ? "" : getScriptUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = url.trim();
    if (trimmed.length > 0 && !trimmed.startsWith("http")) {
      showToast("La URL debe comenzar con https://script.google.com/...", "error");
      return;
    }
    if (trimmed) {
      localStorage.setItem("bi_script_url", trimmed);
      showToast("URL de Google Apps Script guardada", "success");
    } else {
      localStorage.removeItem("bi_script_url");
      showToast("Se restableció la URL del código", "info");
    }
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-main)" }}>
          <div className="flex items-center gap-2 font-bold text-base">
            <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Configuración de Google Apps Script</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--text-main)" }}>
              URL de la aplicación web (exec)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--bg-app)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            />
            <p className="mt-1.5 text-zinc-500 leading-relaxed">
              En tu Google Apps Script: haz clic en <strong>Implementar &gt; Nueva implementación &gt; Tipo: Aplicación web</strong>. Configura <em>Acceso: Cualquier usuario</em> (para permitir peticiones CORS) y copia la URL terminada en <code>/exec</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-1.5 text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Acerca de la constante SCRIPT_URL</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              También puedes definir la constante <code>SCRIPT_URL = "https://script.google.com/macros/s/.../exec"</code> directamente en <code>src/api.ts</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border-main)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
            style={{
              borderColor: "var(--border-main)",
              color: "var(--text-main)",
            }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Check className="w-4 h-4" />
            <span>Guardar URL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
