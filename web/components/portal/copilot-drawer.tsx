"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Minus, Maximize2, Minimize2 } from "lucide-react";

interface CopilotDrawerProps {
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function CopilotDrawer({ onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy tu Copilot. ¿En qué te puedo ayudar hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 420,
      y: window.innerHeight - 520,
    });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      { role: "assistant", content: "Entendido. Estoy procesando tu solicitud..." },
    ]);
    setInput("");
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (expanded) return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }

  useEffect(() => {
    if (!dragging) return;
    function handleMouseMove(e: MouseEvent) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
    function handleMouseUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const windowStyle = expanded
    ? { top: 40, left: 40, right: 40, bottom: 40, width: "auto", height: "auto" }
    : minimized
    ? { left: position.x, top: position.y, width: 380, height: "auto" }
    : { left: position.x, top: position.y, width: 380, height: 460 };

  return (
    <div
      ref={windowRef}
      className="fixed z-50 flex flex-col bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-[#e8e8e8] overflow-hidden"
      style={windowStyle as React.CSSProperties}
    >
      {/* Title bar — draggable */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-2.5 border-b border-portal-border select-none"
        style={{ cursor: expanded ? "default" : "grab" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ed854b]" />
          <span className="text-xs font-semibold text-portal-text">Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title={minimized ? "Restaurar" : "Minimizar"}
          >
            <Minus size={12} className="text-portal-text-muted" />
          </button>
          <button
            onClick={() => { setExpanded(!expanded); setMinimized(false); }}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title={expanded ? "Restaurar" : "Maximizar"}
          >
            {expanded ? <Minimize2 size={12} className="text-portal-text-muted" /> : <Maximize2 size={12} className="text-portal-text-muted" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title="Cerrar"
          >
            <X size={12} className="text-portal-text-muted" />
          </button>
        </div>
      </div>

      {/* Body — hidden when minimized */}
      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "assistant"
                    ? "bg-[#fff8eb] text-portal-text text-xs p-3 rounded-2xl rounded-tl-sm max-w-[85%]"
                    : "bg-gray-100 text-portal-text text-xs p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto"
                }
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-portal-border">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 text-xs bg-gray-50 border border-portal-border rounded-xl px-3 py-2 outline-none focus:border-portal-accent transition-colors"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-portal-text text-white rounded-xl hover:opacity-80 transition-opacity"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
