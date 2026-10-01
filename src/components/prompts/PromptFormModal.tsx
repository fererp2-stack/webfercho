import React, { useState, useEffect, useRef } from "react";
import { Carpeta, Prompt } from "../../types";
import { X, Loader2, Sparkles, FolderPlus, Tag, Plus } from "lucide-react";
import { suggestTitle } from "../../utils/string";

interface PromptFormModalProps {
  isOpen: boolean;
  promptToEdit?: Prompt | null;
  initialContent?: string;
  initialFolderId?: string;
  carpetas: Carpeta[];
  isLoading: boolean;
  onClose: () => void;
  onSave: (promptData: {
    id?: string;
    titulo: string;
    contenido: string;
    carpetaId: string;
    etiquetas: string[];
  }) => void;
  onRequestNewFolder: () => void;
}

export function PromptFormModal({
  isOpen,
  promptToEdit,
  initialContent = "",
  initialFolderId,
  carpetas,
  isLoading,
  onClose,
  onSave,
  onRequestNewFolder,
}: PromptFormModalProps) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [carpetaId, setCarpetaId] = useState("general");
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [hasUserEditedTitle, setHasUserEditedTitle] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inicializar campos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (promptToEdit) {
        setTitulo(promptToEdit.titulo || "");
        setContenido(promptToEdit.contenido || "");
        setCarpetaId(promptToEdit.carpetaId || "general");
        setEtiquetas(promptToEdit.etiquetas || []);
        setHasUserEditedTitle(true);
      } else {
        const text = initialContent || "";
        setContenido(text);
        if (text) {
          setTitulo(suggestTitle(text));
        } else {
          setTitulo("");
        }
        setCarpetaId(initialFolderId && initialFolderId !== "todos" && initialFolderId !== "favoritos" && initialFolderId !== "mas-usados" ? initialFolderId : "general");
        setEtiquetas([]);
        setHasUserEditedTitle(false);
      }
      setTagInput("");
      setIsDirty(false);
    }
  }, [isOpen, promptToEdit, initialContent, initialFolderId]);

  // Si cambia el contenido y el usuario no editó manualmente el título en nuevo prompt
  const handleContenidoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContenido(val);
    setIsDirty(true);
    if (!promptToEdit && !hasUserEditedTitle) {
      setTitulo(suggestTitle(val));
    }
  };

  // Agregar tag
  const addTag = (text: string) => {
    const clean = text.trim().replace(/^#+/, "");
    if (clean && !etiquetas.includes(clean)) {
      setEtiquetas([...etiquetas, clean]);
      setIsDirty(true);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEtiquetas(etiquetas.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  };

  // Manejo de guardar
  const handleSave = () => {
    if (!contenido.trim()) return;
    onSave({
      id: promptToEdit?.id,
      titulo: titulo.trim() || suggestTitle(contenido) || "Prompt sin título",
      contenido: contenido.trim(),
      carpetaId: carpetaId || "general",
      etiquetas,
    });
  };

  // Escape y Ctrl+Enter
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      // Ctrl+Enter o Cmd+Enter para guardar inmediatamente
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
        return;
      }

      if (e.key === "Escape") {
        if (isDirty) {
          if (window.confirm("¿Descartar los cambios sin guardar?")) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty, contenido, titulo, carpetaId, etiquetas, promptToEdit]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={() => {
        if (isDirty) {
          if (window.confirm("¿Descartar los cambios sin guardar?")) onClose();
        } else {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border-main)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <h2 className="font-bold text-base sm:text-lg">
              {promptToEdit ? "Editar Prompt" : "Nuevo Prompt"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
              onClose();
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Título y Carpeta en 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Título <span className="opacity-60 lowercase font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setHasUserEditedTitle(true);
                  setIsDirty(true);
                }}
                placeholder="Nombre o resumen del prompt..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--bg-app)",
                  borderColor: "var(--border-main)",
                  color: "var(--text-main)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Carpeta
              </label>
              <select
                value={carpetaId}
                onChange={(e) => {
                  if (e.target.value === "__NEW_FOLDER__") {
                    onRequestNewFolder();
                  } else {
                    setCarpetaId(e.target.value);
                    setIsDirty(true);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-app)",
                  borderColor: "var(--border-main)",
                  color: "var(--text-main)",
                }}
              >
                {carpetas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono} {c.nombre}
                  </option>
                ))}
                <option value="__NEW_FOLDER__">➕ Crear carpeta nueva...</option>
              </select>
            </div>
          </div>

          {/* Contenido (Textarea) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Contenido del prompt <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                {contenido.length} caracteres
              </span>
            </div>
            <textarea
              ref={textareaRef}
              rows={8}
              required
              autoFocus
              value={contenido}
              onChange={handleContenidoChange}
              placeholder="Escribe o pega aquí el prompt completo..."
              className="w-full px-4 py-3 rounded-xl border text-sm leading-relaxed font-sans transition-all focus:outline-none focus:ring-2 resize-y min-h-[160px]"
              style={{
                backgroundColor: "var(--bg-app)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            />
          </div>

          {/* Etiquetas */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Etiquetas
            </label>
            <div
              className="p-2 rounded-xl border flex flex-wrap items-center gap-1.5 min-h-[46px]"
              style={{
                backgroundColor: "var(--bg-app)",
                borderColor: "var(--border-main)",
              }}
            >
              {etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-purple-950 dark:hover:text-white ml-0.5"
                    aria-label={`Eliminar etiqueta ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) addTag(tagInput);
                  }}
                  placeholder={etiquetas.length === 0 ? "Escribe y pulsa Enter o coma..." : "Añadir más..."}
                  className="w-full bg-transparent text-xs py-1 px-2 focus:outline-none text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: "var(--border-main)", backgroundColor: "var(--bg-card)" }}
        >
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Presiona <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">Ctrl+Enter</kbd> para guardar
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (isDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50"
              style={{
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isLoading || !contenido.trim()}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{promptToEdit ? "Guardar cambios" : "Guardar prompt"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
