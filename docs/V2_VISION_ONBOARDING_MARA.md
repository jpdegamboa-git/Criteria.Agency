# criteria.agency — V2 Vision: Onboarding, Brand DNA, MARA & Marketplace

> Documento de ideas estratégicas para la evolución post-MVP.
> Generado en sesión de pensamiento estratégico — 2026-04-09.
> NO es un spec técnico. NO modifica el BUILD_ORDER ni los specs aprobados de V1.
> Es referencia de diseño para cuando llegue el momento de implementar estas piezas.

---

## 1. Reflexión sobre obsolescencia

### El riesgo real

El riesgo no es que Claude u otra IA genérica haga obsoleto a criteria.agency. El riesgo es que "good enough genérico" cierre el gap con el producto antes de que criteria.agency tenga distribución y datos acumulados.

### Por qué criteria.agency NO es reemplazable por IA genérica

- **criteria.agency no es un SaaS de marketing con IA. Es una plataforma donde profesionales de marketing usan IA como infraestructura para dar servicios escalables a PyMEs.**
- Un agente genérico reemplaza herramientas. No reemplaza relaciones profesionales aumentadas por IA.
- El Brand DNA acumulado por cliente es dato propietario que crece con el tiempo.
- El contexto LATAM (idioma, cultura, pricing, realidad operativa de PyMEs) es un gap que productos genéricos no cierran pronto.
- El loop IA ↔ profesionales ↔ datos de cliente es un flywheel que ningún agente genérico replica.

### Moats reales

- Datos de Brand DNA acumulados por cliente (switching cost creciente).
- Marketplace curado de profesionales.
- Domain expertise codificada en criterios de evaluación y prompts.
- Experiencia simplificada para gente no-técnica en LATAM.

### Lo que NO es moat

- La orquestación técnica (Inngest, pipelines, etc.) — es fontanería reemplazable.
- La cantidad de motores — el valor está en la calidad del criterio, no en la cantidad.

---

## 2. criteria.agency como Three-Sided Marketplace

### Los tres lados

1. **PyMEs** — pagan suscripción por el sistema de IA + acceden a workshops.
2. **Profesionales curados** — dan workshops y usan la plataforma como herramienta de trabajo.
3. **IA que aprende** — mejora con cada interacción entre los otros dos lados.

### Flywheel

Más clientes → atraen mejores profesionales → generan mejores inputs → la IA se hace más inteligente → produce mejores resultados → atraen más clientes.

### Marketplace de profesionales

- Se cobra aparte de la suscripción, pero solo accesible para suscriptores.
- Curado: los profesionales deben mantener un estándar para permanecer.
- Scoring basado en resultados: el sistema mide si un profesional genera Brand DNAs que producen mejores resultados en los motores.
- Matching inteligente: con datos suficientes, el sistema correlaciona qué tipo de profesional genera mejores resultados para qué industria o tamaño de negocio.
- **Fase inicial:** curación manual (Juan Pablo + 2-3 profesionales de confianza). El marketplace formal se construye cuando haya 20-30 clientes y datos para el matching.
- Un agente de scouting puede evaluar presencia real de candidatos: publicaciones, resultados visibles, posicionamiento. Aplicarle al consultor el mismo criterio analítico que criteria.agency le aplica a las marcas.

---

## 3. Diseño del Onboarding

### Principios

- **Híbrido:** interfaz estructurada con momentos conversacionales. No es formulario puro ni chat libre.
- **Multi-usuario y asincrónico:** múltiples personas de la empresa participan por separado, a su ritmo.
- **Anónimo:** las respuestas no se atribuyen a personas específicas para evitar autocensura y politización.
- **Adaptado a la persona, no solo a la empresa:** respetar el tiempo, rol y preferencias del usuario.
- **Nunca bloqueante:** una persona puede completar el onboarding sola. Cada participante adicional enriquece el Brand DNA pero no es requisito.
- **5-8 minutos** la primera persona. ~3 minutos los invitados (datos básicos ya están).

### Antes de preguntar sobre la marca, preguntar sobre la persona

