import React, { useState, useRef, useEffect } from "react";
import { Prompt, Carpeta } from "../../types";
import { Copy, Check, Star, MoreVertical, Edit2, FolderInput, Trash2 } from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
  carpeta?: Carpeta;
  carpetas: Carpeta[];
  onCopy: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onMoveToFolder: (prompt: Prompt, targetFolderId: string) => void;
  onViewDetail: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  carpeta,
  carpetas,
  onCopy,
  onToggleFavorite,
  onEdit,
  onDelete,
  onMoveToFolder,
  onViewDetail,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowFolderSubmenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(prompt);
  };

  return (
    <div
      onClick={() => onViewDetail(prompt)}
      className="group rounded-2xl p-5 border shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between cursor-pointer relative"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-main)",
      }}
    >
      <div>
        {/* Top: Folder emoji + name & favorite star */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 truncate max-w-[70%]">
            <span>{carpeta?.icono || "📁"}</span>
            <span className="truncate">{carpeta?.nombre || "General"}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                prompt.favorito
                  ? "text-amber-400 hover:text-amber-500"
                  : "text-zinc-400 hover:text-amber-400 opacity-60 group-hover:opacity-100"
              }`}
              title={prompt.favorito ? "Quitar de favoritos" : "Marcar como favorito"}
              aria-label={prompt.favorito ? "Quitar de favoritos" : "Marcar como favorito"}
            >
              <Star
                className="w-4 h-4"
                fill={prompt.favorito ? "currentColor" : "none"}
                strokeWidth={prompt.favorito ? 1 : 2}
              />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2 leading-snug line-clamp-2">
          {prompt.titulo}
        </h3>

        {/* Content (First 4 lines truncated with ...) */}
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-4 font-sans mb-3 break-words whitespace-pre-line">
          {prompt.contenido}
        </p>

        {/* Tags */}
        {prompt.etiquetas && prompt.etiquetas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-4">
            {prompt.etiquetas.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                #{tag}
              </span>
            ))}
            {prompt.etiquetas.length > 4 && (
              <span className="text-[10px] text-zinc-400">
                +{prompt.etiquetas.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar: Action buttons */}
      <div
        className="pt-3 border-t flex items-center justify-between gap-2 mt-auto"
        style={{ borderColor: "var(--border-subtle)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large "📋 Copiar" button */}
        <button
          type="button"
          onClick={handleCopyClick}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
            copied ? "bg-emerald-600 hover:bg-emerald-600" : ""
          }`}
          style={{ backgroundColor: copied ? "#10B981" : "var(--accent)" }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>✓ Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>📋 Copiar</span>
            </>
          )}
        </button>

        {/* Menu "⋯" */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setShowFolderSubmenu(false);
            }}
            className="w-8 h-8 rounded-xl border flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            style={{ borderColor: "var(--border-main)" }}
            aria-label="Más opciones de prompt"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 w-48 rounded-xl shadow-xl border py-1.5 animate-in fade-in zoom-in-95 z-40"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-main)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(prompt);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Editar prompt</span>
              </button>

              {/* Submenu Mover a carpeta */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFolderSubmenu(!showFolderSubmenu)}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FolderInput className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Mover a carpeta</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">›</span>
                </button>

                {showFolderSubmenu && (
                  <div
                    className="absolute left-full bottom-0 ml-1 w-44 rounded-xl shadow-xl border py-1.5 max-h-48 overflow-y-auto z-50 animate-in fade-in"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-main)",
                    }}
                  >
                    {carpetas.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setShowFolderSubmenu(false);
                          if (c.id !== prompt.carpetaId) {
                            onMoveToFolder(prompt, c.id);
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${
                          c.id === prompt.carpetaId ? "font-bold text-purple-600 dark:text-purple-400" : ""
                        }`}
                      >
                        <span>{c.icono}</span>
                        <span className="truncate">{c.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(prompt);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar prompt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
