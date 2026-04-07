const steps = [
  {
    icon: "\u{1F4AC}",
    iconBg: "bg-brand-turquoise/[0.12]",
    title: "Describe tu proyecto",
    description:
      "Nuestro copiloto IA te guia con preguntas simples para crear el brief perfecto. No necesitas saber de video.",
  },
  {
    icon: "\u26A1",
    iconBg: "bg-brand-gold/[0.12]",
    title: "La IA produce, el criterio evalua",
    description:
      "20 agentes especializados crean tu video. 5 puntos de control de calidad garantizan resultado profesional.",
  },
  {
    icon: "\u2713",
    iconBg: "bg-brand-coral/[0.12]",
    title: "Revisa y aprueba",
    description:
      "Recibe tu video en tu portal privado. Deja comentarios y aprueba cuando estes 100% satisfecho.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="max-w-5xl mx-auto py-24 px-6">
      <h2 className="text-4xl font-extrabold tracking-tight text-center">
        Como funciona
      </h2>
      <p className="text-lg text-brand-muted text-center mb-16">
        Tres pasos. Sin complicaciones.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.title}
            className="group relative bg-surface-card border border-surface-border rounded-2xl p-12 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-transparent overflow-hidden"
          >
            {/* Gold top border on hover */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div
              className={`${step.iconBg} w-14 h-14 rounded-2xl inline-flex items-center justify-center text-2xl mb-6`}
            >
              {step.icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
