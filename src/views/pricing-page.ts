import { layout } from "./layout.js";

export function renderPricingPage(): string {
  const body = `
    <!-- Header -->
    <header class="border-b border-criteria-border">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" class="text-criteria-white font-bold tracking-wider">criteria.agency</a>
        <span class="text-criteria-muted text-sm">La IA genera. El criterio decide.</span>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-16">
      <!-- Hero -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-bold text-criteria-white mb-4">
          Video profesional con IA.<br>
          <span class="text-criteria-accent">Con criterio.</span>
        </h1>
        <p class="text-xl text-criteria-text max-w-2xl mx-auto">
          20 anos de experiencia en produccion codificados en un sistema que exige calidad profesional antes de entregar.
        </p>
      </div>

      <!-- Billing toggle -->
      <div class="flex justify-center mb-12">
        <div class="bg-criteria-dark border border-criteria-border rounded-full p-1 flex">
          <button id="toggleMonthly" class="px-6 py-2 rounded-full text-sm font-medium bg-criteria-accent text-black transition-all">
            Mensual
          </button>
          <button id="toggleYearly" class="px-6 py-2 rounded-full text-sm font-medium text-criteria-muted transition-all">
            Anual <span class="text-green-400 text-xs ml-1">2 meses gratis</span>
          </button>
        </div>
      </div>

      <!-- Pricing cards -->
      <div class="grid md:grid-cols-3 gap-6 mb-16">

        <!-- Starter -->
        <div class="bg-criteria-dark border border-criteria-border rounded-2xl p-8 flex flex-col">
          <h3 class="text-lg font-semibold text-criteria-white mb-2">Starter</h3>
          <p class="text-criteria-muted text-sm mb-6">Para fundadores y empresas pequenas</p>

          <div data-billing="monthly">
            <div class="mb-1">
              <span class="text-criteria-accent text-3xl font-bold">$300</span>
              <span class="text-criteria-muted">/mes</span>
            </div>
            <p class="text-criteria-muted text-sm mb-6">
              <span class="line-through">$500/mes</span> — precio early adopter (3 meses)
            </p>
          </div>
          <div data-billing="yearly" class="hidden">
            <div class="mb-1">
              <span class="text-criteria-accent text-3xl font-bold">$417</span>
              <span class="text-criteria-muted">/mes</span>
            </div>
            <p class="text-criteria-muted text-sm mb-6">$5,000/ano (2 meses gratis)</p>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> 1 video profesional/mes (hasta 2 min)
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> 5 quality gates por proyecto
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Portal de revision con comentarios
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> AI Copilot para briefs
            </li>
            <li class="flex items-start gap-2 text-criteria-muted text-sm">
              <span class="mt-0.5">&#8212;</span> Brand Builder (proximamente)
            </li>
            <li class="flex items-start gap-2 text-criteria-muted text-sm">
              <span class="mt-0.5">&#8212;</span> Comunicar (proximamente)
            </li>
          </ul>

          <button
            class="checkout-btn w-full py-3 bg-criteria-gray border border-criteria-border rounded-lg text-criteria-white font-medium hover:bg-criteria-border transition-colors"
            data-tier="starter"
          >
            Empezar gratis — 30 dias
          </button>
        </div>

        <!-- Pro (featured) -->
        <div class="bg-criteria-dark border-2 border-criteria-accent rounded-2xl p-8 flex flex-col relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-criteria-accent text-black text-xs font-bold px-4 py-1 rounded-full">
            MAS POPULAR
          </div>

          <h3 class="text-lg font-semibold text-criteria-white mb-2">Pro</h3>
          <p class="text-criteria-muted text-sm mb-6">Para equipos de marketing</p>

          <div data-billing="monthly">
            <div class="mb-1">
              <span class="text-criteria-accent text-3xl font-bold">$1,200</span>
              <span class="text-criteria-muted">/mes</span>
            </div>
            <p class="text-criteria-muted text-sm mb-6">
              <span class="line-through">$2,000/mes</span> — precio early adopter (3 meses)
            </p>
          </div>
          <div data-billing="yearly" class="hidden">
            <div class="mb-1">
              <span class="text-criteria-accent text-3xl font-bold">$1,667</span>
              <span class="text-criteria-muted">/mes</span>
            </div>
            <p class="text-criteria-muted text-sm mb-6">$20,000/ano (2 meses gratis)</p>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> 4 videos profesionales/mes (hasta 5 min)
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> 5 quality gates por proyecto
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Portal de revision con comentarios
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> AI Copilot para briefs
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Soporte prioritario
            </li>
            <li class="flex items-start gap-2 text-criteria-muted text-sm">
              <span class="mt-0.5">&#8212;</span> Brand Builder (proximamente)
            </li>
            <li class="flex items-start gap-2 text-criteria-muted text-sm">
              <span class="mt-0.5">&#8212;</span> Comunicar (proximamente)
            </li>
          </ul>

          <button
            class="checkout-btn w-full py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
            data-tier="pro"
          >
            Empezar gratis — 30 dias
          </button>
        </div>

        <!-- Enterprise -->
        <div class="bg-criteria-dark border border-criteria-border rounded-2xl p-8 flex flex-col">
          <h3 class="text-lg font-semibold text-criteria-white mb-2">Enterprise</h3>
          <p class="text-criteria-muted text-sm mb-6">Para empresas multi-mercado</p>

          <div class="mb-6">
            <span class="text-criteria-white text-3xl font-bold">Personalizado</span>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Videos ilimitados + formatos premium
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Account Executive dedicado
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Multiples marcas + Brand Guardian
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Pauta gestionada incluida
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Integraciones personalizadas
            </li>
            <li class="flex items-start gap-2 text-criteria-text text-sm">
              <span class="text-green-400 mt-0.5">&#10003;</span> Todo lo de Pro +
            </li>
          </ul>

          <a
            href="mailto:hola@criteria.agency?subject=Enterprise%20inquiry"
            class="w-full py-3 bg-criteria-gray border border-criteria-border rounded-lg text-criteria-white font-medium hover:bg-criteria-border transition-colors text-center block"
          >
            Contactar
          </a>
        </div>
      </div>

      <!-- FAQ -->
      <div class="max-w-2xl mx-auto">
        <h2 class="text-2xl font-bold text-criteria-white text-center mb-8">Preguntas frecuentes</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-criteria-white font-medium mb-2">Que incluye el trial de 30 dias?</h3>
            <p class="text-criteria-text text-sm">Acceso completo al plan que elijas, incluyendo 1 proyecto de video. Sin tarjeta de credito. Si no te convence, simplemente no continuas.</p>
          </div>
          <div>
            <h3 class="text-criteria-white font-medium mb-2">Que es el precio early adopter?</h3>
            <p class="text-criteria-text text-sm">Los primeros clientes reciben 40% de descuento durante 3 meses. Despues, el precio pasa al valor regular. Premiar a quienes confian desde el inicio.</p>
          </div>
          <div>
            <h3 class="text-criteria-white font-medium mb-2">Que son los quality gates?</h3>
            <p class="text-criteria-text text-sm">Cada video pasa por 5 puntos de control de calidad antes de llegar a ti. Nuestro sistema tiene el criterio de 20 anos de produccion profesional codificado en cada revision.</p>
          </div>
          <div>
            <h3 class="text-criteria-white font-medium mb-2">Puedo cancelar en cualquier momento?</h3>
            <p class="text-criteria-text text-sm">Si. Sin contratos a largo plazo. Cancela cuando quieras y tu suscripcion se mantiene activa hasta el final del periodo pagado.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-criteria-border mt-16">
      <div class="max-w-5xl mx-auto px-6 py-8 text-center">
        <p class="text-criteria-muted text-sm">La IA genera. El criterio decide.</p>
        <p class="text-criteria-muted text-xs mt-2">&copy; 2026 criteria.agency</p>
      </div>
    </footer>

    <!-- Checkout modal -->
    <div id="checkoutModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
      <div class="bg-criteria-dark border border-criteria-border rounded-2xl p-8 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-criteria-white mb-2">Empezar gratis</h3>
        <p class="text-criteria-muted text-sm mb-6">30 dias gratis, sin tarjeta de credito.</p>

        <form id="checkoutForm" class="space-y-4">
          <input type="hidden" id="selectedTier" value="">
          <div>
            <label class="text-criteria-text text-sm block mb-1">Nombre</label>
            <input type="text" id="checkoutName" required
              class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent" />
          </div>
          <div>
            <label class="text-criteria-text text-sm block mb-1">Email</label>
            <input type="email" id="checkoutEmail" required
              class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent" />
          </div>
          <div>
            <label class="text-criteria-text text-sm block mb-1">Empresa</label>
            <input type="text" id="checkoutCompany" required
              class="w-full bg-criteria-gray border border-criteria-border rounded-lg px-4 py-2.5 text-criteria-light placeholder-criteria-muted focus:outline-none focus:border-criteria-accent" />
          </div>
          <button type="submit" id="checkoutSubmit"
            class="w-full py-3 bg-criteria-accent text-black rounded-lg font-medium hover:bg-amber-400 transition-colors">
            Comenzar mi trial gratuito
          </button>
          <button type="button" id="checkoutCancel"
            class="w-full py-2 text-criteria-muted text-sm hover:text-criteria-light transition-colors">
            Cancelar
          </button>
        </form>
      </div>
    </div>

    <script>
      // Billing period toggle
      let billingPeriod = "monthly";
      const toggleMonthly = document.getElementById("toggleMonthly");
      const toggleYearly = document.getElementById("toggleYearly");

      function updateBilling(period) {
        billingPeriod = period;
        document.querySelectorAll("[data-billing=monthly]").forEach(el => el.classList.toggle("hidden", period !== "monthly"));
        document.querySelectorAll("[data-billing=yearly]").forEach(el => el.classList.toggle("hidden", period !== "yearly"));

        if (period === "monthly") {
          toggleMonthly.classList.add("bg-criteria-accent", "text-black");
          toggleMonthly.classList.remove("text-criteria-muted");
          toggleYearly.classList.remove("bg-criteria-accent", "text-black");
          toggleYearly.classList.add("text-criteria-muted");
        } else {
          toggleYearly.classList.add("bg-criteria-accent", "text-black");
          toggleYearly.classList.remove("text-criteria-muted");
          toggleMonthly.classList.remove("bg-criteria-accent", "text-black");
          toggleMonthly.classList.add("text-criteria-muted");
        }
      }

      toggleMonthly.addEventListener("click", () => updateBilling("monthly"));
      toggleYearly.addEventListener("click", () => updateBilling("yearly"));

      // Checkout modal
      const modal = document.getElementById("checkoutModal");
      const tierInput = document.getElementById("selectedTier");

      document.querySelectorAll(".checkout-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          tierInput.value = btn.dataset.tier;
          modal.classList.remove("hidden");
        });
      });

      document.getElementById("checkoutCancel").addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });

      // Checkout form
      document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("checkoutSubmit");
        btn.disabled = true;
        btn.textContent = "Procesando...";

        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tier: tierInput.value,
              billingPeriod,
              name: document.getElementById("checkoutName").value,
              email: document.getElementById("checkoutEmail").value,
              company: document.getElementById("checkoutCompany").value,
            }),
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            showToast(data.error || "Error al crear la sesion de pago", "error");
            btn.disabled = false;
            btn.textContent = "Comenzar mi trial gratuito";
          }
        } catch {
          showToast("Error de conexion", "error");
          btn.disabled = false;
          btn.textContent = "Comenzar mi trial gratuito";
        }
      });
    </script>
  `;

  return layout("Pricing", body);
}

export function renderCheckoutSuccess(): string {
  return layout(
    "Bienvenido",
    `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center max-w-lg px-6">
        <div class="text-5xl mb-6">&#127881;</div>
        <h1 class="text-3xl font-bold text-criteria-white mb-4">Bienvenido a criteria.agency</h1>
        <p class="text-criteria-text mb-2">Tu trial de 30 dias ha comenzado.</p>
        <p class="text-criteria-muted mb-8">Recibiras un email con los proximos pasos para crear tu primer proyecto de video.</p>
        <p class="text-criteria-accent font-medium">La IA genera. El criterio decide.</p>
      </div>
    </div>
    `,
  );
}

export function renderCheckoutCancel(): string {
  return layout(
    "Vuelve pronto",
    `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center max-w-lg px-6">
        <h1 class="text-2xl font-bold text-criteria-white mb-4">No hay prisa</h1>
        <p class="text-criteria-text mb-8">Cuando estes listo, tu trial de 30 dias te estara esperando. Sin compromiso.</p>
        <a href="/pricing" class="text-criteria-accent hover:underline">Volver a ver los planes</a>
      </div>
    </div>
    `,
  );
}