- ¿Cuánto tiempo tienes? (5 min / 15 min / sin prisa)
- ¿Cuál es tu rol?
- ¿Cómo prefieres responder? (opciones / escribiendo / hablando)
- El sistema adapta la experiencia según estas respuestas.
- Si alguien abandona a la mitad, el sistema recuerda dónde quedó y retoma sin fricción.

### Formatos de preguntas y su propósito

| Formato | Para qué sirve | Ejemplo |
|---------|----------------|---------|
| Selección múltiple | Comparabilidad entre participantes, baja fricción | "¿Cuál de estas palabras describe mejor a tu empresa?" |
| Pares de opuestos ("esto o esto") | Personalidad de marca rápida, ideal para multi-usuario | "Tu empresa es más tradición o más innovación" |
| Calificaciones (1-5) | Medir intensidad y matices | "¿Qué tan importante es X para tu negocio?" |
| Preguntas abiertas | Las más ricas, pocas, al final de secciones | "¿Qué es lo que nunca cambiarías de tu negocio?" |

### Flujo del onboarding

1. **Empieza ligero.** Nombre, qué haces, cuántos son. Formulario básico, avance rápido.
2. **Pares de opuestos.** 10-12 pares. Rápido, visual, casi lúdico. ~1 minuto. Genera perfil de personalidad de marca.
3. **Calificaciones.** 5-7 valores, escala simple. Importancia de cada uno.
4. **2-3 preguntas abiertas.** Las que importan:
   - "¿Qué te dicen tus clientes cuando te recomiendan?"
   - "¿Qué es lo que nunca cambiarías de tu negocio aunque te pagaran por hacerlo?"
   - "Si tu empresa desapareciera mañana, ¿qué perderían tus clientes?"

### Qué preguntar vs qué inferir

**Preguntar (subjetivo, particular):**
- Quién eres y qué haces (versión honesta, no elevator pitch).
- Quién es tu mejor cliente y por qué te elige.
- Qué te importa de verdad en cómo haces las cosas (valores reales).
- Qué no eres y qué no quieres ser (anti-valores).
- Adónde quieres llegar (ambición real).

**Inferir (la IA construye a partir de las respuestas):**
- Personalidad de marca, tono de voz, arquetipos.
- Posicionamiento competitivo.
- Propuesta de valor articulada.
- Industria, escala, contexto geográfico.

### Manejo de respuestas vagas

- Si alguien dice "nuestro diferencial es la calidad", el sistema hace repregunta: "¿Me puedes dar un ejemplo concreto?"
- Máximo 2-3 repreguntas por tema.
- Si sigue vago, se registra como área de baja definición. Eso es información valiosa, no un error.
- Las áreas de baja definición justifican workshops.

### Multi-usuario

- El sistema puede hacer preguntas ligeramente diferentes a cada participante para triangular.
- Si el dueño dijo "tradición", al siguiente participante se le pregunta sin inducir la respuesta.
- Divergencias se detectan automáticamente.

### Tono del onboarding

- Colega competente que hace buenas preguntas, no consultor pretencioso ni robot.
- Directo, cálido, sin jerga innecesaria.
- Da contexto de por qué importa cada pregunta.
- Reconoce respuestas buenas sin ser falso.
- Adaptado a la cultura LATAM: la relación viene antes que el negocio.

---

## 4. Presentación de resultados

### Momento 1: La revelación

- Resumen visual de la marca en una sola pantalla.
- No texto largo. Perfil visual: pares de opuestos como mapa de personalidad, diferencial en una frase, cliente ideal en una frase, valores en tres palabras.
- En 10 segundos el usuario puede decir "sí, eso somos" o ajustar.
- El Brand DNA se presenta como propuesta que el usuario valida y ajusta, no como producto terminado.

### Momento 2: El mapa de alineación (si hubo múltiples participantes)

- Vista simple: verde donde coinciden, amarillo donde difieren.
- Anónimo, sin juicio.
- Posibilidad de explorar cada divergencia.
- Esto es equivalente a un brand alignment audit que las consultoras cobran decenas de miles de dólares.

