import React, { useState, useRef, useEffect } from "react";
import { Lightbulb, Moon, Sun, User, LogOut, Settings, Sparkles, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  activeTab: "ideas" | "prompts";
  setActiveTab: (tab: "ideas" | "prompts") => void;
  userEmail: string;
  onLogout: () => void;
  onOpenConfig?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  userEmail,
  onLogout,
  onOpenConfig,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200"
        style={{
          backgroundColor:
            theme === "dark" ? "rgba(24, 24, 27, 0.85)" : "rgba(255, 255, 255, 0.85)",
          borderColor: "var(--border-main)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              <Lightbulb className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight select-none">
              Banco de Ideas
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl border bg-zinc-100/70 dark:bg-zinc-900/60" style={{ borderColor: "var(--border-main)" }}>
            <button
              onClick={() => setActiveTab("ideas")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "ideas"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              💡 Ideas
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "prompts"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              ⚡ Prompts
            </button>
          </nav>

          {/* Actions & User Menu */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              style={{
                borderColor: "var(--border-main)",
                backgroundColor: "var(--bg-card)",
              }}
              title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Script Config Button */}
            {onOpenConfig && (
              <button
                onClick={onOpenConfig}
                className="w-9 h-9 rounded-xl border hidden md:flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                style={{
                  borderColor: "var(--border-main)",
                  backgroundColor: "var(--bg-card)",
                }}
                title="Configuración de Google Apps Script"
                aria-label="Configuración de Google Apps Script"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer"
                style={{
                  borderColor: "var(--border-main)",
                  backgroundColor: "var(--bg-card)",
                }}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="Menú de usuario"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline text-xs font-medium max-w-[130px] truncate">
                  {userEmail || "Usuario"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-2 animate-in fade-in slide-in-from-top-2 z-50"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-main)",
                  }}
                >
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border-main)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Sesión activa
                    </p>
                    <p className="text-xs font-medium truncate mt-0.5" style={{ color: "var(--text-main)" }}>
                      {userEmail}
                    </p>
                  </div>

                  {onOpenConfig && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenConfig();
                      }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer md:hidden"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Configurar Apps Script</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="font-medium">Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg flex items-center justify-around py-2 px-4 shadow-lg transition-colors"
        style={{
          backgroundColor:
            theme === "dark" ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderColor: "var(--border-main)",
        }}
        aria-label="Navegación móvil"
      >
        <button
          onClick={() => setActiveTab("ideas")}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "ideas"
              ? "text-purple-600 dark:text-purple-400 font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <span className="text-lg">💡</span>
          <span>Ideas</span>
        </button>

        <button
          onClick={() => setActiveTab("prompts")}
          className={`flex flex-col items-center gap-1 py-1 px-5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "prompts"
              ? "text-purple-600 dark:text-purple-400 font-bold"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <span className="text-lg">⚡</span>
          <span>Prompts</span>
        </button>
      </nav>
    </>
  );
}
