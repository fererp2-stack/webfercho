import React, { useState, useEffect, useMemo, useRef } from "react";
import { Prompt, Carpeta } from "../../types";
import { PromptCard } from "./PromptCard";
import { PromptFormModal } from "./PromptFormModal";
import { PromptDetailModal } from "./PromptDetailModal";
import { FolderModal } from "./FolderModal";
import { ConfirmModal } from "../ConfirmModal";
import { SkeletonPromptCard } from "../SkeletonCard";
import { normalizeText, copyToClipboard, suggestTitle } from "../../utils/string";
import { useToast } from "../../context/ToastContext";
import {
  Search,
  Plus,
  Star,
  Clock,
  Layers,
  Edit2,
  Trash2,
  FolderPlus,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";

interface PromptsSectionProps {
  prompts: Prompt[];
  carpetas: Carpeta[];
  isLoading: boolean;
  onSavePrompt: (promptData: {
    id?: string;
    titulo: string;
    contenido: string;
    carpetaId: string;
    etiquetas: string[];
  }) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, currentFav: boolean) => Promise<void>;
  onUsePrompt: (id: string) => Promise<void>;
  onSaveFolder: (folderData: { id?: string; nombre: string; icono: string }) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
}

type SpecialView = "todos" | "favoritos" | "mas-usados";

