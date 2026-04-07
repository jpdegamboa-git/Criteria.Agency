# Marketplace Motor + Print Production Motor — Design Spec

> Date: April 7, 2026
> Status: Approved design
> Capabilities: C-014 Gestión de producción impresa, C-040 Validación de proveedores y costos
> Dolores: D-PRD-06, D-FIN-03

---

## Part 1: Marketplace Motor (Transversal)

### 1.1 Concepto

Motor transversal de gestión de proveedores. Registra proveedores de todas las categorías, genera cotizaciones comparativas, gestiona contratación y hace seguimiento de entregas. Sirve a Print Production, Events, Canales Tradicionales, y cualquier motor que necesite servicios externos.

### 1.2 Pipeline

```
[request] → [search] → [G1: opciones válidas] → [quote] → [compare] → [G2: selección aprobada] → [contract] → [tracking] → [delivery]
```

#### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| request | Interpretación de la necesidad, definición de criterios de búsqueda | MK-L |
| search | Búsqueda en registro de proveedores, evaluación de match | MK-001 |
| quote | Solicitud y recepción de cotizaciones | MK-001 |
| compare | Tabla comparativa con scoring normalizado | MK-002 |
| contract | Orden de trabajo, términos acordados | MK-003 |
| tracking | Seguimiento de producción/entrega | MK-003 |
| delivery | Recepción, evaluación post-entrega | MK-L |

### 1.3 Agentes

#### MK-L — Procurement Director (Líder)

- **Rol**: Interpreta necesidad del motor que invoca, define criterios de búsqueda y selección, aprueba selección final
- **Pasos**: request, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader

#### MK-001 — Vendor Scout

- **Rol**: Busca proveedores en registro por categoría y servicios, evalúa match con criterios, solicita y recopila cotizaciones
- **Pasos**: search, quote
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

#### MK-002 — Comparator

- **Rol**: Normaliza cotizaciones (moneda, unidades, plazos), genera tabla comparativa con scoring multi-criterio (precio, calidad, plazo, historial, ubicación)
- **Pasos**: compare
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 85%
- **Nivel**: Sub

#### MK-003 — Contract Manager

- **Rol**: Genera orden de trabajo con specs detallados, da seguimiento a producción y entregas, registra evaluación post-entrega que alimenta el rating del proveedor
- **Pasos**: contract, tracking
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

### 1.4 Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Opciones | mk-g1 | search | MK-L | 2 | Mínimo 2 proveedores válidos encontrados, criterios de búsqueda correctos |
| Selección | mk-g2 | compare | MK-L (human approval) | 2 | Comparativa clara, presupuesto dentro de rango, proveedor seleccionado justificado |

### 1.5 Categorías de proveedores

| Categoría | Servicios | Motores que invocan |
|-----------|-----------|---------------------|
| **Impresión** | Imprentas, serigrafía, gran formato, sublimación | Print Production |
| **Fotografía** | Fotógrafos, bancos de imagen, retocadores | Graphic Design, Video, Events |
| **Video** | Productoras, camarógrafos, drones, postproducción, animadores | Video Production |
| **Audio** | Estudios de grabación, locutores humanos, compositores, músicos | Audio Motor |
| **Talento** | Actores, modelos, voces, presentadores, influencers | Video, Events, Audio |
| **Venues** | Salones, jardines, rooftops, centros de convenciones, oficinas | Events |
| **Catering** | Comida, bebida, coctelería, barista, servicio de mesa | Events |
| **Entretenimiento** | Músicos en vivo, DJ, bandas, performers, animadores | Events |
| **Talento de presentación** | Maestros de ceremonias, moderadores, speakers, conferencistas | Events |
| **Decoración** | Floristas, ambientación, iluminación decorativa | Events |
| **Montaje técnico** | Sonido, iluminación, pantallas, escenario, rigging | Events |
| **Mobiliario** | Mesas, sillas, lounges, stands, exhibidores | Events |
| **Logística** | Transporte, valet, seguridad, personal de apoyo, limpieza | Events, Print |
| **Medios** | TV, radio, prensa, vallas, digital, OOH | Channel Manager, Ads |
| **Desarrollo** | Freelancers web, apps, integraciones, DevOps | Web Motor |
| **Otros** | Cualquier servicio externo no categorizado | Cualquier motor |

### 1.6 Modelo de datos (tablas nuevas)

