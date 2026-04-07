const plans = [
  {
    name: "Starter",
    desc: "Para fundadores y empresas pequenas",
    price: "$300",
    period: "/mes",
    early: "$500/mes despues de 3 meses",
    features: [
      { text: "1 video profesional/mes", active: true },
      { text: "5 quality gates", active: true },
      { text: "Portal de revision", active: true },
      { text: "AI Copilot para briefs", active: true },
      { text: "Brand Builder", active: false, soon: true },
    ],
    featured: false,
    outline: false,
  },
  {
    name: "Pro",
    desc: "Para equipos de marketing",
    price: "$1,200",
    period: "/mes",
    early: "$2,000/mes despues de 3 meses",
    features: [
      { text: "4 videos profesionales/mes", active: true },
      { text: "Quality gates ilimitados", active: true },
      { text: "Portal de revision", active: true },
      { text: "AI Copilot para briefs", active: true },
      { text: "Soporte prioritario", active: true },
    ],
    featured: true,
    outline: false,
  },
  {
    name: "Enterprise",
    desc: "Multi-mercado, operacion completa",
    price: "Custom",
    period: "",
    early: "",
    desc2: "Account Executive dedicado",
    features: [
      { text: "Videos ilimitados", active: true },
      { text: "Formatos premium", active: true },
      { text: "Multi-marca + guardian", active: true },
      { text: "Pauta gestionada", active: true },
      { text: "Integraciones custom", active: true },
    ],
    featured: false,
    outline: true,
  },
] as const;

export default function PricingCards() {
  return (
    <section id="pricing" className="max-w-5xl mx-auto py-24 px-6 text-center">
      <h2 className="text-4xl font-extrabold tracking-tight">Elige tu plan</h2>
      <p className="text-lg text-brand-muted mb-14">
        Prueba gratis por 30 dias. Sin tarjeta de credito.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-surface-card border rounded-2xl p-10 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] relative ${
              plan.featured
                ? "border-2 border-brand-gold shadow-[0_8px_32px_rgba(255,208,83,0.12)]"
                : "border-surface-border"
            }`}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-[#1a1a1a] text-[11px] font-bold px-5 py-1 rounded-full">
                Mas popular
              </span>
            )}

            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-sm text-brand-muted mb-5">{plan.desc}</p>

            <p className="mb-1">
              <span className={`${plan.price === "Custom" ? "text-3xl" : "text-4xl"} font-extrabold tracking-tight`}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-base font-normal text-brand-muted">{plan.period}</span>
              )}
            </p>

            {plan.early ? (
              <p className="text-sm text-brand-coral line-through mb-6">{plan.early}</p>
            ) : (
              <p className="text-sm text-brand-muted mb-6">
                {"desc2" in plan ? plan.desc2 : ""}
              </p>
            )}

            <ul className="mb-8">
              {plan.features.map((f) => (
                <li
                  key={f.text}
                  className="flex items-center gap-2 text-sm text-brand-dark py-2 border-b border-gray-50"
                >
                  {f.active ? (
                    <span className="text-brand-turquoise font-bold">&#10003;</span>
                  ) : (
                    <span className="text-gray-300">&mdash;</span>
                  )}
                  <span className={f.active ? "" : "text-gray-300"}>
                    {f.text}
                    {"soon" in f && f.soon && (
                      <span className="text-[11px] text-gray-300 ml-1">(pronto)</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3.5 rounded-xl font-semibold transition-all ${
                plan.outline
                  ? "bg-white border border-surface-border text-brand-dark hover:border-brand-dark"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333]"
              }`}
            >
              {plan.outline ? "Contactar ventas" : "Empezar gratis"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
