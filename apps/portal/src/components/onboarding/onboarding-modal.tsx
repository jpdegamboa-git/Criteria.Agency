'use client';

import { useState } from 'react';

interface OnboardingModalProps {
  onComplete: (path: 'has_brand' | 'from_scratch') => void;
}

/**
 * Onboarding modal — bifurcated flow (spec §7)
 *
 * Path A: "Tengo marca" → Brand Builder Layer 0 Path A (scraper + existing materials)
 * Path B: "Empiezo de cero" → Brand Builder Layer 0 Path B (3 preguntas)
 */
export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<'welcome' | 'choose'>('welcome');
  const [loading, setLoading] = useState(false);

  async function handleChoice(path: 'has_brand' | 'from_scratch') {
    setLoading(true);
    // Trigger Brand Builder Layer 0 via API
    try {
      await fetch('/api/brand-builder/onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
    } catch {
      // Non-blocking — even if the API call fails, continue onboarding UI
    }
    onComplete(path);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        {step === 'welcome' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-criteria-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-criteria-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bienvenido a criteria.agency
            </h2>
            <p className="text-gray-600 mb-2">
              Soy <strong>MARA</strong>, tu asistente de marketing. Antes de empezar, necesito conocer tu marca.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Todo lo que proceses aquí es confidencial y solo tuyo.
            </p>
            <button
              onClick={() => setStep('choose')}
              className="w-full py-3 bg-criteria-600 hover:bg-criteria-700 text-white font-medium rounded-xl transition-colors"
            >
              Empecemos
            </button>
          </div>
        )}

        {step === 'choose' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cuál es tu situación?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Esto nos ayuda a construir tu marca de la manera correcta.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleChoice('has_brand')}
                disabled={loading}
                className="w-full text-left p-4 border-2 border-gray-200 hover:border-criteria-400 hover:bg-criteria-50 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-criteria-100 group-hover:bg-criteria-200 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-criteria-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Tengo una marca establecida</p>
                    <p className="text-sm text-gray-500 mt-0.5">Ya tenemos identidad, sitio web o materiales de marca</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleChoice('from_scratch')}
                disabled={loading}
                className="w-full text-left p-4 border-2 border-gray-200 hover:border-criteria-400 hover:bg-criteria-50 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Empiezo desde cero</p>
                    <p className="text-sm text-gray-500 mt-0.5">Negocio nuevo o sin identidad de marca definida</p>
                  </div>
                </div>
              </button>
            </div>

            {loading && (
              <p className="text-center text-sm text-gray-500 mt-4">Configurando tu marca...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
