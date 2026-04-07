export default function Hero() {
  return (
    <section className="relative py-20 lg:py-28 max-w-4xl mx-auto text-center px-6">
      {/* Dot grid background */}
      <div className="dot-grid absolute inset-0 pointer-events-none" />

      {/* Floating diamonds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[8%] w-3 h-3 rounded-[3px] rotate-45 opacity-[0.15] bg-brand-gold animate-float" />
        <div className="absolute top-[30%] right-[12%] w-2 h-2 rounded-[3px] rotate-45 opacity-[0.15] bg-brand-coral animate-float [animation-delay:1.5s]" />
        <div className="absolute bottom-[25%] left-[15%] w-2.5 h-2.5 rounded-[3px] rotate-45 opacity-[0.15] bg-brand-turquoise animate-float [animation-delay:3s]" />
        <div className="absolute bottom-[35%] right-[8%] w-1.5 h-1.5 rounded-[3px] rotate-45 opacity-[0.15] bg-brand-orange animate-float [animation-delay:4.5s]" />
        <div className="absolute top-[50%] left-[5%] w-[5px] h-[5px] rounded-[3px] rotate-45 opacity-[0.15] bg-brand-gold animate-float [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[5%] w-[7px] h-[7px] rounded-[3px] rotate-45 opacity-[0.15] bg-brand-coral animate-float [animation-delay:3.5s]" />
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-white border border-surface-border rounded-full px-5 py-1.5 text-sm text-brand-muted opacity-0 animate-fade-in-up-2">
        <span className="w-1.5 h-1.5 bg-brand-turquoise rounded-full animate-pulse-dot" />
        Plazas limitadas — Beta privada Q3 2026
      </div>

      {/* Headline */}
      <h1 className="text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] leading-[1.08] mt-8 mb-6 opacity-0 animate-fade-in-up-3">
        Video profesional con IA.
        <br />
        <span className="gradient-text-gold">Con criterio.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-xl text-brand-muted max-w-lg mx-auto mb-10 opacity-0 animate-fade-in-up-4">
        20 a&ntilde;os de experiencia en producci&oacute;n codificados en un
        sistema que exige calidad profesional antes de entregar.
      </p>

      {/* CTA buttons */}
      <div className="flex justify-center gap-3 opacity-0 animate-fade-in-up-5">
        <button className="bg-[#1a1a1a] text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-xl transition-all relative overflow-hidden cursor-pointer">
          Empezar gratis — 30 d&iacute;as
        </button>
        <button className="bg-transparent border border-surface-border text-brand-dark px-8 py-4 rounded-xl text-base font-medium hover:border-brand-dark hover:bg-black/[0.02] transition-all cursor-pointer">
          Ver c&oacute;mo funciona &darr;
        </button>
      </div>

      {/* Note */}
      <p className="mt-5 text-sm text-gray-300 opacity-0 animate-fade-in-up-5">
        Sin tarjeta de cr&eacute;dito &middot; Cancela cuando quieras
      </p>
    </section>
  );
}