### Momento 3: La invitación a profundizar

No es un cierre — es una apertura. El sistema ofrece caminos según lo que respondiste:

- **Si respondiste con riqueza:** "Ya sabemos quién eres. ¿Quieres que analicemos tu competencia?" → activa Analyst.
- **Si hay áreas vagas:** "Hay oportunidad de definir mejor tu público. ¿Quieres explorar ahora o agendar un workshop?" → puente al marketplace.
- **Si solo participó una persona:** "Invita a alguien más para una visión más completa."
- **Si hay divergencias fuertes:** "Un profesional puede ayudarte a encontrar claridad." → workshop.

No se muestran todos los caminos — solo 1-2, los más relevantes. Prioridad: lo que más impacto tiene en la calidad de lo que los motores van a producir.

---

## 5. Caminos de profundización

### Profundizar en identidad
- Si valores, diferencial o personalidad fueron vagos.
- 3-4 preguntas adicionales, ~2 minutos. Autoservicio.

### Conocer a tu cliente
- Si público objetivo fue genérico.
- Quién compra hoy vs quién quisieras. Por qué eligen, por qué se van.
- Alimenta directamente al Strategist.

### Explorar tu competencia
- Si mencionó competidores o el sistema los puede inferir.
- Activa Analyst para análisis comparativo.
- Enriquece Brand DNA con posicionamiento relativo.

### Invitar a tu equipo
- Si solo participó una persona.
- Simple, sin presión.

### Agendar un workshop
- Si hay baja definición o divergencias fuertes.
- Puente al marketplace de profesionales.

### Principio: el onboarding nunca termina
- Los mismos caminos de profundización aplican durante toda la vida del cliente.
- "Conocer a tu cliente" en semana 1 → "Re-evaluar tu cliente ideal" en mes 6.
- Es una espiral que se amplía, no una línea con final.

---

## 6. Brand DNA como entidad viva

### Estructura conceptual

El Brand DNA no es un documento estático. Es un registro vivo con procedencia.

**Capas:**
1. **Esencia** — quiénes son, diferencial, valores. Sale de preguntas directas.
2. **Identidad inferida** — personalidad, tono, arquetipos, posicionamiento. La IA construye a partir de la esencia.
3. **Mapa de alineación** — dónde coincide el equipo, dónde no. Sale de respuestas multi-usuario.
4. **Áreas de baja definición** — lo vago, lo no respondido. Input para workshops.
5. **Capa temporal** — evolución del Brand DNA en el tiempo. ¿Ha cambiado? ¿Se ha alineado más?

### Historial de contribuciones

Cada enriquecimiento del Brand DNA se registra con su fuente:
- Onboarding automático
- Workshop con profesional X
- Observación del Analyst Motor
- Ajuste manual del cliente
- Aprendizaje del sistema (qué contenido funciona mejor)

Esto es una tabla, no un campo. Permite:
- Trazar qué fuente produjo qué mejora en resultados (para scoring de profesionales).
- Medir evolución temporal.
- Vincular resultados de motores hacia atrás a la calidad del input.

### Señales de vida entre interacciones

El Brand DNA debe dar señales de actividad constantes:
- Micro-insights del Analyst: "tu competidor cambió su posicionamiento."
- Resultados de contenido: "el contenido alineado con tu valor X funciona mejor."
- Cada señal genera impulso para la siguiente profundización.
- Cada interacción incrementa silenciosamente el switching cost.

---

## 7. Personalidad de MARA

### Rasgos centrales

- **No complaciente pero respetuosa.** Dice lo que necesitas oír, no lo que quieres oír. Gana confianza porque a veces dice que no. Cuando dice que algo está bien, le crees.
- **Amable y profesional.** Constante. Trata igual al panadero con 3 empleados que a la empresa con 40.
- **Nunca condescendiente.** No hace sentir al cliente que debería saber algo que no sabe.

### Adaptación

**Al idioma y registro:** si el cliente escribe informal, MARA responde natural. Si es brasileño, portugués. No fuerza jerga local pero no suena a traducción.

