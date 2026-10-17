"use client";

import {
  X,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Waves,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type FormEvent,
} from "react";
import { useAuth } from "../context/auth-context";

interface AuthModalProps {
  onClose: () => void;
}

type Tab = "login" | "register";

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Lock size={15} strokeWidth={1.8} />
      </div>
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input pl-9 pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Login fields */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  /* Register fields */
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  /* Focus first field on tab change */
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [tab]);

  /* Escape to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);
      try {
        await login(loginEmail, loginPassword);
        onClose();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error al iniciar sesión"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [login, loginEmail, loginPassword, onClose]
  );

  const handleRegister = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      if (regPassword !== regPassword2) {
        setError("Las contraseñas no coinciden");
        return;
      }
      if (regPassword.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        return;
      }
      setIsLoading(true);
      try {
        await register(regEmail, regPassword, regName);
        onClose();
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error al registrarse"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [register, regEmail, regPassword, regPassword2, regName, onClose]
  );

  const handleGoogleAuth = useCallback(async () => {
    setError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("GOOGLE_CLIENT_ID no está configurado.");
      return;
    }

    if (
      typeof window === "undefined" ||
      !(window as unknown as { google?: { accounts?: { oauth2?: unknown; id?: unknown } } }).google
    ) {
      setError("El servicio de Google no está disponible. Revisa tu conexión a internet.");
      return;
    }

    try {
      setIsLoading(true);
      const google = (window as unknown as {
        google: {
          accounts: {
            oauth2?: {
              initTokenClient: (config: {
                client_id: string;
                scope: string;
                callback: (res: { access_token?: string; error?: string }) => Promise<void>;
                error_callback?: (err: unknown) => void;
              }) => {
                requestAccessToken: () => void;
              };
            };
            id?: {
              initialize: (config: {
                client_id: string;
                callback: (res: { credential?: string }) => Promise<void>;
              }) => void;
              prompt: (notification?: (status: { isNotDisplayed: () => boolean; getNotDisplayedReason: () => string }) => void) => void;
            };
          };
        };
      }).google;

      // En Brave y navegadores con bloqueo estricto de cookies de terceros,
      // initTokenClient abre una ventana emergente directa (OAuth 2.0 popup) que NO depende de iframe/cookies de terceros.
      if (google.accounts.oauth2) {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (res) => {
            if (res.error) {
              setIsLoading(false);
              setError("No se pudo completar el acceso con Google.");
              return;
            }
            if (res.access_token) {
              try {
                await loginWithGoogle({ access_token: res.access_token });
                onClose();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Error al iniciar sesión con Google"
                );
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          },
          error_callback: () => {
            setIsLoading(false);
            setError("Se canceló o cerró la ventana de Google.");
          },
        });

        tokenClient.requestAccessToken();
        return;
      }

      // Fallback a One Tap / ID Token si oauth2 no estuviera disponible
      if (google.accounts.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                await loginWithGoogle(response.credential);
                onClose();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Error al iniciar sesión con Google"
                );
              } finally {
                setIsLoading(false);
              }
            }
          },
        });

        google.accounts.id.prompt((notification) => {
          if (notification && notification.isNotDisplayed()) {
            setIsLoading(false);
            setError("El diálogo de Google fue bloqueado por el navegador (ej. Brave Shields). Haz clic de nuevo o desactiva temporalmente el bloqueo de rastreadores.");
          }
        });
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Error al conectar con Google");
    }
  }, [loginWithGoogle, onClose]);

  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setError(null);
  }, []);

  return (
    /* Overlay */
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Card */}
      <div
        className="modal-card relative bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* ── Gradient header ── */}
        <div
          className="relative px-7 pt-7 pb-6 overflow-hidden"
          style={{
            background: "linear-gradient(140deg, #0d1b2e 0%, #0052cc 100%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -right-8 -top-8 rounded-full opacity-10"
            style={{ width: 120, height: 120, background: "#fff" }}
          />
          <div
            className="absolute right-12 -bottom-6 rounded-full opacity-10"
            style={{ width: 80, height: 80, background: "#1a6fff" }}
          />

          {/* Brand */}
          <div className="relative flex items-center gap-3 mb-5">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{
                width: 42,
                height: 42,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Waves size={20} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <p className="text-white font-bold text-[15px] leading-tight">
                Sol &amp; Mar
              </p>
              <p className="text-blue-300 text-[11px] tracking-wide font-medium">
                HOTEL · MÁNCORA
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="relative">
            <h2 className="text-white font-bold text-xl leading-tight">
              {tab === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
            </h2>
            <p className="text-blue-200 text-xs mt-1">
              {tab === "login"
                ? "Inicia sesión para gestionar tus reservas"
                : "Únete y empieza a reservar hoy"}
            </p>
          </div>

          {/* Tabs */}
          <div
            className="relative flex mt-5 rounded-xl p-1 gap-1"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200"
                style={
                  tab === t
                    ? {
                        background: "#fff",
                        color: "#0052cc",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }
                    : { color: "rgba(255,255,255,0.65)" }
                }
              >
                {t === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            id="btn-close-modal"
            aria-label="Cerrar"
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-7 py-6">
          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 text-sm"
              style={{
                background: "#fff2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
              }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === "login" ? (
            /* ── Login form ── */
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={15} strokeWidth={1.8} />
                  </div>
                  <input
                    ref={firstInputRef}
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@correo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-gray-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-[12px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <PasswordInput
                  id="login-password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-2 mt-1"
                id="btn-login-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ingresando…
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium">
                  o continúa con
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="btn-google"
                id="btn-google-login"
              >
                <Globe size={17} strokeWidth={1.5} />
                Continuar con Google
              </button>
            </form>
          ) : (
            /* ── Register form ── */
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={15} strokeWidth={1.8} />
                  </div>
                  <input
                    ref={firstInputRef}
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Ana García"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={15} strokeWidth={1.8} />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@correo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="form-input pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">
                  Contraseña
                </label>
                <PasswordInput
                  id="reg-password"
                  value={regPassword}
                  onChange={setRegPassword}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                {/* Strength bar */}
                {regPassword.length > 0 && (
                  <StrengthBar password={regPassword} />
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-gray-700">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  id="reg-password2"
                  value={regPassword2}
                  onChange={setRegPassword2}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  required
                />
                {regPassword2.length > 0 && regPassword !== regPassword2 && (
                  <p className="text-[12px] text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Las contraseñas no coinciden
                  </p>
                )}
                {regPassword2.length > 0 && regPassword === regPassword2 && (
                  <p className="text-[12px] text-green-600 flex items-center gap-1">
                    ✓ Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-2 mt-1"
                id="btn-register-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creando cuenta…
                  </>
                ) : (
                  "Crear cuenta gratis"
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium">
                  o regístrate con
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="btn-google"
                id="btn-google-register"
              >
                <Globe size={17} strokeWidth={1.5} />
                Continuar con Google
              </button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-5 text-center text-[11px] text-gray-400 leading-relaxed">
            Al continuar aceptas nuestros{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Términos de uso
            </span>{" "}
            y{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Política de privacidad
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Password strength indicator ── */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function StrengthBar({ password }: { password: string }) {
  const score = getStrength(password);
  const levels = [
    { label: "Muy débil", color: "#ef4444" },
    { label: "Débil",     color: "#f97316" },
    { label: "Regular",   color: "#eab308" },
    { label: "Buena",     color: "#22c55e" },
    { label: "Fuerte",    color: "#16a34a" },
  ];
  const level = levels[Math.min(score - 1, 4)] ?? levels[0];

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{
              background: i <= score ? level.color : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
}
