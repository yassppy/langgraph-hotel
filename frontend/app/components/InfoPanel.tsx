"use client";

import {
  Clock,
  Phone,
  MapPin,
  MessageCircle,
  Shield,
  Star,
  LogIn,
  ChevronRight,
  Waves,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

interface InfoPanelProps {
  onLoginClick: () => void;
}

/* WhatsApp SVG icon (not in Lucide) */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const QUICK_INFO = [
  {
    Icon: Clock,
    label: "Horarios",
    value: "Check-in 3:00 PM · Check-out 12:00 PM",
  },
  {
    Icon: Phone,
    label: "Contacto",
    value: "+51 987 654 321",
  },
  {
    Icon: MapPin,
    label: "Dirección",
    value: "Av. Playa Blanca 123, Máncora",
  },
];

export default function InfoPanel({ onLoginClick }: InfoPanelProps) {
  const { user } = useAuth();

  return (
    <aside
      className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-full overflow-y-auto"
      style={{
        background: "#f8fafc",
        borderLeft: "1px solid #e9eef5",
      }}
    >
      {/* ── Hero banner ── */}
      <div
        className="relative flex flex-col justify-end p-5 shrink-0"
        style={{
          height: 168,
          background: "linear-gradient(135deg, #0d1b2e 0%, #0052cc 60%, #1a6fff 100%)",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-6 -top-6 rounded-full opacity-15"
          style={{ width: 100, height: 100, background: "#fff" }}
        />
        <div
          className="absolute right-10 top-4 rounded-full opacity-10"
          style={{ width: 60, height: 60, background: "#1a6fff" }}
        />
        {/* Wave icon */}
        <div
          className="absolute top-5 left-5 flex items-center justify-center rounded-xl opacity-20"
          style={{
            width: 44,
            height: 44,
            background: "rgba(255,255,255,0.3)",
          }}
        >
          <Waves size={22} color="#fff" />
        </div>

        {/* Text */}
        <div className="relative">
          <p className="text-blue-200 text-[11px] font-semibold tracking-widest uppercase mb-1">
            Vive la experiencia
          </p>
          <p className="text-white font-extrabold text-xl leading-tight tracking-tight">
            Sol &amp; Mar
          </p>
          <p className="text-blue-200 text-[12px] mt-1">
            Comodidad, naturaleza y el mejor servicio.
          </p>
        </div>

        {/* Palm decoration */}
        <span className="absolute bottom-3 right-5 text-3xl opacity-70 select-none">
          🌴
        </span>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Login CTA */}
        {!user && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, #eef4ff 0%, #dce9ff 100%)",
              border: "1px solid #b8d4ff",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <LogIn size={15} strokeWidth={2} style={{ color: "#0052cc" }} />
              <p className="text-[13px] font-semibold text-blue-800">
                Inicia sesión para reservar
              </p>
            </div>
            <p className="text-[12px] text-blue-600 mb-3 leading-relaxed">
              Crea tu cuenta gratis y gestiona tus reservas desde cualquier lugar.
            </p>
            <button
              onClick={onLoginClick}
              id="info-panel-login-btn"
              className="w-full py-2 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, #0052cc, #1a6fff)",
                boxShadow: "0 3px 10px rgba(0,82,204,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <LogIn size={14} strokeWidth={2} />
              Iniciar sesión / Registrarse
            </button>
          </div>
        )}

        {/* User welcome card */}
        {user && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border: "1px solid #86efac",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full text-white font-bold text-sm shrink-0"
                style={{
                  width: 38,
                  height: 38,
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-green-900 truncate">
                  ¡Bienvenido, {user.full_name.split(" ")[0]}!
                </p>
                <p className="text-[11px] text-green-700 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick info */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", border: "1px solid #e9eef5" }}
        >
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">
            Información rápida
          </p>
          <div className="flex flex-col gap-3">
            {QUICK_INFO.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    background: "#eef4ff",
                    border: "1px solid #dce9ff",
                  }}
                >
                  <Icon size={15} strokeWidth={1.8} style={{ color: "#0052cc" }} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                  <p className="text-[13px] font-semibold text-gray-800 mt-0.5 leading-snug">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help section */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", border: "1px solid #e9eef5" }}
        >
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">
            ¿Necesitas ayuda?
          </p>
          <div className="flex flex-col gap-2">
            {/* WhatsApp */}
            <a
              href="https://wa.me/51987654321"
              target="_blank"
              rel="noopener noreferrer"
              id="btn-whatsapp"
              className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#dcfce7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#f0fdf4";
              }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "#22c55e" }}
              >
                <span className="text-white">
                  <WhatsAppIcon size={17} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-green-800">
                  Habla con un asesor
                </p>
                <p className="text-[11px] text-green-600">
                  Respuesta en minutos vía WhatsApp
                </p>
              </div>
              <ChevronRight
                size={15}
                strokeWidth={2}
                style={{ color: "#86efac" }}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </a>

            {/* Security */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "#f8fafc", border: "1px solid #e9eef5" }}
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "#eef4ff", border: "1px solid #dce9ff" }}
              >
                <Shield size={16} strokeWidth={1.8} style={{ color: "#0052cc" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-700">
                  Tu información está segura
                </p>
                <p className="text-[11px] text-gray-500">
                  Cifrado SSL y datos protegidos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "#fff", border: "1px solid #e9eef5" }}
        >
          <div className="flex items-center justify-center gap-0.5 mb-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={16}
                fill={i <= 4 ? "#f59e0b" : "none"}
                stroke={i <= 5 ? "#f59e0b" : "#e5e7eb"}
                strokeWidth={1.5}
              />
            ))}
            <span
              className="ml-1.5 text-[13px] font-bold"
              style={{ color: "#92400e" }}
            >
              4.9
            </span>
          </div>
          <p className="text-[11px] text-gray-500">
            Basado en <span className="font-semibold text-gray-700">248</span> reseñas verificadas
          </p>
        </div>
      </div>
    </aside>
  );
}
