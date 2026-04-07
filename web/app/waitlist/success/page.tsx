import Nav from "@/components/nav";
import Footer from "@/components/footer";

export default function WaitlistSuccess() {
  return (
    <>
      <Nav />
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-6">🎬</div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">
            Estas en la lista!
          </h1>
          <p className="text-brand-muted mb-2">
            Gracias por unirte. Recibiras un email de bienvenida en los
            proximos minutos.
          </p>
          <p className="text-brand-muted mb-8">
            Te avisaremos cuando la beta este lista.
          </p>
          <a
            href="/"
            className="text-brand-gold hover:underline font-medium"
          >
            &larr; Volver al inicio
          </a>
          <p className="mt-12 text-sm text-gray-300 italic">
            La IA genera. El criterio decide.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