export function PromptsSection({
  prompts,
  carpetas,
  isLoading,
  onSavePrompt,
  onDeletePrompt,
  onToggleFavorite,
  onUsePrompt,
  onSaveFolder,
  onDeleteFolder,
}: PromptsSectionProps) {
  // Estado de vista actual: o un string de carpeta id, o "todos", "favoritos", "mas-usados"
  const [currentView, setCurrentView] = useState<string>(() => {
    return localStorage.getItem("bi_carpeta") || "todos";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Modales
  const [isPromptFormOpen, setIsPromptFormOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
  const [pastedContent, setPastedContent] = useState("");

  const [selectedPromptForDetail, setSelectedPromptForDetail] = useState<Prompt | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Carpeta | null>(null);

  const [deletePromptTarget, setDeletePromptTarget] = useState<Prompt | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Carpeta | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Guardar vista seleccionada
  useEffect(() => {
    localStorage.setItem("bi_carpeta", currentView);
  }, [currentView]);

  // Tecla "/" para enfocar buscador
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Agregar prompt rápido: Escuchar evento paste global
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      // Ignorar si el usuario está tipeando en un input o textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        isPromptFormOpen ||
        isFolderModalOpen
      ) {
        return;
      }

      const pastedText = e.clipboardData?.getData("text/plain");
      if (pastedText && pastedText.trim().length > 0) {
        e.preventDefault();
        setPromptToEdit(null);
        setPastedContent(pastedText);
        setIsPromptFormOpen(true);
        showToast("Texto detectado desde el portapapeles", "info");
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [isPromptFormOpen, isFolderModalOpen, showToast]);

  // Conteo de prompts por carpeta
  const promptCountsByFolder = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of prompts) {
      counts[p.carpetaId] = (counts[p.carpetaId] || 0) + 1;
    }
    return counts;
  }, [prompts]);

  const favoritesCount = useMemo(() => {
    return prompts.filter((p) => p.favorito).length;
  }, [prompts]);

  // Filtrado y ordenamiento de prompts
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // 1. Filtrar por vista / carpeta
    if (currentView === "favoritos") {
      result = result.filter((p) => p.favorito);
    } else if (currentView === "mas-usados") {
      // Ordenar por usos desc, luego por ultimoUso desc
      result.sort((a, b) => {
        if ((b.usos || 0) !== (a.usos || 0)) {
          return (b.usos || 0) - (a.usos || 0);
        }
        const timeA = a.ultimoUso ? new Date(a.ultimoUso).getTime() : 0;
        const timeB = b.ultimoUso ? new Date(b.ultimoUso).getTime() : 0;
        return timeB - timeA;
      });
    } else if (currentView !== "todos") {
      result = result.filter((p) => p.carpetaId === currentView);
    }

    // Si no es "mas-usados", ordenar los más recientes primero
    if (currentView !== "mas-usados") {
      result.sort((a, b) => {
        const timeA = new Date(a.actualizado || a.fecha).getTime() || 0;
        const timeB = new Date(b.actualizado || b.fecha).getTime() || 0;
        return timeB - timeA;
      });
    }

    // 2. Filtrar por buscador (título, contenido, etiquetas sin tildes ni mayúsculas)
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      result = result.filter((p) => {
        const titleMatch = normalizeText(p.titulo).includes(q);
        const contentMatch = normalizeText(p.contenido).includes(q);
        const tagsMatch = p.etiquetas?.some((tag) => normalizeText(tag).includes(q));
        return titleMatch || contentMatch || tagsMatch;
      });
    }

    return result;
  }, [prompts, currentView, searchQuery]);

  // Copiar prompt
  const handleCopy = async (prompt: Prompt) => {
    const ok = await copyToClipboard(prompt.contenido);
    if (ok) {
      showToast("Prompt copiado al portapapeles", "success");
      // Enviar usarPrompt en segundo plano
      onUsePrompt(prompt.id).catch(() => {});
    } else {
      showToast("No se pudo copiar el texto", "error");
    }
  };

  // Mover a otra carpeta
  const handleMoveToFolder = async (prompt: Prompt, targetFolderId: string) => {
    try {
      await onSavePrompt({
        id: prompt.id,
        titulo: prompt.titulo,
        contenido: prompt.contenido,
        carpetaId: targetFolderId,
        etiquetas: prompt.etiquetas || [],
      });
      const targetFolder = carpetas.find((c) => c.id === targetFolderId);
      showToast(`Prompt movido a ${targetFolder?.nombre || "General"}`, "success");
    } catch (err: any) {
      showToast(err.message || "Error al mover el prompt", "error");
    }
  };

  // Confirmar eliminación de prompt
  const handleConfirmDeletePrompt = async () => {
    if (!deletePromptTarget) return;
    setIsActionLoading(true);
    try {
      await onDeletePrompt(deletePromptTarget.id);
      showToast("Prompt eliminado", "success");
      setDeletePromptTarget(null);
    } catch (err: any) {
      showToast(err.message || "Error al eliminar prompt", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirmar eliminación de carpeta
  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    setIsActionLoading(true);
    try {
      await onDeleteFolder(deleteFolderTarget.id);
      if (currentView === deleteFolderTarget.id) {
        setCurrentView("todos");
      }
      showToast(`Carpeta eliminada. Sus prompts pasaron a General`, "success");
      setDeleteFolderTarget(null);
    } catch (err: any) {
      showToast(err.message || "Error al eliminar carpeta", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-5rem)] pb-20 sm:pb-8">
      {/* ===================== SIDEBAR (ESCRITORIO) / CHIPS (MÓVIL) ===================== */}
      <aside className="w-full lg:w-64 shrink-0 space-y-4">
        {/* Mobile Horizontal Scrolling Chips */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 pt-1 no-scrollbar select-none">
          <button
            onClick={() => setCurrentView("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              currentView === "todos"
                ? "bg-purple-600 text-white border-purple-600"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos</span>
            <span className="opacity-70 tabular-nums">({prompts.length})</span>
          </button>

          <button
            onClick={() => setCurrentView("favoritos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              currentView === "favoritos"
                ? "bg-purple-600 text-white border-purple-600"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
            <span>Favoritos</span>
            <span className="opacity-70 tabular-nums">({favoritesCount})</span>
          </button>

          <button
            onClick={() => setCurrentView("mas-usados")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              currentView === "mas-usados"
                ? "bg-purple-600 text-white border-purple-600"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Más usados</span>
          </button>

          {carpetas.map((c) => (
            <button
              key={c.id}
              onClick={() => setCurrentView(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                currentView === c.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span>{c.icono}</span>
              <span>{c.nombre}</span>
              <span className="opacity-70 tabular-nums">({promptCountsByFolder[c.id] || 0})</span>
            </button>
          ))}
        </div>

        {/* Desktop Sidebar */}
        <div
          className="hidden lg:flex flex-col rounded-2xl p-4 border shadow-sm sticky top-20"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-main)",
          }}
        >
          {/* Header Vistas Especiales */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3 mb-2">
            Vistas
          </div>

          <div className="space-y-1 mb-6">
            <button
              onClick={() => setCurrentView("todos")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === "todos"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Todos</span>
              </div>
              <span className="text-[11px] opacity-70 tabular-nums font-mono">
                {prompts.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentView("favoritos")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === "favoritos"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                <span>⭐ Favoritos</span>
              </div>
              <span className="text-[11px] opacity-70 tabular-nums font-mono">
                {favoritesCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentView("mas-usados")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentView === "mas-usados"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>🕘 Más usados</span>
              </div>
            </button>
          </div>

          {/* Carpetas Header & Nueva Carpeta button */}
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Carpetas
            </span>
            <button
              onClick={() => {
                setFolderToEdit(null);
                setIsFolderModalOpen(true);
              }}
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nueva</span>
            </button>
          </div>

          {/* Carpetas List */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-22rem)] pr-1">
            {carpetas.map((c) => {
              const isSelected = currentView === c.id;
              const count = promptCountsByFolder[c.id] || 0;
              const isGeneral = c.id === "general";

              return (
                <div
                  key={c.id}
                  className={`group/folder flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                  onClick={() => setCurrentView(c.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{c.icono}</span>
                    <span className="truncate">{c.nombre}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Hover actions for folders */}
                    <div className="hidden group-hover/folder:flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToEdit(c);
                          setIsFolderModalOpen(true);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
                        title="Editar carpeta"
                        aria-label="Editar carpeta"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {!isGeneral && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFolderTarget(c);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Eliminar carpeta"
                          aria-label="Eliminar carpeta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] opacity-70 tabular-nums font-mono group-hover/folder:hidden">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick paste helper box in sidebar */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 leading-relaxed px-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              ⚡ Atajo rápido
            </span>
            Pega cualquier texto con <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">Ctrl+V</kbd> para guardarlo al instante.
          </div>
        </div>
      </aside>

      {/* ===================== ÁREA PRINCIPAL ===================== */}
      <main className="flex-1 min-w-0 space-y-5">
        {/* Top Controls: Search Bar & New Prompt Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en prompts (título, contenido, etiquetas)..."
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                /
              </kbd>
            </div>
          </div>

          {/* Botón "+ Nuevo prompt" */}
          <button
            type="button"
            onClick={() => {
              setPromptToEdit(null);
              setPastedContent("");
              setIsPromptFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:opacity-95 active:scale-95 shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Nuevo prompt</span>
          </button>
        </div>

        {/* Info bar of current view */}
        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
              {currentView === "todos"
                ? "Todos los prompts"
                : currentView === "favoritos"
                ? "Prompts favoritos"
                : currentView === "mas-usados"
                ? "Prompts más utilizados"
                : carpetas.find((c) => c.id === currentView)?.nombre || "Carpeta"}
            </span>
            <span>·</span>
            <span className="tabular-nums">
              {filteredPrompts.length} {filteredPrompts.length === 1 ? "prompt" : "prompts"}
            </span>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>

        {/* Content State: Loading, Empty, or Prompts Grid */}
        {isLoading && prompts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
            <SkeletonPromptCard />
          </div>
        ) : filteredPrompts.length === 0 ? (
          /* Empty State */
          <div
            className="rounded-2xl p-12 text-center border shadow-sm flex flex-col items-center justify-center"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-main)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              <ClipboardPaste className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {searchQuery
                ? "No se encontraron prompts con esa búsqueda"
                : "Pega aquí tu primer prompt con Ctrl+V"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-5 leading-relaxed">
              {searchQuery
                ? "Prueba buscando por palabras clave del contenido o revisa las etiquetas."
                : "Puedes pegar texto directamente desde cualquier lugar de la pantalla para guardarlo en 2 clics."}
            </p>
            <button
              type="button"
              onClick={() => {
                setPromptToEdit(null);
                setPastedContent("");
                setIsPromptFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear prompt manualmente</span>
            </button>
          </div>
        ) : (
          /* Prompts Grid (1 col mobile, 2 col tablet, 3 col desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                carpeta={carpetas.find((c) => c.id === prompt.carpetaId)}
                carpetas={carpetas}
                onCopy={handleCopy}
                onToggleFavorite={(p) => onToggleFavorite(p.id, p.favorito)}
                onEdit={(p) => {
                  setPromptToEdit(p);
                  setIsPromptFormOpen(true);
                }}
                onDelete={(p) => setDeletePromptTarget(p)}
                onMoveToFolder={handleMoveToFolder}
                onViewDetail={(p) => setSelectedPromptForDetail(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ===================== MODALES ===================== */}

      {/* Modal Nuevo / Editar Prompt */}
      <PromptFormModal
        isOpen={isPromptFormOpen}
        promptToEdit={promptToEdit}
        initialContent={pastedContent}
        initialFolderId={currentView}
        carpetas={carpetas}
        isLoading={isActionLoading}
        onClose={() => {
          setIsPromptFormOpen(false);
          setPromptToEdit(null);
          setPastedContent("");
        }}
        onSave={async (data) => {
          setIsActionLoading(true);
          try {
            await onSavePrompt(data);
            showToast(promptToEdit ? "Prompt actualizado" : "Prompt guardado", "success");
            setIsPromptFormOpen(false);
            setPromptToEdit(null);
            setPastedContent("");
          } catch (err: any) {
            showToast(err.message || "Error al guardar prompt", "error");
          } finally {
            setIsActionLoading(false);
          }
        }}
        onRequestNewFolder={() => {
          setFolderToEdit(null);
          setIsFolderModalOpen(true);
        }}
      />

      {/* Modal Detalle Prompt */}
      <PromptDetailModal
        prompt={selectedPromptForDetail}
        carpetas={carpetas}
        onClose={() => setSelectedPromptForDetail(null)}
        onCopy={handleCopy}
        onEdit={(p) => {
          setSelectedPromptForDetail(null);
          setPromptToEdit(p);
          setIsPromptFormOpen(true);
        }}
        onDelete={(p) => {
          setSelectedPromptForDetail(null);
          setDeletePromptTarget(p);
        }}
      />

      {/* Modal Nueva / Editar Carpeta */}
      <FolderModal
        isOpen={isFolderModalOpen}
        folderToEdit={folderToEdit}
        isLoading={isActionLoading}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        onSave={async (data) => {
          setIsActionLoading(true);
          try {
            await onSaveFolder(data);
            showToast(folderToEdit ? "Carpeta actualizada" : "Carpeta creada", "success");
            setIsFolderModalOpen(false);
            setFolderToEdit(null);
          } catch (err: any) {
            showToast(err.message || "Error al guardar carpeta", "error");
          } finally {
            setIsActionLoading(false);
          }
        }}
      />

      {/* Confirmar eliminar prompt */}
      <ConfirmModal
        isOpen={Boolean(deletePromptTarget)}
        title="¿Eliminar este prompt?"
        message={`Se eliminará permanentemente "${deletePromptTarget?.titulo}". Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isActionLoading}
        onConfirm={handleConfirmDeletePrompt}
        onCancel={() => setDeletePromptTarget(null)}
      />

      {/* Confirmar eliminar carpeta */}
      <ConfirmModal
        isOpen={Boolean(deleteFolderTarget)}
        title={`¿Eliminar carpeta "${deleteFolderTarget?.nombre}"?`}
        message="Sus prompts pasarán a la carpeta General."
        confirmText="Eliminar y mover prompts"
        isLoading={isActionLoading}
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => setDeleteFolderTarget(null)}
      />
    </div>
  );
}