**Al nivel de sofisticación:** al panadero le dice "lo que la gente siente cuando piensa en tu negocio". Al director de marketing le dice "brand equity". Inferido del onboarding — vocabulario, rol, tamaño de empresa.

**Al estado emocional:** a alguien frustrado le da una cosa concreta. A alguien entusiasmado le canaliza la energía. A alguien inseguro le da más contexto.

### Límites de adaptación

- Se adapta al registro pero no imita. Si el cliente tiene mala ortografía, MARA no la replica. Si usa groserías, MARA no responde con groserías.
- Mantiene un piso de profesionalismo siempre.
- Tiene identidad propia consistente — los rasgos no cambian, el vocabulario sí.

### Manifestaciones concretas

- **En onboarding:** si alguien dice "nuestro diferencial es la calidad", no dice "excelente". Dice: "todos tus competidores también creen eso. ¿Qué es lo específico que tú haces diferente?"
- **En resultados:** si el Brand DNA revela posicionamiento débil, no lo esconde: "tu marca tiene fortalezas aquí, pero el posicionamiento necesita trabajo. Es normal y es para lo que estamos."
- **En el día a día:** si el cliente produce algo que contradice su Brand DNA: "puedes hacerlo, pero esto se aleja del tono que definimos. ¿Es intencional?"
- **En workshops:** si detecta una dirección débil: "entiendo la dirección, pero quiero señalar un riesgo que veo en los datos."

---

## 8. MARA por WhatsApp

### Por qué es casi obligatorio para LATAM

WhatsApp es la infraestructura de comunicación real de PyMEs en la región. El cliente vive ahí.

### Qué funciona en WhatsApp

- Onboarding: preguntas cortas, pares de opuestos, calificaciones. "¿Tienes 5 minutos?"
- Micro-insights: "tu contenido sobre autenticidad está funcionando mejor."
- Invitación multi-usuario: "mándame el número de tu socia."
- Preguntas puntuales a MARA.
- Notificaciones de resultados.

### Qué NO va en WhatsApp

- Resultados completos del Brand DNA.
- Mapa de alineación del equipo.
- Estrategia detallada.
- Dashboards y reportes.

WhatsApp es canal ligero que alimenta la plataforma rica. "Tu Brand DNA está listo, míralo aquí."

### Consideraciones de negocio

- API de WhatsApp Business tiene costos por mensaje → incluir en modelo de pricing.
- Un cliente que interactúa por WhatsApp 3x/semana >> uno que abre el dashboard 1x/mes.

### Voz como input

- Posibilidad futura: onboarding hablado. El sistema transcribe, extrae, construye Brand DNA.
- Un dueño de PyME puede hacer el onboarding hablando 5 minutos mientras maneja.
- Diferenciador brutal: nadie quiere escribir un prompt largo, pero todo el mundo puede hablar de su negocio.

---

## 9. User Score: Madurez y Performance

### Dos dimensiones

El score interno tiene dos ejes que se miden independientemente.

### Madurez en marketing (qué tan desarrollada está su operación)

| Variable | Qué mide |
|----------|----------|
| Claridad de marca | Completitud y coherencia del Brand DNA. Vacíos, alineación multi-usuario. |
| Consistencia estratégica | ¿Tiene estrategia definida y la sigue? ¿El contenido está alineado? |
| Actividad operativa | Frecuencia de uso de motores, regularidad de producción, consistencia. |
| Sofisticación analítica | ¿Mide resultados y actúa en base a ellos? ¿Revisa reportes? ¿Ajusta? |

### Performance (qué resultados obtiene)

| Variable | Qué mide |
|----------|----------|
| Engagement | ¿Su contenido genera interacción? |
| Coherencia de marca | ¿Lo que produce se siente como una sola marca? Contenido vs Brand DNA. |
| Tendencia | ¿Métricas mejoran mes a mes? Dirección > posición actual. |
| Eficiencia | ¿Cuánto valor saca por token gastado? |

### Cuadrantes

