export default function CtaSection() {
  return (
    <section
      id="waitlist"
      className="bg-gradient-to-br from-brand-gold to-brand-orange py-20 px-6 text-center relative overflow-hidden"
    >
      <div className="dot-grid-light absolute inset-0" />

      <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1a1a1a] tracking-tight relative">
        La IA genera. El criterio decide.
      </h2>
      <p className="text-lg text-black/60 mb-8 relative">
        Unete a la lista de espera y se de los primeros en probarlo.
      </p>
      <button className="bg-[#1a1a1a] text-white px-12 py-4 rounded-xl text-base font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all relative">
        Reservar mi lugar &rarr;
      </button>
    </section>
  );
}
