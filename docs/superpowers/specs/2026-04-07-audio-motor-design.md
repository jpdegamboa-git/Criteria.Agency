# Audio Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capability: C-013 Producción de audio
> Dolores: D-PRD-05

---

## 1. Concepto

Motor independiente de producción de audio. T5-L (Sonorizador) migra aquí como AU-L. Video Production invoca al Audio Motor como servicio externo cuando necesita sonorización. El motor también ejecuta proyectos independientes: podcasts, jingles, spots de radio, voiceovers, diseño sonoro de marca, packs de SFX.

---

## 2. Pipeline

```
[brief] → [sound_design] → [G1: concepto sonoro aprobado] → [production] → [G2: calidad técnica] → [mix_master] → [delivery]
```

### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| brief | Interpretación del brief de audio, definición de concepto sonoro | AU-L |
| sound_design | Paleta de sonidos, paisaje sonoro, selección/creación de SFX, foley digital | AU-001 |
| production | Elementos musicales y/o voiceover según tipo de proyecto | AU-002 y/o AU-003 |
| mix_master | Mezcla final, mastering, normalización por canal | AU-004 |
| delivery | Aprobación final, entrega en formatos requeridos | AU-L |

---

## 3. Agentes

### AU-L — Sound Director (Líder)

- **Rol**: Interpreta brief de audio, define concepto sonoro, dirige la producción, aprueba mezcla final
- **Pasos**: brief, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 75%
- **Nivel**: Leader
- **Migración**: Evolución de T5-L (Sonorizador) del video pipeline

### AU-001 — Sound Designer & SFX

- **Rol**: Diseña paisaje sonoro: creación/selección de SFX, foley digital, ambientaciones, transiciones sonoras, identidad sonora. Trabaja con bibliotecas de SFX + generación AI. Entrega packs categorizados (hits, whooshes, transitions, ambience, UI sounds)
- **Pasos**: sound_design
- **Modelo**: gemini-2.5-pro-audio
- **Autonomía**: 75%
- **Nivel**: Sub

### AU-002 — Music Producer

- **Rol**: Selección/composición musical, jingles, soundtrack, underscoring, música incidental
- **Pasos**: production (cuando type=music o type=jingle o type=soundtrack)
- **Modelo**: gemini-2.5-pro-audio
- **Autonomía**: 70%
- **Nivel**: Sub

### AU-003 — Voice Director

- **Rol**: Selección de voz (tipo, tono, idioma), dirección de voiceover, generación TTS, scripts de locución
- **Pasos**: production (cuando type=voiceover o type=podcast)
- **Modelo**: gemini-2.5-pro-audio
- **Autonomía**: 70%
- **Nivel**: Sub

### AU-004 — Mix Engineer

- **Rol**: Mezcla de todos los elementos (música, VO, SFX, ambience), mastering, normalización por canal (broadcast, streaming, web)
- **Pasos**: mix_master
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

---

## 4. Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Concepto sonoro | au-g1 | sound_design | AU-L | 3 | Concepto sonoro coherente con brief, paleta de sonidos definida, SFX apropiados |
| Calidad técnica | au-g2 | production | AU-L + XA-003 (Brand Guardian) | 3 | Calidad de audio, coherencia con identidad sonora de marca, specs técnicos cumplidos |

---

## 5. Tipos de proyecto audio

| Tipo | Agentes activos | Invocado por | Notas |
|------|-----------------|-------------|-------|
| Podcast | AU-L, AU-001, AU-003, AU-004 | Independiente | Episodios, intro/outro, bumpers |
| Jingle/Spot radio | AU-L, AU-001, AU-002, AU-003, AU-004 | Independiente, Ads | 15s, 30s, 60s formatos |
| Voiceover | AU-L, AU-003, AU-004 | Video, Presentaciones | Narración, locución |
| Soundtrack | AU-L, AU-001, AU-002, AU-004 | Video, Events | Música original o selección |
| Identidad sonora | AU-L, AU-001, AU-002, AU-004 | Brand Builder | Logo sonoro, sonic branding |
| SFX Pack | AU-L, AU-001, AU-004 | Video, Events, Web, Ads | Packs categorizados |
| Sonorización video | AU-L, AU-001, AU-002, AU-003, AU-004 | Video Production | Pipeline completo para video |

---

## 6. Relación con Video Production

### Migración de T5-L

- **T5-L (Sonorizador)** se renombra/alias a **AU-L** (Sound Director)
- En el video pipeline-registry, el paso `audio` ahora despacha creando un sub-proyecto `audio` en vez de ejecutar T5-L directamente
- El sub-proyecto Audio recibe como contexto los artifacts de video: storyboard, visual_look, script

