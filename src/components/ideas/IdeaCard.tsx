import React, { useState } from "react";
import { Idea, IdeaCategory } from "../../types";
import { formatRelativeDate } from "../../utils/date";
import { Play, FileText, ExternalLink, Image as ImageIcon } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  onClick: (idea: Idea) => void;
}

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const [imgError, setImgError] = useState(false);

  // Colores de fondo suaves para ideas de solo texto según su categoría
  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Inspiración":
        return "bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-100";
      case "Diseño":
        return "bg-violet-50/80 dark:bg-violet-950/25 border-violet-200/80 dark:border-violet-900/40 text-violet-900 dark:text-violet-100";
      case "Contenido":
        return "bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-100";
      case "Negocio":
        return "bg-sky-50/80 dark:bg-sky-950/25 border-sky-200/80 dark:border-sky-900/40 text-sky-900 dark:text-sky-100";
      case "Personal":
        return "bg-rose-50/80 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-100";
      default:
        return "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100";
    }
  };

  const isTextOnly = idea.tipo === "texto" || (!idea.miniatura && !idea.vistaPrevia && idea.tipo !== "video" && idea.tipo !== "documento");

  return (
    <div
      onClick={() => onClick(idea)}
      className={`masonry-card group rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isTextOnly ? getCategoryStyles(idea.categoria) : ""
      }`}
      style={{
        backgroundColor: isTextOnly ? undefined : "var(--bg-card)",
        borderColor: isTextOnly ? undefined : "var(--border-main)",
      }}
    >
      {/* Media Header */}
      {idea.tipo === "imagen" && (idea.miniatura || idea.vistaPrevia) && !imgError && (
        <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 max-h-96">
          <img
            src={idea.miniatura || idea.vistaPrevia}
            alt={idea.titulo || "Imagen de idea"}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Video Indicator */}
      {idea.tipo === "video" && (
        <div className="relative aspect-video bg-zinc-900 flex items-center justify-center text-white overflow-hidden group">
          {idea.miniatura && !imgError ? (
            <img
              src={idea.miniatura}
              alt={idea.titulo}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
              onError={() => setImgError(true)}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Document / Other Icon */}
      {(idea.tipo === "documento" || idea.tipo === "otro") && (
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block">
              {idea.tipo === "documento" ? "Documento" : "Archivo adjunto"}
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate block">
              Vista previa disponible
            </span>
          </div>
        </div>
      )}

      {/* Card Details */}
      <div className="p-4 space-y-2">
        {/* Category & Date */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-[11px] tracking-wide text-purple-600 dark:text-purple-400">
            {idea.categoria}
          </span>
          <span className="text-[11px] tabular-nums">
            {formatRelativeDate(idea.fecha)}
          </span>
        </div>

        {/* Title */}
        {idea.titulo && (
          <h4 className="font-bold text-sm leading-snug text-zinc-900 dark:text-zinc-100">
            {idea.titulo}
          </h4>
        )}

        {/* Note snippet */}
        {idea.nota && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-4 leading-relaxed font-sans whitespace-pre-line">
            {idea.nota}
          </p>
        )}

        {/* Link indicator */}
        {idea.enlace && (
          <div className="pt-2 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{idea.enlace.replace(/^https?:\/\//, "")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
