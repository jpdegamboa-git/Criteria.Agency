import WaitlistForm from "@/components/waitlist-form";

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
      <div className="relative">
        <WaitlistForm source="cta" />
      </div>
    </section>
  );
}