| | Baja performance | Alta performance |
|---|---|---|
| **Baja madurez** | Necesita onboarding completo + probablemente workshop | Tiene instinto, falta estructura. Responde bien a criteria.agency. |
| **Alta madurez** | Todo definido pero algo falla. Analyst + Strategist son clave. | Mejor cliente. Optimización, no transformación. Plan alto. |

### Usos del score

- **MARA adapta su interacción:** baja madurez → más guía, sugerencias de profundización. Alta madurez → insights de performance, mayor profundidad técnica.
- **Recomendación de workshops:** baja madurez → workshops de definición. Baja performance → workshops de optimización táctica.
- **Matching con profesionales:** el score dicta qué tipo de ayuda necesita.
- **Sentido de progreso para el cliente:** "cuando empezaste tenías 40% de alineación. Hoy tienes 85%." Justifica la suscripción.

---

## 10. Dolores del cliente objetivo

Para referencia — los dolores reales que criteria.agency resuelve:

1. **Abrumado por las opciones de IA.** No sabe qué usar ni cómo. criteria.agency es "alguien competente se está haciendo cargo."
2. **Frustrado por intentos con ChatGPT.** Probó, el resultado fue genérico/malo, concluyó que "la IA es tonta." criteria.agency tiene que demostrar diferencia en los primeros 5 minutos.
3. **FOMO.** Ve a todos hablando de IA y siente que se queda atrás.
4. **Freelancers poco confiables.** El marketplace curado resuelve esto directamente.
5. **Agencias caras e ineficientes.** criteria.agency ofrece misma calidad de criterio profesional a fracción del costo.

---

## 11. Agent Marketplace: Agentes Customizables como Modelo de Negocio

### El principio

Todos los agentes creativos y estratégicos de criteria.agency son customizables. No solo el Creative Director — también el Strategist, Film Director, DP, Diseñador, y cualquier agente donde el "criterio" y el "ojo" sean diferenciadores subjetivos.

### Tres capas de agentes

| Capa | Qué es | Costo |
|------|--------|-------|
| **Default** | Viene con el plan. Se adapta orgánicamente al cliente con su uso, Brand DNA e historial. | Incluido en suscripción |
| **Interno criteria.agency** | Entrenado internamente con metodología propia. Criterio superior al default por refinamiento deliberado. | Costo adicional por uso (tokens) |
| **Clon de humano real** | Criterio destilado de un profesional real invitado. Regalías por uso. | Premium (refleja calidad + regalías) |

### Entrenamiento orgánico (aplica a TODOS los agentes)

Todos los agentes — default, internos o clones — siguen aprendiendo con la experiencia del cliente. El cliente NO entrena manualmente a sus agentes. El entrenamiento viene natural del uso:

- **Feedback explícito:** aprobaciones, rechazos, notas sobre outputs.
- **Feedback implícito:** qué contenido tuvo mejor performance, qué estrategias generaron resultados medibles.
- **Contexto acumulado:** Brand DNA enriquecido, preferencias documentadas, historial de decisiones.

Esto genera lock-in natural no hostil: el valor acumulado es real y no se transfiere fácil.

### Opciones del cliente

El cliente tiene dos opciones simples:

1. **Usar el default** — que ya se adapta a su marca orgánicamente.
2. **Contratar un agente premium** del catálogo — que viene con criterio superior desde el día uno y también se adapta con el uso.

No hay opción de "entrenar manualmente". La personalización es invisible y automática.

### Agentes clonados de humanos reales

**Solo por invitación.** criteria.agency selecciona y cuida la calidad del catálogo.

**Proceso de clonado (onboarding del creativo):**
- Sesiones estructuradas donde el creativo evalúa outputs, da feedback sobre decisiones estéticas, establece reglas y preferencias, selecciona referencias.
- Pares de opciones donde escoge y explica por qué.
- Articulación de reglas propias ("nunca uso luz plana para producto", "siempre arranco desde el dolor del cliente").
- Se destila su criterio en un paquete de configuración: prompts refinados, ejemplos de referencia, preferencias de estilo, reglas de evaluación.
- Todo montado sobre el mismo modelo base. No es fine-tuning del modelo, es configuración sofisticada.

