"use client";

import {
  BedDouble,
  Hotel,
  ClipboardList,
  CreditCard,
  MapPin,
  Headphones,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Waves,
  Menu,
  Check,
  CheckCheck,
} from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";
import { useAuth } from "../context/auth-context";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  time: string;
  cards?: QuickCard[];
}

interface QuickCard {
  id: string;
  Icon: React.ElementType;
  title: string;
  subtitle: string;
  action: string;
}

/* ─── Quick action cards ─── */
const QUICK_ACTIONS: QuickCard[] = [
  {
    id: "reservar",
    Icon: BedDouble,
    title: "Reservar una habitación",
    subtitle: "Busca disponibilidad",
    action: "Quiero reservar una habitación",
  },
  {
    id: "habitaciones",
    Icon: Hotel,
    title: "Ver habitaciones y precios",
    subtitle: "Conoce nuestras opciones",
    action: "¿Cuáles son las habitaciones disponibles?",
  },
  {
    id: "mi-reserva",
    Icon: ClipboardList,
    title: "Mi reserva",
    subtitle: "Consulta tu estado",
    action: "Quiero ver el estado de mi reserva",
  },
  {
    id: "como-pagar",
    Icon: CreditCard,
    title: "Cómo pagar con Yape",
    subtitle: "Instrucciones de pago",
    action: "¿Cómo puedo pagar con Yape?",
  },
  {
    id: "ubicacion",
    Icon: MapPin,
    title: "Ubicación",
    subtitle: "Cómo llegar",
    action: "¿Dónde está ubicado el hotel?",
  },
  {
    id: "soporte",
    Icon: Headphones,
    title: "Soporte",
    subtitle: "Habla con un asesor",
    action: "Necesito hablar con un asesor",
  },
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function nowStr() {
  return new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
let _uidCounter = 0;
function uid() {
  return `msg-${++_uidCounter}`;
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 msg-enter">
      <BotAvatar />
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: "#f0f4f8" }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 self-start"
      style={{
        width: 34,
        height: 34,
        background: "linear-gradient(135deg, #0052cc 0%, #1a6fff 100%)",
        boxShadow: "0 2px 8px rgba(0,82,204,0.3)",
        marginTop: 2,
      }}
    >
      <Waves size={16} color="#fff" strokeWidth={2.5} />
    </div>
  );
}

/* ─── Single chat message ─── */
interface ChatMessageProps {
  msg: Message;
  onCardClick: (action: string) => void;
}