```sql
-- Registro de proveedores
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  categories TEXT[] NOT NULL,           -- ['imprenta', 'gran_formato']
  services TEXT[] NOT NULL,             -- ['offset', 'digital', 'serigrafia']
  location VARCHAR,                     -- ciudad/país
  rating DECIMAL(2,1) DEFAULT 0,        -- 1.0-5.0, calculado de reviews
  total_jobs INTEGER DEFAULT 0,
  price_range VARCHAR,                  -- '$', '$$', '$$$'
  portfolio_url VARCHAR,
  contact JSONB,                        -- {email, phone, whatsapp, website}
  notes TEXT,
  active BOOLEAN DEFAULT true,
  client_id UUID REFERENCES clients(id), -- multi-tenant
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cotizaciones de proveedores
CREATE TABLE vendor_quotes (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  project_id UUID REFERENCES projects(id),
  category VARCHAR NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  delivery_days INTEGER,
  specs JSONB,                          -- specs específicos de la cotización
  status VARCHAR DEFAULT 'pending',     -- pending, accepted, rejected, expired
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluaciones post-entrega
CREATE TABLE vendor_reviews (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  project_id UUID REFERENCES projects(id),
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  price INTEGER CHECK (price BETWEEN 1 AND 5),
  timeliness INTEGER CHECK (timeliness BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  notes TEXT,
  review_date TIMESTAMP DEFAULT NOW()
);
```

### 1.7 Formato de request

```typescript
{
  pipelineType: "marketplace",
  parentProjectId: "uuid-del-proyecto-que-necesita-el-servicio",
  brief: {
    category: "imprenta" | "fotografia" | "video" | "audio" | "talento" | "venue" | "catering" | "entretenimiento" | "presentacion" | "decoracion" | "montaje" | "mobiliario" | "logistica" | "medios" | "desarrollo" | "otro",
    services: ["offset", "digital"],     // servicios específicos requeridos
    quantity: 1000,                       // cantidad si aplica
    specs: { ... },                       // specs técnicos según categoría
    budget_max: 5000,                     // presupuesto máximo
    currency: "USD",
    deadline: "2026-05-01",              // fecha límite de entrega
    location: "Ciudad de México",        // ubicación requerida
    minVendors: 3,                       // mínimo de cotizaciones
    context: "..."                       // contexto adicional
  }
}
```

---

## Part 2: Print Production Motor (C-014)

### 2.1 Concepto

Pipeline de producción impresa: del brief al material entregado. Cubre preprensa (preparación de archivos), control de calidad, cotización via Marketplace, seguimiento de producción y verificación de entrega. Los artes (diseños) los produce el Graphic Design Motor — Print Production recibe artes como input.

### 2.2 Pipeline

```
[brief] → [prepress] → [G1: archivo listo para impresión] → [vendor_request] → [G2: proveedor seleccionado] → [production_tracking] → [quality_check] → [delivery]
```

#### Pasos

| Paso | Qué produce | Agentes |
|------|-------------|---------|
| brief | Interpretación del brief, definición de specs de impresión | PP-L |
| prepress | Preparación de archivos: CMYK, bleed, sangrado, resolución, tipografía outline, preflight | PP-001 |
| vendor_request | Specs para cotización (papel, acabados, cantidad, empaque), request para Marketplace | PP-002 |
| production_tracking | Seguimiento de producción (lo ejecuta MK-003 del Marketplace) | MK-003 |
| quality_check | Verificación de muestras/pruebas de color, inspección de entrega | PP-003 |
| delivery | Aprobación final de entrega | PP-L |

### 2.3 Agentes

#### PP-L — Print Director (Líder)

- **Rol**: Interpreta brief de impresión, define specs técnicos, aprueba archivos finales y entrega
- **Pasos**: brief, delivery
- **Modelo**: claude-sonnet-4
- **Autonomía**: 70%
- **Nivel**: Leader

#### PP-001 — Prepress Specialist

- **Rol**: Prepara archivos para impresión: conversión a CMYK, bleed/sangrado, resolución a 300dpi, tipografía outline/curves, preflight check, imposición, separación de colores (si Pantone)
- **Pasos**: prepress
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 80%
- **Nivel**: Sub

#### PP-002 — Print Buyer

- **Rol**: Define especificaciones para cotización: tipo de papel (couché, bond, kraft, cartulina), gramaje, acabados (barniz UV, laminado, troquel, hot stamping), cantidad, empaque, entrega. Crea request para Marketplace
- **Pasos**: vendor_request
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 75%
- **Nivel**: Sub

#### PP-003 — Quality Inspector

- **Rol**: Verifica pruebas de color (matchprint, digital proof), aprueba producción, inspecciona entrega (calidad de impresión, cortes, acabados, cantidad)
- **Pasos**: quality_check
- **Modelo**: gemini-2.5-flash
- **Autonomía**: 70%
- **Nivel**: Sub

### 2.4 Gates

| Gate | ID | Después de | Evaluador | Max iteraciones | Criterios |
|------|----|-----------|-----------|----------------|-----------|
| Prepress | pp-g1 | prepress | PP-L + XA-003 (Brand Guardian) | 3 | Archivos en CMYK, resolución OK, bleed correcto, identidad de marca respetada |
| Proveedor | pp-g2 | vendor_request | PP-L (human approval) | 2 | Presupuesto aprobado, proveedor seleccionado, timeline factible |

### 2.5 Tipos de producción impresa

