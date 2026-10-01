import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { Header } from "./components/Header";
import { Login } from "./components/Login";
import { PromptsSection } from "./components/prompts/PromptsSection";
import { IdeasSection } from "./components/ideas/IdeasSection";
import { ConfigModal } from "./components/ConfigModal";
import { api, isScriptUrlConfigured, getScriptUrl } from "./api";
import { Idea, Prompt, Carpeta, FileData } from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

// Datos iniciales de reserva mientras carga o para demostración si general no existe
const DEFAULT_GENERAL_FOLDER: Carpeta = {
  id: "general",
  nombre: "General",
  icono: "📁",
  orden: 0,
};

function MainApp() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("bi_token"));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem("bi_correo") || "");
  const [activeTab, setActiveTab] = useState<"ideas" | "prompts">(() => {
    const saved = localStorage.getItem("bi_tab");
    return saved === "prompts" ? "prompts" : "ideas";
  });

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [carpetas, setCarpetas] = useState<Carpeta[]>([DEFAULT_GENERAL_FOLDER]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const { showToast } = useToast();

  // Guardar pestaña activa
  const handleTabChange = (tab: "ideas" | "prompts") => {
    setActiveTab(tab);
    localStorage.setItem("bi_tab", tab);
  };

  // Cargar datos desde Google Apps Script
  const fetchDatos = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoadingData(true);
    else setIsSyncing(true);
    setDataError(null);

    try {
      const res = await api<{
        ok: boolean;
        ideas: Idea[];
        prompts: Prompt[];
        carpetas: Carpeta[];
      }>("datos");

      if (res) {
        if (Array.isArray(res.ideas)) {
          setIdeas(res.ideas);
        }
        if (Array.isArray(res.prompts)) {
          setPrompts(res.prompts);
        }
        if (Array.isArray(res.carpetas)) {
          // Asegurar que la carpeta "general" siempre exista
          const hasGeneral = res.carpetas.some((c) => c.id === "general");
          const mergedCarpetas = hasGeneral
            ? res.carpetas
            : [DEFAULT_GENERAL_FOLDER, ...res.carpetas];
          setCarpetas(mergedCarpetas);
        }
      }
    } catch (err: any) {
      console.error("Error al cargar datos:", err);
      setDataError(err.message || "Error al sincronizar con el backend.");
      if (isInitial) {
        showToast(err.message || "Error al cargar datos", "error");
      }
    } finally {
      setIsLoadingData(false);
      setIsSyncing(false);
    }
  }, [showToast]);

  // Si hay token al iniciar, cargar datos
  useEffect(() => {
    if (token) {
      fetchDatos(true);
    }
  }, [token, fetchDatos]);

  // Escuchar evento de expiración de sesión
  useEffect(() => {
    function handleSessionExpired(e: CustomEvent) {
      setToken(null);
      setUserEmail("");
      showToast(e.detail || "Tu sesión ha expirado", "error");
    }

    window.addEventListener("bi_session_expired" as any, handleSessionExpired);
    return () => window.removeEventListener("bi_session_expired" as any, handleSessionExpired);
  }, [showToast]);

  // Manejo de Logout
  const handleLogout = async () => {
    try {
      await api("logout", {});
    } catch (err) {
      // Ignorar error al salir
    } finally {
      localStorage.removeItem("bi_token");
      setToken(null);
      setUserEmail("");
      showToast("Sesión cerrada", "info");
    }
  };

  // ==================== ACCIONES DE PROMPTS ====================

  const handleSavePrompt = async (promptData: {
    id?: string;
    titulo: string;
    contenido: string;
    carpetaId: string;
    etiquetas: string[];
  }) => {
    const isEditing = Boolean(promptData.id);
    const now = new Date().toISOString();

    // Actualización optimista local inmediata
    if (isEditing) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === promptData.id
            ? {
                ...p,
                titulo: promptData.titulo,
                contenido: promptData.contenido,
                carpetaId: promptData.carpetaId,
                etiquetas: promptData.etiquetas,
                actualizado: now,
              }
            : p
        )
      );
    } else {
      const tempId = "temp_" + Date.now();
      const newPrompt: Prompt = {
        id: tempId,
        titulo: promptData.titulo,
        contenido: promptData.contenido,
        carpetaId: promptData.carpetaId,
        etiquetas: promptData.etiquetas,
        fecha: now,
        actualizado: now,
        favorito: false,
        usos: 0,
        ultimoUso: null,
      };
      setPrompts((prev) => [newPrompt, ...prev]);
    }

    // Petición al backend
    const res = await api<{ ok: boolean; id: string }>("guardarPrompt", promptData);

    // Sincronizar en segundo plano
    fetchDatos(false);
  };

  const handleDeletePrompt = async (id: string) => {
    // Optimista
    const prev = [...prompts];
    setPrompts((curr) => curr.filter((p) => p.id !== id));

    try {
      await api("eliminarPrompt", { id });
      fetchDatos(false);
    } catch (err) {
      setPrompts(prev); // Revertir si falla
      throw err;
    }
  };

  const handleToggleFavorite = async (id: string, currentFav: boolean) => {
    const newFav = !currentFav;
    // Optimista
    setPrompts((curr) =>
      curr.map((p) => (p.id === id ? { ...p, favorito: newFav } : p))
    );

    try {
      await api("favoritoPrompt", { id, favorito: newFav });
    } catch (err) {
      // Revertir
      setPrompts((curr) =>
        curr.map((p) => (p.id === id ? { ...p, favorito: currentFav } : p))
      );
      showToast("No se pudo actualizar el favorito", "error");
    }
  };

  const handleUsePrompt = async (id: string) => {
    const now = new Date().toISOString();
    // Optimista
    setPrompts((curr) =>
      curr.map((p) =>
        p.id === id ? { ...p, usos: (p.usos || 0) + 1, ultimoUso: now } : p
      )
    );

    try {
      await api("usarPrompt", { id });
    } catch (err) {
      // Background silencioso
    }
  };

  const handleSaveFolder = async (folderData: {
    id?: string;
    nombre: string;
    icono: string;
  }) => {
    const isEditing = Boolean(folderData.id);

    // Optimista
    if (isEditing) {
      setCarpetas((prev) =>
        prev.map((c) =>
          c.id === folderData.id
            ? { ...c, nombre: folderData.nombre, icono: folderData.icono }
            : c
        )
      );
    } else {
      const tempId = "temp_folder_" + Date.now();
      const newFolder: Carpeta = {
        id: tempId,
        nombre: folderData.nombre,
        icono: folderData.icono,
        orden: carpetas.length,
      };
      setCarpetas((prev) => [...prev, newFolder]);
    }

    await api("guardarCarpeta", folderData);
    fetchDatos(false);
  };

  const handleDeleteFolder = async (id: string) => {
    const prevCarpetas = [...carpetas];
    const prevPrompts = [...prompts];

    // Optimista: mover prompts de esa carpeta a "general" y remover la carpeta
    setPrompts((curr) =>
      curr.map((p) => (p.carpetaId === id ? { ...p, carpetaId: "general" } : p))
    );
    setCarpetas((curr) => curr.filter((c) => c.id !== id));

    try {
      await api("eliminarCarpeta", { id });
      fetchDatos(false);
    } catch (err) {
      setCarpetas(prevCarpetas);
      setPrompts(prevPrompts);
      throw err;
    }
  };

  // ==================== ACCIONES DE IDEAS ====================

  const handleAddIdea = async (ideaData: {
    titulo: string;
    nota: string;
    categoria: string;
    enlace?: string;
    archivo?: FileData;
  }) => {
    const tempId = "temp_idea_" + Date.now();
    const now = new Date().toISOString();

    let tipoCalculado: Idea["tipo"] = "texto";
    if (ideaData.archivo) {
      const mime = ideaData.archivo.mimeType;
      if (mime.startsWith("image/")) tipoCalculado = "imagen";
      else if (mime.startsWith("video/")) tipoCalculado = "video";
      else if (mime.includes("pdf") || mime.includes("document") || mime.includes("text"))
        tipoCalculado = "documento";
      else tipoCalculado = "otro";
    }

    const optimisticIdea: Idea = {
      id: tempId,
      fecha: now,
      titulo: ideaData.titulo,
      nota: ideaData.nota,
      categoria: ideaData.categoria,
      enlace: ideaData.enlace,
      tipo: tipoCalculado,
      miniatura: ideaData.archivo?.base64
        ? `data:${ideaData.archivo.mimeType};base64,${ideaData.archivo.base64}`
        : undefined,
    };

    setIdeas((prev) => [optimisticIdea, ...prev]);

    try {
      await api("agregarIdea", ideaData);
      fetchDatos(false);
    } catch (err) {
      setIdeas((curr) => curr.filter((i) => i.id !== tempId));
      throw err;
    }
  };

  const handleDeleteIdea = async (id: string) => {
    const prevIdeas = [...ideas];
    setIdeas((curr) => curr.filter((i) => i.id !== id));

    try {
      await api("eliminarIdea", { id });
      fetchDatos(false);
    } catch (err) {
      setIdeas(prevIdeas);
      throw err;
    }
  };

  // Si no hay token guardado, mostrar pantalla de ingreso centrada
  if (!token) {
    return (
      <>
        <Login
          onSuccess={(email) => {
            setUserEmail(email);
            setToken(localStorage.getItem("bi_token"));
          }}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabecera Fija */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userEmail={userEmail}
        onLogout={handleLogout}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* Banner de error de sincronización si ocurre */}
        {dataError && (
          <div className="mb-6 p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{dataError}</span>
            </div>
            <button
              onClick={() => fetchDatos(true)}
              className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/60 hover:bg-red-200 font-semibold cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Sección Activa */}
        {activeTab === "prompts" ? (
          <PromptsSection
            prompts={prompts}
            carpetas={carpetas}
            isLoading={isLoadingData}
            onSavePrompt={handleSavePrompt}
            onDeletePrompt={handleDeletePrompt}
            onToggleFavorite={handleToggleFavorite}
            onUsePrompt={handleUsePrompt}
            onSaveFolder={handleSaveFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        ) : (
          <IdeasSection
            ideas={ideas}
            isLoading={isLoadingData}
            onAddIdea={handleAddIdea}
            onDeleteIdea={handleDeleteIdea}
          />
        )}
      </div>

      {/* Modal de Configuración */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaved={() => {
          if (token) fetchDatos(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