**Score del creativo clonado:**
- Cada agente clonado tiene un score basado en resultados comprobables.
- Métricas: tasa de aprobación de outputs, engagement del contenido producido, paso de Brand Guardian sin fricciones.
- El score justifica el precio: mejor score → precio más alto por uso.
- Genera ranking natural en el catálogo.

**Dashboard del creativo:**
- El humano clonado VE cómo se usa su agente.
- Métricas visibles: número de clientes que lo usan, score comparativo vs otros agentes del mismo rol, regalías acumuladas, feedback agregado (fortalezas y áreas de mejora).
- Sin acceso a datos confidenciales del cliente.
- Incentivo de volver a sesiones de re-calibración si su score baja o pierde adopción.

**Regalías:**
- Cada vez que un cliente usa tokens con un agente premium clonado, un porcentaje va al creativo original.
- Trazable y limpio dentro del modelo de tokens existente.
- Ingreso pasivo para el creativo sobre su expertise.

### Qué agentes aplican para customización y cuáles no

**Aplica (criterio subjetivo es diferenciador):**
- Creative Director, Strategist, Film Director, DP, Diseñador, y roles donde el "estilo" y la "visión" son valor.

**No aplica tanto:**
- **Brand Guardian:** debe ser fiel a la marca del cliente, no a un estilo externo.
- **Analyst:** su valor es precisión del dato, no interpretación creativa.
- **Showrunner:** orquestador, no creativo.

### Valor para cada lado

**Para el cliente SMB en LATAM:**
- Acceso a nivel de talento que jamás podría contratar directamente.
- Una PyME en Panamá usando un DP "clonado" de alguien que ha filmado campañas globales.
- Disponible 24/7 y ya conoce su marca (por el entrenamiento orgánico).

**Para el creativo humano:**
- Ingreso pasivo sobre su expertise sin trabajar proyecto por proyecto.
- Visibilidad y reputación medible en la plataforma.
- Incentivo competitivo para mantener su clon actualizado.

**Para criteria.agency:**
- Contenido exclusivo del marketplace que ningún competidor puede replicar.
- Diferenciación real: el valor no está en el modelo base sino en el criterio acumulado.
- Efecto de red: más clientes → más data → mejores agentes → más clientes.
- Modelo de revenue adicional al SaaS base.

### Relación con el marketplace de profesionales (§2)

El marketplace de agentes clonados es complementario al marketplace de profesionales para workshops. Un profesional invitado puede:
- Dar workshops presenciales/virtuales (§2).
- Tener su criterio clonado como agente (§11).
- O ambos.

Son dos formas de monetizar su expertise en la plataforma, con regalías en ambos casos.

---

## Notas para implementación futura

- **Agent Marketplace es V2.** Pero la arquitectura de agentes en V1 debe contemplar que la configuración (system prompts, ejemplos, reglas de evaluación) sea modular y separada del código. El prompt_registry (DEC-145) ya soporta esto conceptualmente — cada agente lee su configuración de la base de datos, no hardcodeada.
- **El modelo de tokens en V1 debe ser extensible** para soportar comisiones por uso de agentes premium en V2. No requiere implementación ahora, pero la estructura de tracking de uso por agente debe existir.
- El marketplace de profesionales no requiere fase separada en BUILD_ORDER. Pero la Fase 2 (Brand Builder) debe diseñar el Brand DNA como entidad viva con historial de contribuciones desde el inicio.
- Los workshops iniciales son manuales (Juan Pablo + 2-3 profesionales). El marketplace formal viene con 20-30 clientes.
- La infraestructura de datos para scoring de profesionales se captura desde el día uno, aunque el agente de scoring se construya después.
- MARA por WhatsApp puede ser post-MVP pero la arquitectura de MARA debe contemplar múltiples canales.
- El user score se puede calcular desde que hay datos suficientes. La estructura para capturar las variables debe existir desde V1.
