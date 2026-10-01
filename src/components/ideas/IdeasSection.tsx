import React, { useState, useEffect, useRef, useMemo } from "react";
import { Idea, IdeaCategory, FileData } from "../../types";
import { IdeaCard } from "./IdeaCard";
import { IdeaDetailModal } from "./IdeaDetailModal";
import { ConfirmModal } from "../ConfirmModal";
import { SkeletonIdeaCard } from "../SkeletonCard";
import { processImageFile, processGenericFile, normalizeText } from "../../utils/string";
import { useToast } from "../../context/ToastContext";
import {
  UploadCloud,
  File,
  X,
  Link as LinkIcon,
  Search,
  Plus,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface IdeasSectionProps {
  ideas: Idea[];
  isLoading: boolean;
  onAddIdea: (ideaData: {
    titulo: string;
    nota: string;
    categoria: string;
    enlace?: string;
    archivo?: FileData;
  }) => Promise<void>;
  onDeleteIdea: (id: string) => Promise<void>;
}

const CATEGORIAS: IdeaCategory[] = [
  "Inspiración",
  "Diseño",
  "Contenido",
  "Negocio",
  "Personal",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function IdeasSection({
  ideas,
  isLoading,
  onAddIdea,
  onDeleteIdea,
}: IdeasSectionProps) {
  // Formulario
  const [titulo, setTitulo] = useState("");
  const [nota, setNota] = useState("");
  const [categoria, setCategoria] = useState<IdeaCategory>("Inspiración");
  const [enlace, setEnlace] = useState("");

  // Archivo adjunto
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    base64: string;
    mimeType: string;
    previewUrl?: string;
  } | null>(null);

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  // Filtrado y Búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Todas");

  // Modales
  const [selectedIdeaForDetail, setSelectedIdeaForDetail] = useState<Idea | null>(null);
  const [deleteIdeaTarget, setDeleteIdeaTarget] = useState<Idea | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Procesar archivo recibido (imagen o genérico)
  const handleIncomingFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast("El archivo supera el límite de 20 MB permitido.", "error");
      return;
    }

    setIsProcessingFile(true);
    try {
      if (file.type.startsWith("image/")) {
        const { base64, mimeType, previewUrl } = await processImageFile(file);
        setSelectedFile({
          file,
          base64,
          mimeType,
          previewUrl,
        });
        showToast("Imagen lista y optimizada para subir", "info");
      } else {
        const { base64, mimeType } = await processGenericFile(file);
        setSelectedFile({
          file,
          base64,
          mimeType,
          previewUrl: undefined,
        });
        showToast(`Archivo "${file.name}" adjunto`, "info");
      }
    } catch (err: any) {
      showToast(err.message || "Error al procesar el archivo", "error");
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Escuchar paste global para capturar archivos en pestaña Ideas
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        selectedIdeaForDetail
      ) {
        return;
      }

      if (e.clipboardData?.items) {
        const items = Array.from(e.clipboardData.items);
        const fileItem = items.find((item) => item.kind === "file");
        if (fileItem) {
          const file = fileItem.getAsFile();
          if (file) {
            e.preventDefault();
            handleIncomingFile(file);
            return;
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectedIdeaForDetail]);

  // Arrastrar y soltar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleIncomingFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFile(e.target.files[0]);
    }
  };

  // Guardar idea
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() && !nota.trim() && !selectedFile) {
      showToast("Agrega un título, una nota o un archivo para guardar la idea.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let archivoPayload: FileData | undefined = undefined;
      if (selectedFile) {
        archivoPayload = {
          base64: selectedFile.base64,
          mimeType: selectedFile.mimeType,
          nombre: selectedFile.file.name,
        };
      }

      await onAddIdea({
        titulo: titulo.trim() || (selectedFile ? selectedFile.file.name : "Idea sin título"),
        nota: nota.trim(),
        categoria,
        enlace: enlace.trim() || undefined,
        archivo: archivoPayload,
      });

      // Limpiar formulario
      setTitulo("");
      setNota("");
      setCategoria("Inspiración");
      setEnlace("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Idea guardada con éxito", "success");
    } catch (err: any) {
      showToast(err.message || "Error al guardar la idea", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar eliminación de idea
  const handleConfirmDelete = async () => {
    if (!deleteIdeaTarget) return;
    setIsDeleteLoading(true);
    try {
      await onDeleteIdea(deleteIdeaTarget.id);
      showToast("Idea eliminada correctamente", "success");
      setDeleteIdeaTarget(null);
    } catch (err: any) {
      showToast(err.message || "Error al eliminar la idea", "error");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Filtrado de ideas en el navegador
  const filteredIdeas = useMemo(() => {
    let list = [...ideas];

    // Ordenar más recientes primero
    list.sort((a, b) => {
      const timeA = new Date(a.fecha).getTime() || 0;
      const timeB = new Date(b.fecha).getTime() || 0;
      return timeB - timeA;
    });

    // Categoría
    if (selectedCategoryFilter !== "Todas") {
      list = list.filter((i) => i.categoria === selectedCategoryFilter);
    }

    // Buscador por título y nota
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      list = list.filter((i) => {
        const titleMatch = normalizeText(i.titulo || "").includes(q);
        const noteMatch = normalizeText(i.nota || "").includes(q);
        return titleMatch || noteMatch;
      });
    }

    return list;
  }, [ideas, selectedCategoryFilter, searchQuery]);

  return (
    <div className="space-y-8 pb-20 sm:pb-8">
      {/* ===================== ZONA AGREGAR IDEA (ARRIBA) ===================== */}
      <section
        className="rounded-2xl border shadow-sm transition-all overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-main)",
        }}
      >
        {/* Toggle Bar for Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b cursor-pointer select-none"
          style={{ borderColor: "var(--border-main)" }}
          onClick={() => setIsFormExpanded(!isFormExpanded)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💡</span>
            <span className="font-bold text-sm sm:text-base">Capturar nueva idea</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">Pega con Ctrl+V desde cualquier lugar</span>
            {isFormExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isFormExpanded && (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Zona Dropzone grande con borde punteado */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
                isDragging
                  ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                  : selectedFile
                  ? "border-purple-400 bg-zinc-50/60 dark:bg-zinc-900/40"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-600 bg-zinc-50/40 dark:bg-zinc-900/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Optimizando archivo...
                  </span>
                </div>
              ) : selectedFile ? (
                <div
                  className="flex items-center gap-4 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedFile.previewUrl ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border shrink-0 bg-black/10">
                      <img
                        src={selectedFile.previewUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                      <File className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.mimeType}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Quitar archivo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm"
                    style={{ backgroundColor: "var(--accent-light)" }}
                  >
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Pega con Ctrl+V, arrastra o elige un archivo
                  </p>
                  <p className="text-xs text-zinc-500">
                    Imágenes (máx 1600px optimizadas), videos, PDF o documentos (máx 20 MB).
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border-main)" }}
                  >
                    Elegir archivo
                  </button>
                </div>
              )}
            </div>

            {/* Campos de texto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Título de la idea o concepto..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--bg-app)",
                    borderColor: "var(--border-main)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as IdeaCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-app)",
                      borderColor: "var(--border-main)",
                      color: "var(--text-main)",
                    }}
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Enlace web <span className="opacity-60 lowercase font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="url"
                      value={enlace}
                      onChange={(e) => setEnlace(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: "var(--bg-app)",
                        borderColor: "var(--border-main)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Nota o reflexión <span className="opacity-60 lowercase font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escribe tus notas, contexto o por qué guardas esta idea..."
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 leading-relaxed resize-y"
                style={{
                  backgroundColor: "var(--bg-app)",
                  borderColor: "var(--border-main)",
                  color: "var(--text-main)",
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-zinc-500">
                La idea puede ser solo texto sin archivo.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || isProcessingFile}
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando idea...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Guardar idea</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ===================== FILTROS Y BUSCADOR DEL MURO ===================== */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Buscador de ideas */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el muro (título o notas)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-main)",
                color: "var(--text-main)",
              }}
            />
          </div>

          {/* Chips de Categorías: Todas + 5 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
            {["Todas", ...CATEGORIAS].map((cat) => {
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-300"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count info */}
        <div className="text-xs text-zinc-500 px-1">
          Mostrando {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"}
          {selectedCategoryFilter !== "Todas" && ` en ${selectedCategoryFilter}`}
        </div>
      </section>

      {/* ===================== MURO TIPO PINTEREST (MASONRY) ===================== */}
      {isLoading && ideas.length === 0 ? (
        <div className="ideas-masonry">
          <SkeletonIdeaCard height="h-72" />
          <SkeletonIdeaCard height="h-56" />
          <SkeletonIdeaCard height="h-80" />
          <SkeletonIdeaCard height="h-64" />
          <SkeletonIdeaCard height="h-60" />
          <SkeletonIdeaCard height="h-72" />
        </div>
      ) : filteredIdeas.length === 0 ? (
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
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {searchQuery
              ? "No se encontraron ideas con esa búsqueda"
              : "Tu muro de ideas está vacío"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-4 leading-relaxed">
            {searchQuery
              ? "Intenta con otras palabras clave o cambia la categoría filtrada."
              : "Pega una imagen con Ctrl+V o redacta una idea en la zona superior para comenzar tu colección visual."}
          </p>
        </div>
      ) : (
        <div className="ideas-masonry">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onClick={(i) => setSelectedIdeaForDetail(i)}
            />
          ))}
        </div>
      )}

      {/* Modal Detalle de Idea */}
      <IdeaDetailModal
        idea={selectedIdeaForDetail}
        onClose={() => setSelectedIdeaForDetail(null)}
        onDelete={(idea) => {
          setSelectedIdeaForDetail(null);
          setDeleteIdeaTarget(idea);
        }}
      />

      {/* Confirmar eliminar Idea */}
      <ConfirmModal
        isOpen={Boolean(deleteIdeaTarget)}
        title="¿Eliminar esta idea?"
        message={`Se eliminará "${deleteIdeaTarget?.titulo || "esta idea"}". Si tiene un archivo asociado en Google Drive también será removido.`}
        confirmText="Eliminar idea"
        isLoading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteIdeaTarget(null)}
      />
    </div>
  );
}
