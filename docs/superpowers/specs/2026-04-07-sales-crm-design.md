# Sales/CRM Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capabilities: C-028 Captura de leads, C-029 Lead scoring, C-030 Pipeline de ventas, C-031 Propuestas comerciales, C-032 Atribución de origen
> Dolores: D-VTA-01, D-VTA-02, D-VTA-03, D-VTA-04, D-VTA-05, D-VTA-06, D-VTA-07, D-ROI-02

---

## 1. Concepto

Motor de ventas completo: desde captura de leads hasta cierre. CRM nativo de criteria.agency con pipeline Kanban, lead scoring BANT, generación de propuestas comerciales, y atribución de origen. Orquestador que coordina Email Marketing (nurture), Writers Room (copy de propuestas), Graphic Design (branding), y Financial Agent (pricing).

---

## 2. Pipeline

```
[sl_capture] → [sl_enrich] → [sl_score] → [G1: lead calificado] → [sl_nurture] → [sl_proposal] → [G2: propuesta aprobada] → [sl_negotiate] → [sl_close] → [sl_attribution] → [sl_delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| sl_capture | Lead centralizado de cualquier canal, deduplicado | SL-001 |
| sl_enrich | Lead enriquecido con datos públicos: empresa, cargo, tamaño, industria | SL-002 |
| sl_score | Score BANT + Fit + Intent. Clasificación: hot/warm/cold | SL-003 |
| sl_nurture | Secuencia de nurture coordinada con Email Marketing | SL-004 |
| sl_proposal | Propuesta comercial generada: copy (WR), branding (GD), pricing (XA-001) | SL-005 |
| sl_negotiate | Tracking de negociación, follow-ups, ajustes de propuesta | SL-L |
| sl_close | Cierre del deal: won o lost con razón | SL-L |
| sl_attribution | Atribución de origen: canal, campaña, contenido que generó el lead | SL-006 |
| sl_delivery | Reporte de cierre y métricas | SL-L |

---

## 3. Agentes

### SL-L — Sales Director (Líder)

- **Rol**: Evalúa pipeline de ventas, prioriza deals por probabilidad y valor, aprueba propuestas, gestiona negociaciones, cierra deals
- **Pasos**: sl_capture (initial review), sl_negotiate, sl_close, sl_delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader

### SL-001 — Lead Capture Agent

- **Rol**: Centraliza leads de todos los canales (formularios web, email, eventos, ads, referrals), detecta y elimina duplicados, normaliza datos de contacto
- **Pasos**: sl_capture
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

### SL-002 — Lead Enricher

- **Rol**: Enriquece leads con datos públicos: nombre de empresa, cargo, tamaño de empresa, industria, ubicación, perfiles de redes sociales, sitio web. Usa LLM general knowledge con [VERIFY] markers
- **Pasos**: sl_enrich
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### SL-003 — Lead Scorer

- **Rol**: Scoring multi-dimensional:
  - **Fit Score** (0-100): ¿El lead match con el ICP? (tamaño empresa, industria, cargo)
  - **Intent Score** (0-100): ¿Qué tan activo está? (páginas visitadas, emails abiertos, contenido descargado)
  - **BANT Score**: Budget (¿tiene presupuesto?), Authority (¿decide?), Need (¿tiene el dolor?), Timeline (¿cuándo?)
  - **Total Score**: weighted average → Hot (80+), Warm (50-79), Cold (<50)
- **Pasos**: sl_score
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

### SL-004 — Nurture Coordinator

- **Rol**: Coordina secuencias de nurture con Email Marketing basadas en score tier y etapa del funnel. Hot leads → fast track (sales call). Warm → nurture sequence. Cold → long-term drip
- **Pasos**: sl_nurture
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### SL-005 — Proposal Generator

- **Rol**: Genera propuestas comerciales profesionales. Coordina: Writers Room (copy de la propuesta), Graphic Design (template con branding del cliente), Financial Agent (pricing, descuentos, payment terms). Compila documento final
- **Pasos**: sl_proposal
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 65%
- **Nivel**: Sub
- **Importante**: NO escribe la propuesta — coordina WR y GD

### SL-006 — Attribution Analyst

- **Rol**: Atribuye cada deal cerrado a su canal/campaña de origen. Modelos: first-touch (primer contacto), last-touch (último antes de conversión), lineal (distribución equitativa), data-driven (cuando hay suficiente volumen)
- **Pasos**: sl_attribution
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Calificación | sl-g1 | sl_score | SL-L | 2 | Score calculado, clasificación correcta, datos suficientes para decidir |
| Propuesta | sl-g2 | sl_proposal | SL-L (human approval) | 2 | Propuesta completa, pricing validado, branding correcto |

---

## 5. Lead Pipeline Stages

| Stage | Descripción | Agente responsable |
|-------|------------|-------------------|
| new | Lead recién capturado | SL-001 |
| enriched | Datos públicos agregados | SL-002 |
| scored | Score calculado, clasificado hot/warm/cold | SL-003 |
| qualified | Pasó G1, confirmado como oportunidad real | SL-L |
| nurturing | En secuencia de nurture | SL-004 |
| proposal | Propuesta enviada | SL-005 |
| negotiation | En negociación activa | SL-L |
| won | Deal cerrado ganado | SL-L |
| lost | Deal cerrado perdido (con razón) | SL-L |

---

## 6. Invocación cross-motor

| Motor invocado | Para qué | Paso |
|----------------|----------|------|
| Email Marketing (EM) | Nurture sequences por score tier | sl_nurture |
| Writers Room (WR-003/WR-005) | Copy de propuestas comerciales | sl_proposal |
| Graphic Design | Template con branding para propuesta | sl_proposal |
| Financial Agent (XA-001) | Pricing, descuentos, payment terms | sl_proposal |
| Brand Guardian (XA-003) | Coherencia de propuestas con marca | sl-g2 |
| Analytics (futuro) | Datos de comportamiento para intent score | sl_score |
| Ads / CM / SEO / Events | Datos de origen para atribución | sl_attribution |

---

## 7. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| SL-001:sl_capture | [] | [json] | Capture lead from channel. Normalize: name, email, company, phone, source (web_form/email/event/ad/referral), sourceDetail (campaign name, event name). Deduplicate against existing leads by email. Output: {lead, is_duplicate, merged_with} |
| SL-002:sl_enrich | [sl_capture] | [text, json] | Enrich lead with public data: company name, size (employees), industry, HQ location, website, LinkedIn profile, title/role. Use LLM general knowledge — mark all data with [VERIFY]. Output: {enriched_fields, confidence_scores} |
| SL-003:sl_score | [sl_capture, sl_enrich] | [text, json] | Calculate multi-dimensional score: Fit (0-100: ICP match), Intent (0-100: engagement signals), BANT (Budget Y/N, Authority Y/N, Need Y/N, Timeline Y/N). Total = weighted(Fit*0.4 + Intent*0.3 + BANT*0.3). Classify: Hot(80+), Warm(50-79), Cold(<50). Output: {scores, classification, recommended_action} |
| SL-004:sl_nurture | [sl_score] | [text, json] | Based on score classification, create Email Marketing sub-project: Hot → immediate sales outreach email. Warm → 4-email nurture sequence (weekly). Cold → long-term drip (monthly). Output: {em_sub_project_id, sequence_type, timeline} |
| SL-005:sl_proposal | [sl_capture, sl_enrich, sl_score] | [text, json] | Generate commercial proposal: create WR sub-project (format=digital, proposal copy), GD sub-project (branded template), request pricing from Financial Agent (XA-001). Compile final document. Output: {proposal_document, pricing_summary, validity_period} |
| SL-L:sl_negotiate | [sl_proposal] | [text, json] | Track negotiation: log interactions, follow-ups, objections, counter-proposals. Update deal probability. Schedule next action. Output: {negotiation_log, updated_probability, next_action, next_action_date} |
| SL-L:sl_close | [sl_negotiate] | [text, json] | Close the deal: won (with value, date, terms) or lost (with reason: price/timing/competition/need/other). Update lead and deal status. Output: {outcome, value_if_won, reason_if_lost, close_date} |
| SL-006:sl_attribution | [sl_capture, sl_close] | [text, json] | Attribute the closed deal to its origin: channel, campaign, content piece. Models: first-touch, last-touch, linear. Output: {attribution: {first_touch: {channel, campaign}, last_touch: {channel, campaign}, linear: [{channel, campaign, weight}]}} |
| SL-L:sl_delivery | [sl_close, sl_attribution] | [text, json] | Generate deal close report: outcome, value, attribution, time-to-close, lessons learned. Update pipeline metrics. |

---

## 8. Dependencias con motores transversales

| Motor | Cómo lo usa Sales/CRM | Estado |
|-------|----------------------|--------|
| XA-001 Financial Agent | Pricing en propuestas | Stub existente |
| XA-003 Brand Guardian | Evaluador en sl-g2 | Stub existente |
| Email Marketing | Nurture sequences | Motor implementado (grupo 4) |
| Writers Room | Copy de propuestas | Motor implementado (grupo 3) |
| Graphic Design | Branding de propuestas | Motor implementado |
| Ads / CM / SEO / Events | Datos de origen para atribución | Motors implementados (grupo 4) |

---

## 9. Modelo de datos

### Tablas nuevas

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  title VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(50) NOT NULL,        -- web_form, email, event, ad, referral
  source_detail VARCHAR(255),          -- campaign name, event name, etc.
  fit_score INTEGER DEFAULT 0,
  intent_score INTEGER DEFAULT 0,
  bant_score JSONB DEFAULT '{}',       -- {budget: bool, authority: bool, need: bool, timeline: bool}
  total_score INTEGER DEFAULT 0,
  classification VARCHAR(10) DEFAULT 'cold',  -- hot, warm, cold
  status VARCHAR(20) DEFAULT 'new',    -- new, enriched, scored, qualified, nurturing, proposal, negotiation, won, lost
  enrichment_data JSONB DEFAULT '{}',
  assigned_to VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deals (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  stage VARCHAR(20) DEFAULT 'qualification', -- qualification, nurture, proposal, negotiation, closing, won, lost
  probability INTEGER DEFAULT 10,            -- 0-100
  expected_close_date TIMESTAMP,
  actual_close_date TIMESTAMP,
  lost_reason VARCHAR(50),                   -- price, timing, competition, need, other
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  version INTEGER DEFAULT 1,
  content TEXT,                               -- markdown content of proposal
  pricing JSONB,                              -- {items: [{name, amount}], total, currency, discount}
  valid_until TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',         -- draft, sent, viewed, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Nuevos valores en enums

**projectStatusEnum**: `sl_capture`, `sl_enrich`, `sl_score`, `sl_nurture`, `sl_proposal`, `sl_negotiate`, `sl_close`, `sl_attribution`, `sl_delivery`

**artifactStepEnum**: `sl_capture`, `sl_enrich`, `sl_score`, `sl_nurture`, `sl_proposal`, `sl_negotiate`, `sl_close`, `sl_attribution`, `sl_delivery`

**gateTypeEnum**: `sl-g1`, `sl-g2`
