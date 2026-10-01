import React, { useState, useEffect } from "react";
import { Carpeta } from "../../types";
import { X, Loader2, FolderPlus, FolderEdit } from "lucide-react";

interface FolderModalProps {
  isOpen: boolean;
  folderToEdit?: Carpeta | null;
  isLoading: boolean;
  onClose: () => void;
  onSave: (folderData: { id?: string; nombre: string; icono: string }) => void;
}

const EMOJI_OPTIONS = [
  "📁", "▶️", "🎵", "🎬", "🖼️", "✍️",
  "📸", "🎨", "💼", "📈", "🛍️", "🎙️",
  "🧠", "💡", "🔥", "⭐", "🎯", "📚",
  "🤖", "🌐", "📱", "🎮", "🍔", "✈️"
];

export function FolderModal({
  isOpen,
  folderToEdit,
  isLoading,
  onClose,
  onSave,
}: FolderModalProps) {
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState("📁");

  useEffect(() => {
    if (isOpen) {
      if (folderToEdit) {
        setNombre(folderToEdit.nombre || "");
        setIcono(folderToEdit.icono || "📁");
      } else {
        setNombre("");
        setIcono("📁");
      }
    }
  }, [isOpen, folderToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({
      id: folderToEdit?.id,
      nombre: nombre.trim(),
      icono,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-main)" }}>
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
            {folderToEdit ? (
              <>
                <FolderEdit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Editar carpeta</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Nueva carpeta</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Nombre de la carpeta
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Marketing, Programación..."
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--bg-app)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Elige un icono
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50" style={{ borderColor: "var(--border-main)" }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcono(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                    icono === emoji
                      ? "ring-2 ring-purple-500 bg-white dark:bg-zinc-800 shadow-sm scale-105"
                      : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border-main)" }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50"
              style={{
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !nombre.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{folderToEdit ? "Guardar cambios" : "Crear carpeta"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
