"use client";

import {
  Home,
  CalendarDays,
  ClipboardList,
  CreditCard,
  MapPin,
  Headphones,
  LogIn,
  LogOut,
  ChevronRight,
  X,
  Waves,
} from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";
import { useAuth } from "../context/auth-context";

export type NavPage =
  | "inicio"
  | "reservar"
  | "mis-reservas"
  | "como-pagar"
  | "ubicacion"
  | "soporte";

interface SidebarProps {
  activePage: NavPage;
  setActivePage: Dispatch<SetStateAction<NavPage>>;
  onLoginClick: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { id: NavPage; label: string; Icon: React.ElementType }[] = [
  { id: "inicio",        label: "Inicio",        Icon: Home },
  { id: "reservar",      label: "Reservar",       Icon: CalendarDays },
  { id: "mis-reservas",  label: "Mis reservas",   Icon: ClipboardList },
  { id: "como-pagar",    label: "Cómo pagar",     Icon: CreditCard },
  { id: "ubicacion",     label: "Ubicación",      Icon: MapPin },
  { id: "soporte",       label: "Soporte",        Icon: Headphones },
];

const ROLE_LABEL: Record<string, string> = {
  customer: "Huésped",
  staff:    "Asesor",
  admin:    "Administrador",
};

export default function Sidebar({
  activePage,
  setActivePage,
  onLoginClick,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const handleNav = (page: NavPage) => {
    setActivePage(page);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed md:relative z-40 h-full flex flex-col select-none",
          "w-64 shrink-0",
          "transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{ background: "var(--navy-900)" }}
      >
        {/* ── Header logo ── */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #1a6fff 0%, #0052cc 100%)",
                boxShadow: "0 4px 14px rgba(26,111,255,0.45)",
              }}
            >
              <Waves size={20} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight tracking-tight">
                Sol &amp; Mar
              </p>
              <p className="text-blue-400 text-[11px] font-medium tracking-wide">
                HOTEL · MÁNCORA
              </p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onMobileClose}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3" style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => handleNav(id)}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 relative"
                style={
                  isActive
                    ? {
                        background: "rgba(26,111,255,0.22)",
                        color: "#fff",
                        boxShadow: "inset 3px 0 0 #1a6fff",
                      }
                    : { color: "#93b4d4" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "#93b4d4";
                  }
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ flexShrink: 0 }}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={14} strokeWidth={2.5} style={{ opacity: 0.6 }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Promo card ── */}
        <div className="mx-3 mb-3">
          <div
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d3b8a 0%, #0052cc 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Decorative blob */}
            <div
              className="absolute -right-4 -top-4 rounded-full opacity-20"
              style={{ width: 64, height: 64, background: "#fff" }}
            />
            <p className="relative text-white font-semibold text-[13px] leading-snug">
              🌴 Tu descanso,<br />nuestro propósito
            </p>
            <p className="relative text-blue-200 text-[11px] mt-1 leading-relaxed">
              Disfruta de una experiencia única frente al mar.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3" style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

        {/* ── User section ── */}
        <div className="px-3 pb-5">
          {user ? (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center rounded-full shrink-0 text-white font-bold text-sm"
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, #1a6fff, #0052cc)",
                  boxShadow: "0 0 0 2px rgba(26,111,255,0.4)",
                }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold truncate leading-tight">
                  {user.full_name}
                </p>
                <p className="text-blue-400 text-[11px] truncate mt-0.5">
                  {ROLE_LABEL[user.role] ?? user.role}
                </p>
              </div>
              <button
                onClick={() => logout()}
                title="Cerrar sesión"
                id="btn-logout"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-blue-300 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              id="btn-open-login"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
              style={{
                background: "rgba(26,111,255,0.12)",
                color: "#93b4d4",
                border: "1px solid rgba(26,111,255,0.2)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(26,111,255,0.22)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(26,111,255,0.12)";
                (e.currentTarget as HTMLElement).style.color = "#93b4d4";
              }}
            >
              <LogIn size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <span>Iniciar sesión</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
