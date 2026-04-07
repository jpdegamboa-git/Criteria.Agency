export default function TrustBar() {
  const cities = ["Washington DC", "New York", "Madrid", "Bogota"];

  return (
    <section className="border-t border-surface-border py-12 text-center">
      <p className="text-[11px] uppercase tracking-[3px] text-gray-300 mb-6">
        CLIENTES EN 4 PAISES
      </p>
      <div className="flex justify-center gap-12 items-center">
        {cities.map((city) => (
          <span
            key={city}
            className="text-[15px] font-semibold text-gray-300 tracking-wide hover:text-brand-dark transition-colors"
          >
            {city}
          </span>
        ))}
      </div>
    </section>
  );
}
