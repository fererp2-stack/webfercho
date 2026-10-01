import React from "react";
import { Idea } from "../../types";
import { X, ExternalLink, Trash2, Calendar, HardDrive, FileText, Play } from "lucide-react";
import { formatRelativeDate } from "../../utils/date";

interface IdeaDetailModalProps {
  idea: Idea | null;
  onClose: () => void;
  onDelete: (idea: Idea) => void;
}

export function IdeaDetailModal({ idea, onClose, onDelete }: IdeaDetailModalProps) {
  if (!idea) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0 gap-4"
          style={{ borderColor: "var(--border-main)" }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {idea.categoria}
            </span>
            <span>·</span>
            <span className="text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeDate(idea.fecha)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Media View (Image, Video, or Doc Iframe) */}
          {idea.tipo === "imagen" && (idea.vistaPrevia || idea.miniatura) && (
            <div className="rounded-xl overflow-hidden border bg-zinc-950/5 dark:bg-zinc-900/60 flex items-center justify-center max-h-[60vh]">
              <img
                src={idea.vistaPrevia || idea.miniatura}
                alt={idea.titulo || "Imagen de la idea"}
                className="max-h-[60vh] w-auto max-w-full object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {idea.tipo === "video" && idea.vistaPrevia && (
            <div className="rounded-xl overflow-hidden border aspect-video bg-black">
              <iframe
                src={idea.vistaPrevia}
                title={idea.titulo || "Video"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {(idea.tipo === "documento" || idea.tipo === "otro") && idea.vistaPrevia && (
            <div className="rounded-xl overflow-hidden border h-96 bg-zinc-100 dark:bg-zinc-900">
              <iframe
                src={idea.vistaPrevia}
                title={idea.titulo || "Documento"}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Title */}
          {idea.titulo && (
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
              {idea.titulo}
            </h2>
          )}

          {/* Note content */}
          {idea.nota && (
            <div
              className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-sans"
              style={{
                backgroundColor: "var(--bg-app)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            >
              {idea.nota}
            </div>
          )}

          {/* External Link */}
          {idea.enlace && (
            <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40" style={{ borderColor: "var(--border-main)" }}>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-bold text-zinc-400 block mb-0.5">
                  Enlace de referencia
                </span>
                <a
                  href={idea.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline truncate block"
                >
                  {idea.enlace}
                </a>
              </div>
              <a
                href={idea.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-colors shrink-0"
                title="Abrir enlace"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0 gap-3"
          style={{ borderColor: "var(--border-main)", backgroundColor: "var(--bg-card)" }}
        >
          {/* Eliminar botón */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(idea);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar idea</span>
          </button>

          {/* Abrir en Drive (si existe el enlace abrir) */}
          <div className="flex items-center gap-2">
            {idea.abrir && (
              <a
                href={idea.abrir}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                style={{ borderColor: "var(--border-main)" }}
              >
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Abrir en Drive</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
