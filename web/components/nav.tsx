export default function Nav() {
  const linkClass =
    "text-sm text-brand-muted hover:text-brand-dark relative transition-colors " +
    "after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 " +
    "after:bg-brand-gold after:transition-all hover:after:w-full";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
        <a href="/">
          <img src="/logo.svg" alt="criteria.agency" className="h-7" />
        </a>
        <div className="flex items-center gap-8">
          <a href="#how" className={linkClass}>
            Como funciona
          </a>
          <a href="#quality" className={linkClass}>
            Calidad
          </a>
          <a href="#pricing" className={linkClass}>
            Planes
          </a>
          <a
            href="#waitlist"
            className="bg-[#1a1a1a] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#333] hover:-translate-y-px hover:shadow-md transition-all"
          >
            Unirme al waitlist
          </a>
        </div>
      </div>
    </nav>
  );
}