function ChatMessage({ msg, onCardClick }: ChatMessageProps) {
  const isUser = msg.role === "user";

  return (
    <div
      className={`flex items-end gap-2.5 msg-enter ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {!isUser && <BotAvatar />}

      <div
        className={`flex flex-col gap-2 max-w-[78%] sm:max-w-[70%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Text bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed ${
            isUser
              ? "text-white rounded-2xl rounded-br-sm"
              : "text-gray-800 rounded-2xl rounded-bl-sm"
          }`}
          style={{
            background: isUser
              ? "linear-gradient(135deg, #0052cc, #1a6fff)"
              : "#f0f4f8",
            boxShadow: isUser
              ? "0 2px 12px rgba(0,82,204,0.25)"
              : "0 1px 3px rgba(0,0,0,0.05)",
            whiteSpace: "pre-line",
          }}
        >
          {msg.text}
        </div>

        {/* Quick action cards */}
        {msg.cards && msg.cards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-1">
            {msg.cards.map((card) => (
              <ActionCard key={card.id} card={card} onClick={onCardClick} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">{msg.time}</span>
          {isUser && (
            <CheckCheck
              size={13}
              strokeWidth={2}
              style={{ color: "#60a5fa" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Action card ─── */
function ActionCard({
  card,
  onClick,
}: {
  card: QuickCard;
  onClick: (a: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      id={`quick-action-${card.id}`}
      onClick={() => onClick(card.action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200"
      style={{
        background: hovered ? "#eef4ff" : "#fff",
        borderColor: hovered ? "#80b4ff" : "#e2e8f0",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 6px 20px rgba(0,82,204,0.12)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 40,
          height: 40,
          background: hovered ? "#dce9ff" : "#f0f4f8",
          transition: "background 0.2s",
        }}
      >
        <card.Icon
          size={20}
          strokeWidth={1.7}
          style={{ color: hovered ? "#0052cc" : "#4a5568" }}
        />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-gray-800 leading-tight">
          {card.title}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{card.subtitle}</p>
      </div>
    </button>
  );
}

/* ─── Main ChatArea ─── */
interface ChatAreaProps {
  onLoginRequired: () => void;
  onOpenSidebar: () => void;
}

export default function ChatArea({
  onLoginRequired,
  onOpenSidebar,
}: ChatAreaProps) {
  const { user } = useAuth();

  const makeWelcome = useCallback(
    () => ({
      id: uid(),
      role: "bot" as const,
      text: user
        ? `¡Hola, ${user.full_name.split(" ")[0]}! 👋\nSoy tu asistente virtual del Hotel Sol & Mar.\n¿En qué puedo ayudarte hoy?`
        : "¡Hola! 👋\nSoy tu asistente virtual del Hotel Sol & Mar.\n¿En qué puedo ayudarte hoy?",
      time: nowStr(),
      cards: QUICK_ACTIONS,
    }),
    [user]
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Init & reset on auth change — runs client-side only */
  useEffect(() => {
    setMessages([makeWelcome()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = {
        id: uid(),
        role: "user",
        text: text.trim(),
        time: nowStr(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        const res = await fetch(`${API_BASE}/chat/message`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });

        if (res.status === 401) {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "bot",
              text: "Para continuar necesitas iniciar sesión o crear una cuenta. ¡Es rápido y gratis! 🔐",
              time: nowStr(),
            },
          ]);
          onLoginRequired();
          return;
        }

        if (!res.ok) throw new Error("Error de servidor");

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            text: data.message ?? data.reply ?? "Entendido, en breve te ayudo.",
            time: nowStr(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "bot",
            text: getDemoResponse(text),
            time: nowStr(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [onLoginRequired]
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
    },
    []
  );

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* ── Chat header ── */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "#e9eef5" }}
      >
        {/* Hamburger — mobile */}
        <button
          id="btn-open-sidebar"
          onClick={onOpenSidebar}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Bot avatar */}
        <div
          className="relative flex items-center justify-center rounded-full shrink-0"
          style={{
            width: 38,
            height: 38,
            background: "linear-gradient(135deg, #0052cc, #1a6fff)",
            boxShadow: "0 2px 8px rgba(0,82,204,0.3)",
          }}
        >
          <Waves size={18} color="#fff" strokeWidth={2.5} />
          {/* Online dot */}
          <span
            className="absolute bottom-0 right-0 block rounded-full border-2 border-white"
            style={{ width: 10, height: 10, background: "#22c55e" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[14px] text-gray-900 leading-tight">
            Asistente Sol &amp; Mar
          </p>
          <p className="text-[11px] text-green-500 font-medium">En línea</p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Más opciones"
            id="btn-chat-menu"
          >
            <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor">
              <circle cx="2" cy="2" r="2" />
              <circle cx="8" cy="2" r="2" />
              <circle cx="14" cy="2" r="2" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Message list ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 min-h-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} onCardClick={sendMessage} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div
        className="shrink-0 px-4 py-3 border-t"
        style={{ borderColor: "#e9eef5", background: "#fff" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200"
          style={{
            border: "1.5px solid",
            borderColor: input ? "#80b4ff" : "#e2e8f0",
            boxShadow: input
              ? "0 0 0 3px rgba(26,111,255,0.08)"
              : "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {/* Attachment */}
          <button
            type="button"
            id="btn-attach"
            title="Adjuntar archivo"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 mb-0.5"
          >
            <Paperclip size={17} strokeWidth={1.8} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none py-1"
            style={{ maxHeight: 140, lineHeight: "1.55" }}
          />

          {/* Extra actions */}
          <div className="flex items-center gap-1 mb-0.5 shrink-0">
            <button
              type="button"
              id="btn-image"
              title="Enviar imagen"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ImageIcon size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              id="btn-mic"
              title="Voz"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Mic size={17} strokeWidth={1.8} />
            </button>

            {/* Send */}
            <button
              type="submit"
              id="btn-send"
              disabled={!canSend}
              title="Enviar"
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ml-0.5"
              style={{
                background: canSend
                  ? "linear-gradient(135deg, #0052cc, #1a6fff)"
                  : "#e2e8f0",
                boxShadow: canSend
                  ? "0 4px 12px rgba(0,82,204,0.35)"
                  : "none",
                transform: canSend ? "scale(1)" : "scale(0.95)",
              }}
            >
              <Send
                size={15}
                strokeWidth={2.2}
                color={canSend ? "#fff" : "#a0aec0"}
                style={{ transform: "translateX(1px)" }}
              />
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-gray-400 mt-2">
          <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">
            Enter
          </kbd>{" "}
          para enviar ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">
            Shift+Enter
          </kbd>{" "}
          para nueva línea
        </p>
      </div>
    </div>
  );
}

/* ── Demo fallback responses ── */
function getDemoResponse(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("habitacion") || t.includes("habitación") || t.includes("cuarto"))
    return "🛏️ Tenemos las siguientes habitaciones:\n\n• Estándar — S/. 120/noche · 2 personas\n• Doble — S/. 140/noche · 2 personas (2 camas)\n• Suite Junior — S/. 200/noche · 4 personas\n\n¿Te gustaría reservar alguna?";
  if (t.includes("precio") || t.includes("tarifa") || t.includes("costo"))
    return "💰 Nuestras tarifas comienzan desde S/. 120 por noche.\n\nLas tarifas varían según el tipo de habitación y fechas. ¿Qué fechas tienes en mente?";
  if (t.includes("reservar") || t.includes("reserva"))
    return "📅 Con gusto te ayudo a reservar.\n\nNecesito saber:\n1. Fecha de llegada\n2. Fecha de salida\n3. Número de huéspedes\n\n¿Cuándo planeas venir?";
  if (t.includes("yape") || t.includes("pagar") || t.includes("pago"))
    return "💳 Aceptamos pagos por Yape.\n\nPasos:\n1. Confirma tu reserva\n2. Te enviaremos el QR de Yape\n3. Realiza el pago y sube el comprobante\n4. Un asesor lo verificará en minutos\n\n¿Necesitas más detalles?";
  if (t.includes("ubicacion") || t.includes("ubicación") || t.includes("donde") || t.includes("dónde"))
    return "📍 Nos encuentras en:\n\nAv. Playa Blanca 123, Máncora, Piura\n\nEstamos a 50 metros de la orilla del mar. 🏖️\n\nTeléfono: +51 987 654 321";
  if (t.includes("soporte") || t.includes("asesor") || t.includes("ayuda"))
    return "🎧 Te conectaremos con un asesor.\n\nPuedes escribirnos por WhatsApp:\n📱 +51 987 654 321\n\nHorario de atención: 8:00 AM – 10:00 PM";
  if (t.includes("checkin") || t.includes("check-in") || t.includes("horario"))
    return "🕐 Horarios del hotel:\n\n• Check-in: 3:00 PM\n• Check-out: 12:00 PM\n\n¿Tienes alguna consulta adicional?";
  return "Gracias por tu mensaje. Un asesor o el asistente te responderá en breve. ¿En qué más puedo ayudarte? 😊";
}
