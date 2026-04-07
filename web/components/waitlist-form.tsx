"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WaitlistForm({ source = "landing" }: { source?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      company: form.get("company") as string || undefined,
      videoType: form.get("videoType") as string || undefined,
      source,
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Error al registrarse");
        setLoading(false);
        return;
      }

      router.push("/waitlist/success");
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
      <input
        name="name"
        type="text"
        placeholder="Tu nombre"
        required
        className="w-full bg-white border border-[#e8e8e8] rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#9d9a9c] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
      />
      <input
        name="email"
        type="email"
        placeholder="tu@email.com"
        required
        className="w-full bg-white border border-[#e8e8e8] rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#9d9a9c] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
      />
      <input
        name="company"
        type="text"
        placeholder="Empresa (opcional)"
        className="w-full bg-white border border-[#e8e8e8] rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#9d9a9c] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
      />
      <select
        name="videoType"
        className="w-full bg-white border border-[#e8e8e8] rounded-lg px-4 py-2.5 text-sm text-[#9d9a9c] focus:outline-none focus:border-[#ffd053] focus:ring-1 focus:ring-[#ffd053]/30 transition-colors"
      >
        <option value="">Que tipo de video necesitas? (opcional)</option>
        <option value="corporate">Corporate</option>
        <option value="explainer">Explainer</option>
        <option value="social">Social media</option>
        <option value="comercial">Comercial</option>
        <option value="otro">Otro</option>
      </select>

      {error && (
        <p className="text-[#e86b73] text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1a1a1a] text-white py-3.5 rounded-xl text-base font-semibold hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? "Registrando..." : "Unirme al waitlist"}
      </button>

      <p className="text-center text-xs text-gray-300">
        Sin spam. Solo actualizaciones del producto.
      </p>
    </form>
  );
}