### Flujo Video → Audio

```
Video Production pipeline:
  ... → [edit] → [audio] → [polish] → ...
                    ↓
  Crea sub-proyecto Audio con parentProjectId = video project
                    ↓
  Audio pipeline ejecuta completo
                    ↓
  Artifacts de audio se vinculan al video project
                    ↓
  Video pipeline continúa con [polish]
```

### Context de video disponible para Audio

Cuando `parentProjectId` apunta a un proyecto de video, los artifacts disponibles incluyen:
- `script` (texto del guión para timing de VO)
- `storyboard` (visual reference para musicología)
- `visual_look` (tono visual para coherencia audio-visual)
- `edit` (video editado para sincronización)

---

## 7. Formato de request

```typescript
{
  pipelineType: "audio",
  parentProjectId: "uuid-del-proyecto-padre" | null,
  brief: {
    type: "podcast" | "jingle" | "voiceover" | "soundtrack" | "sonic_branding" | "sfx_pack" | "video_audio",
    duration: 30,           // segundos (0 = variable)
    channel: "broadcast" | "streaming" | "web" | "social" | "event",
    voiceGender: "male" | "female" | "neutral" | "auto",
    voiceLanguage: "es" | "en" | "pt" | "auto",
    musicMood: "upbeat" | "corporate" | "emotional" | "epic" | "minimal" | "auto",
    sfxCategories: ["hits", "whooshes", "transitions", "ambience", "ui"],
    context: "..."
  }
}
```

---

## 8. Directives

### brand-voice.md (shared — ya existe)
Identidad sonora de marca si está definida en el Brand DNA.

### audio-specs.md (nuevo)

Especificaciones técnicas por canal:

| Canal | Sample Rate | Bit Depth | Formato | Loudness (LUFS) |
|-------|------------|-----------|---------|-----------------|
| Broadcast (TV/Radio) | 48kHz | 24-bit | WAV | -24 LUFS |
| Streaming (Spotify, podcast) | 44.1kHz | 16-bit | MP3 320kbps / WAV | -14 LUFS |
| Web (video online) | 48kHz | 16-bit | AAC / MP3 | -16 LUFS |
| Social media | 44.1kHz | 16-bit | AAC / MP3 | -14 LUFS |
| Evento en vivo | 48kHz | 24-bit | WAV | -20 LUFS |

---

## 9. Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| AU-L:brief | [parent brief si existe] | [json, audio] | Interpretar brief de audio. Definir concepto sonoro, tipo de producción, agentes necesarios |
| AU-001:sound_design | [brief] | [audio, text] | Diseñar paisaje sonoro: seleccionar/crear SFX, foley digital, ambientaciones, transiciones. Entregar como pack categorizado |
| AU-002:production | [brief, sound_design] | [audio, text] | Producir elementos musicales: composición, selección, arreglos. Entregar stems separados |
| AU-003:production | [brief, sound_design] | [audio, text] | Dirigir y generar voiceover: selección de voz, TTS, dirección de entonación y ritmo |
| AU-004:mix_master | [brief, sound_design, production] | [audio] | Mezclar todos los elementos (música, VO, SFX). Masterizar según specs de canal destino. Normalizar loudness |
| AU-L:delivery | [brief, mix_master] | [audio, text] | Review final de calidad. Verificar specs técnicos. Compilar entregables en formatos requeridos |

---

## 10. Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa el Audio Motor | Estado actual |
|-------------------|--------------------------|---------------|
| XA-003 Brand Guardian | Evaluador en au-g2. Valida coherencia con identidad sonora de marca | Stub agent existente |
| Brand Builder | Brand DNA Document (sección de identidad sonora) como contexto | Pipeline existente |
| Writers Room | Scripts de VO, guiones de podcast | Motor nuevo (este grupo) |
| Video Production | Proyecto padre cuando audio es para video | Pipeline existente |

---

## 11. Modelo de datos

No requiere tablas nuevas. Usa tablas existentes:
- `projects` con `pipelineType: "audio"`
- `artifacts` para cada output por paso
- `agentExecutions` para historial
- `gateReviews` para evaluaciones de gates

### Nuevos valores en enums existentes

**projectStatusEnum** (agregar):
- `au_brief`, `au_sound_design`, `au_production`, `au_mix_master`, `au_delivery`

**artifactStepEnum** (agregar):
- `au_brief`, `au_sound_design`, `au_production`, `au_mix_master`, `au_delivery`

**gateTypeEnum** (agregar):
- `au-g1`, `au-g2`
