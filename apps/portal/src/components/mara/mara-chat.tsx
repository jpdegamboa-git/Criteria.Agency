'use client';

import { useState, useEffect, useRef } from 'react';
import { api, type MaraMessage, type PlayPauseState } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

export default function MaraChat() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [playPause, setPlayPause] = useState<PlayPauseState>({ playMode: false, invocationsThisPeriod: 0, sessionBudget: 5 });
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Start MARA session when chat opens
  async function openChat() {
    setOpen(true);
    if (sessionId) return; // Already have a session

    setInitializing(true);
    try {
      const [sessionRes, ppRes] = await Promise.all([
        api.startMaraSession(),
        api.getPlayPause(),
      ]);

      setSessionId(sessionRes.session.id);
      setPlayPause(ppRes);

      // Load existing messages if session was resumed
      if (sessionRes.resumed && sessionRes.session.id) {
        const sessionData = await api.getMaraSessionMessages(sessionRes.session.id);
        setMessages(
          sessionData.messages.map((m: MaraMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
        );
      } else {
        // New session — show opening message
        const opening = sessionRes.openingMessage ??
          'Hola! Soy Mara, tu asistente de marketing. Puedo consultar tus datos y ayudarte a navegar la plataforma — eso es gratis, siempre. Ponme en play para análisis más profundos.';

        setMessages([{ id: 'intro', role: 'assistant', content: opening }]);
      }
    } catch {
      setMessages([{
        id: 'error',
        role: 'assistant',
        content: 'No pude conectarme. Intenta nuevamente en un momento.',
      }]);
    } finally {
      setInitializing(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const pendingMsg: Message = { id: 'pending', role: 'assistant', content: '...', pending: true };

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInput('');
    setSending(true);

    try {
      const result = await api.sendMaraMessage(sessionId, userMsg.content);
      setMessages((prev) =>
        prev.filter((m) => !m.pending).concat({
          id: Date.now().toString() + '-r',
          role: 'assistant',
          content: result.response,
        }),
      );
    } catch {
      setMessages((prev) =>
        prev.filter((m) => !m.pending).concat({
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Hubo un error. Intenta nuevamente.',
        }),
      );
    } finally {
      setSending(false);
    }
  }

  async function togglePlayPause() {
    try {
      const updated = await api.togglePlayPause(!playPause.playMode);
      setPlayPause(updated);
    } catch {
      // Silently fail
    }
  }

  return (
    <>
      {/* Floating chat bubble button */}
      <button
        onClick={open ? () => setOpen(false) : openChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-criteria-600 hover:bg-criteria-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
        title="Hablar con Mara"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-criteria-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Mara</p>
                <p className="text-xs text-gray-400">Asistente de marketing</p>
              </div>
            </div>
            {/* Play/pause toggle */}
            <button
              onClick={togglePlayPause}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                playPause.playMode
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={playPause.playMode ? 'Pausar (deja de consumir tokens)' : 'Activar (permite análisis profundos)'}
            >
              {playPause.playMode ? (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Play
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Pause
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {initializing ? (
              <div className="text-center py-4 text-sm text-gray-400">Conectando con Mara...</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-criteria-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    } ${msg.pending ? 'opacity-60 animate-pulse' : ''}`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a Mara..."
                className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-criteria-400"
                disabled={sending || initializing}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || initializing}
                className="p-2 bg-criteria-600 hover:bg-criteria-700 disabled:opacity-40 text-white rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
