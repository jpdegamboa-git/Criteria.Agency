# Channel Manager Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capabilities: C-020 Gestión de canales tradicionales, C-022 Canal unificado
> Dolores: D-DST-08, D-DST-10

---

## 1. Concepto

Evolución de XA-002 (stub) a motor con pipeline propio. Experto en todos los canales — digitales, tradicionales y emergentes. Sirve a todos los motores de distribución con specs, costos estimados y mejores prácticas. Para canales tradicionales (C-020), coordina contratación via Marketplace.

---

## 2. Pipeline

```
[ch_request] → [ch_analysis] → [G1: recomendación válida] → [ch_specs] → [ch_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| ch_request | Interpretación de la consulta de canal, definición de scope | CH-L |
| ch_analysis | Análisis de canal(es): formatos, costos, audiencia, mejores prácticas | CH-001 o CH-002 |
| ch_specs | Specs técnicos detallados: formatos, dimensiones, pesos, duraciones, safe zones | CH-003 |
| ch_delivery | Entrega de recomendación y specs | CH-L |

---

## 3. Agentes

### CH-L — Channel Director (Líder)

- **Rol**: Interpreta requests de canal, recomienda mix de canales, aprueba specs. Evolución de XA-002
- **Pasos**: ch_request, ch_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader

### CH-001 — Digital Channel Specialist

- **Rol**: Expertise en canales digitales: social media (Meta, TikTok, LinkedIn, Twitter, Pinterest), search (Google, Bing), display, video (YouTube, Spotify), programmatic, email. Conoce formatos, costos, audiencias, mejores prácticas
- **Pasos**: ch_analysis (cuando canal es digital)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### CH-002 — Traditional Channel Specialist

- **Rol**: Expertise en canales tradicionales: TV (abierta, cable, streaming), radio, prensa (diarios, revistas), OOH (vallas, mupis, buses), cine, activaciones. Coordina contratación via Marketplace cuando el cliente quiere comprar medios
- **Pasos**: ch_analysis (cuando canal es tradicional)
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### CH-003 — Specs Engineer

- **Rol**: Genera specs técnicos detallados por canal: dimensiones exactas, resolución, formato de archivo, peso máximo, duración, safe zones, color space, audio specs. Usa channel-specs.json como base y lo extiende
- **Pasos**: ch_specs
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Recomendación | ch-g1 | ch_analysis | CH-L | 2 | Análisis completo, costos estimados, recomendación justificada |

---

## 5. Canales cubiertos

### Digitales (CH-001)

| Canal | Subcategorías |
|-------|--------------|
| Social Media | Meta (FB+IG), TikTok, LinkedIn, Twitter/X, Pinterest, Snapchat |
| Search | Google Ads (Search, Shopping, PMax), Bing Ads |
| Display | Google Display, Programmatic (DV360, TradeDesk) |
| Video | YouTube, Spotify, Connected TV |
| Email | Newsletters, flows, transactional |
| SEO | Organic search, content marketing |
| Messaging | WhatsApp Business, Telegram |

### Tradicionales (CH-002)

| Canal | Subcategorías |
|-------|--------------|
| TV | Abierta, cable, streaming/CTV, infomercial |
| Radio | AM/FM, streaming, podcast sponsorship |
| Prensa | Diarios, revistas, suplementos |
| OOH | Vallas, mupis, parabuses, espectaculares digitales |
| Cine | Pre-roll en salas |
| BTL | Activaciones, sampling, punto de venta |

---

## 6. Migración de XA-002

- XA-002 (Channel Manager stub) se depreca
- CH-L hereda su rol transversal
- `agents/_shared/channel-specs.json` sigue como knowledge base, accesible por CH-003
- Otros motores que referenciaban XA-002 ahora invocan al Channel Manager Motor como sub-proyecto

---

## 7. Invocación cross-motor

| Motor que invoca | Para qué |
|-----------------|----------|
| Ads | Specs de formato por plataforma de pauta |
| Community Management | Specs de formato por red social |
| Email Marketing | Specs de formato de email |
| SEO/Content | Specs de contenido web |
| Strategist | Recomendación de mix de canales para media plan |
| Events | Specs de canales de comunicación del evento |
| Marketplace | Contratación de medios tradicionales (via CH-002) |

---

## 8. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| CH-L:ch_request | [] | [json] | Interpretar request de canal. Definir: qué canal(es) se consultan, objetivo, presupuesto estimado, tipo de consulta (specs/recomendación/contratación) |
| CH-001:ch_analysis | [ch_request] | [text, json] | Analizar canal(es) digital(es): formatos disponibles, costos estimados (CPM/CPC/CPV), audiencia, mejores prácticas, limitaciones. Usar channel-specs.json |
| CH-002:ch_analysis | [ch_request] | [text, json] | Analizar canal(es) tradicional(es): formatos, costos estimados, alcance, frecuencia, ventajas/limitaciones. Si se requiere contratación, crear request para Marketplace |
| CH-003:ch_specs | [ch_request, ch_analysis] | [json] | Generar specs técnicos detallados: dimensiones, resolución, formato archivo, peso, duración, safe zones, color space. Output JSON estructurado |
| CH-L:ch_delivery | [ch_specs] | [text, json] | Compilar recomendación final con specs. Entregar al motor que invocó |

---

## 9. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes.

### Nuevos valores en enums

**projectStatusEnum**: `ch_request`, `ch_analysis`, `ch_specs`, `ch_delivery`

**artifactStepEnum**: `ch_request`, `ch_analysis`, `ch_specs`, `ch_delivery`

**gateTypeEnum**: `ch-g1`
