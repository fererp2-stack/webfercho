import React, { useState } from "react";
import { Prompt, Carpeta } from "../../types";
import { X, Copy, Check, Edit2, Trash2, Clock, Sparkles } from "lucide-react";
import { formatRelativeDate } from "../../utils/date";

interface PromptDetailModalProps {
  prompt: Prompt | null;
  carpetas: Carpeta[];
  onClose: () => void;
  onCopy: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
}

export function PromptDetailModal({
  prompt,
  carpetas,
  onClose,
  onCopy,
  onEdit,
  onDelete,
}: PromptDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const carpeta = carpetas.find((c) => c.id === prompt.carpetaId);

  const handleCopyClick = () => {
    onCopy(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-6 border-b shrink-0 gap-4"
          style={{ borderColor: "var(--border-main)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1.5">
              <span>{carpeta?.icono || "📁"}</span>
              <span>{carpeta?.nombre || "General"}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeDate(prompt.actualizado || prompt.fecha)}
              </span>
              <span>·</span>
              <span className="tabular-nums font-mono text-[11px]">
                {prompt.usos || 0} {prompt.usos === 1 ? "uso" : "usos"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold leading-tight break-words">
              {prompt.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-sans select-text select-all"
            style={{
              backgroundColor: "var(--bg-app)",
              borderColor: "var(--border-main)",
              color: "var(--text-main)",
            }}
          >
            {prompt.contenido}
          </div>

          {/* Tags */}
          {prompt.etiquetas && prompt.etiquetas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {prompt.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0 gap-3"
          style={{ borderColor: "var(--border-main)", backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(prompt);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              style={{ borderColor: "var(--border-main)" }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete(prompt);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>

          <button
            onClick={handleCopyClick}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95 ${
              copied ? "bg-emerald-600 hover:bg-emerald-600" : ""
            }`}
            style={{ backgroundColor: copied ? "#10B981" : "var(--accent)" }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>✓ Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 Copiar prompt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