| Tipo | Specs clave | Papel típico |
|------|------------|-------------|
| Tarjetas de presentación | 300dpi, CMYK, bleed 3mm, 2 caras | Couché 350g, laminado mate |
| Volantes/Flyers | 300dpi, CMYK, A5/A4/Letter, 1 o 2 caras | Couché 150g |
| Brochures | Trifold/bifold, sangrado interior, grapa/pegado | Couché 200g |
| Catálogos | Multi-página, encuadernación, índice | Couché 200g (interior), 300g (portada) |
| Posters | Gran formato, resolución adaptada a distancia de visualización | Couché 200g, papel fotográfico |
| Banners/Lonas | Gran formato, 150dpi, CMYK+spot, ojillos/bastidor | Lona vinílica, mesh |
| Packaging | Troquelado, Pantone, barniz selectivo, prueba de prototipo | Cartulina SBS, kraft |
| Señalética | Material rígido, intemperie, retroiluminado | Acrílico, vinil, aluminio |
| Stickers/Etiquetas | Troquel, adhesivo, laminado | Vinil, papel adhesivo |
| Merchandise | Sublimación, serigrafía, bordado | Según producto |

### 2.6 Flujo cross-motor

```
Graphic Design → produce artes finales
        ↓
Print Production (brief) → recibe artes como input
        ↓
PP-001 (prepress) → prepara archivos para impresión
        ↓
PP-002 (vendor_request) → crea request para Marketplace
        ↓
Marketplace → cotización, selección, contratación
        ↓
MK-003 (tracking) → seguimiento de producción
        ↓
PP-003 (quality_check) → verifica calidad de entrega
        ↓
PP-L (delivery) → aprobación final
```

### 2.7 Directives

#### brand-voice.md (shared)
Identidad visual de marca para validación.

#### print-specs.md (nuevo)

Especificaciones técnicas de preprensa:

| Parámetro | Estándar |
|-----------|----------|
| Resolución | 300dpi (impresión estándar), 150dpi (gran formato) |
| Color | CMYK (proceso), Pantone (spot cuando se requiere) |
| Bleed | 3mm mínimo (estándar), 5mm (gran formato) |
| Safe zone | 5mm interior desde línea de corte |
| Formato de archivo | PDF/X-1a (preferido), AI, EPS, TIFF |
| Tipografía | Outline/curves obligatorio |
| Sobreimpresión | Negro 100% sobreimprime, blanco no |
| Rich black | C:40 M:40 Y:40 K:100 (para áreas grandes) |

### 2.8 Context Map

| Agente:Paso | artifactSteps | attachmentTypes | taskInstruction |
|-------------|--------------|-----------------|-----------------|
| PP-L:brief | [GD output (artes finales)] | [image, json] | Interpretar brief de impresión. Definir specs técnicos, cantidad, acabados |
| PP-001:prepress | [brief, GD output] | [image] | Preparar archivos para impresión: CMYK, bleed, resolución, outline. Hacer preflight check |
| PP-002:vendor_request | [brief, prepress] | [text, json] | Definir specs de cotización: papel, acabados, cantidad, empaque. Crear request para Marketplace |
| PP-003:quality_check | [brief, prepress, vendor_request] | [image, text] | Verificar prueba de color y calidad de producción. Comparar con archivo original |
| PP-L:delivery | [quality_check] | [text, image] | Aprobación final de entrega. Verificar cantidad, calidad, acabados |

### 2.9 Dependencias con motores transversales (stubs)

| Motor transversal | Cómo lo usa Print Production | Estado actual |
|-------------------|------------------------------|---------------|
| XA-003 Brand Guardian | Evaluador en pp-g1. Valida identidad visual en formato físico | Stub agent existente |
| XA-001 Financial Agent | Control de presupuesto de impresión | Stub agent existente |
| Graphic Design | Produce los artes que Print procesa | Pipeline existente |
| Marketplace | Cotización, selección y contratación de imprenta | Motor nuevo (este spec) |

### 2.10 Modelo de datos

**Print Production** no requiere tablas nuevas adicionales a las del Marketplace. Usa:
- `projects` con `pipelineType: "print-production"`
- `artifacts` para archivos de preprensa y entregas
- `vendors`, `vendor_quotes`, `vendor_reviews` (del Marketplace)

#### Nuevos valores en enums existentes

**projectStatusEnum** (agregar):
- `pp_brief`, `pp_prepress`, `pp_vendor_request`, `pp_production_tracking`, `pp_quality_check`, `pp_delivery`
- `mk_request`, `mk_search`, `mk_quote`, `mk_compare`, `mk_contract`, `mk_tracking`, `mk_delivery`

**artifactStepEnum** (agregar):
- `pp_brief`, `pp_prepress`, `pp_vendor_request`, `pp_production_tracking`, `pp_quality_check`, `pp_delivery`
- `mk_request`, `mk_search`, `mk_quote`, `mk_compare`, `mk_contract`, `mk_tracking`, `mk_delivery`

**gateTypeEnum** (agregar):
- `pp-g1`, `pp-g2`
- `mk-g1`, `mk-g2`
