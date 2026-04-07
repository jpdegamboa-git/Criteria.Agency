const gates = [
  {
    label: "G1",
    labelColor: "text-brand-turquoise",
    borderColor: "bg-brand-turquoise",
    name: "Concepto",
    description: "Vision clara y ejecutable",
  },
  {
    label: "G2",
    labelColor: "text-brand-gold",
    borderColor: "bg-brand-gold",
    name: "Guion",
    description: "Cada segundo cuenta",
  },
  {
    label: "G3",
    labelColor: "text-brand-orange",
    borderColor: "bg-brand-orange",
    name: "Storyboard",
    description: "Visual sirve narrativa",
  },
  {
    label: "G4",
    labelColor: "text-brand-coral",
    borderColor: "bg-brand-coral",
    name: "Primer corte",
    description: "Funciona emocionalmente",
  },
  {
    label: "G5",
    labelColor: "text-brand-turquoise",
    borderColor: "bg-brand-turquoise",
    name: "Corte final",
    description: "Orgullosos de entregar",
  },
];

export default function QualityGates() {
  return (
    <section
      id="quality"
      className="radial-glow-gold bg-[#1a1a1a] text-white py-24 px-6 relative overflow-hidden"
    >
      <h2 className="text-4xl font-extrabold tracking-tight text-center relative">
        5 puntos de criterio
      </h2>
      <p className="text-lg text-[#777] text-center mb-14 relative">
        Cada video pasa por 5 evaluaciones de calidad antes de llegar a ti
      </p>
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto relative">
        {gates.map((gate) => (
          <div
            key={gate.label}
            className="group flex-1 min-w-[140px] p-7 rounded-2xl border border-[#2a2a2a] text-center transition-all duration-300 hover:border-[#444] hover:-translate-y-0.5 hover:bg-white/[0.02] relative overflow-hidden"
          >
            {/* Colored bottom border on hover */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 ${gate.borderColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <p
              className={`text-xs uppercase tracking-[2px] font-bold mb-2 ${gate.labelColor}`}
            >
              {gate.label}
            </p>
            <p className="text-sm font-medium text-[#aaa]">{gate.name}</p>
            <p className="text-[11px] text-[#555] mt-2 leading-snug">
              {gate.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
