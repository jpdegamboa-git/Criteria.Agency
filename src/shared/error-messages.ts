import { z } from "zod";

const FIELD_NAMES: Record<string, string> = {
  name: "Nombre",
  email: "Email",
  type: "Tipo",
  pipelineType: "Tipo de pipeline",
  company: "Empresa",
  tier: "Plan",
  billingPeriod: "Periodo de facturacion",
  text: "Texto",
  authorName: "Nombre del autor",
  action: "Accion",
  category: "Categoria",
  subcategory: "Subcategoria",
  notes: "Notas",
  entityId: "Entidad",
  clientId: "Cliente",
  amount: "Monto",
  currency: "Moneda",
  description: "Descripcion",
  dueDate: "Fecha de vencimiento",
  status: "Estado",
  pattern: "Patron",
  matchType: "Tipo de coincidencia",
  transactionType: "Tipo de transaccion",
  priority: "Prioridad",
  direction: "Direccion",
  invoiceNumber: "Numero de factura",
  issueDate: "Fecha de emision",
  metadata: "Metadata",
  invoiceId: "Factura",
  topic: "Tema",
  audience: "Audiencia",
  tone: "Tono",
  keyMessage: "Mensaje clave",
  cta: "CTA",
  additionalContext: "Contexto adicional",
  content: "Contenido",
  title: "Titulo",
  feedback: "Comentarios",
  sessionId: "Sesion",
  message: "Mensaje",
  resumeTo: "Reanudar en",
  listenerType: "Tipo de escucha",
  ruleName: "Nombre de regla",
  condition: "Condicion",
  severity: "Severidad",
  notificationChannels: "Canales de notificacion",
  respondedBy: "Respondido por",
  note: "Nota",
  config: "Configuracion",
  schedule: "Programacion",
  parentProjectId: "Proyecto padre",
  clientName: "Nombre del cliente",
  clientEmail: "Email del cliente",
  expectedPaymentId: "Pago esperado",
  patterns: "Patrones",
  defaultCategory: "Categoria por defecto",
};

export function zodErrorToSpanish(zodError: z.ZodError): string {
  return zodError.issues
    .map((issue) => {
      const field = issue.path.join(".");
      const fieldName = FIELD_NAMES[field] || field || "Campo";
      switch (issue.code) {
        case "invalid_type":
          return `${fieldName}: valor invalido`;
        case "too_small":
          return `${fieldName}: es obligatorio`;
        case "too_big":
          return `${fieldName}: excede el tamano maximo`;
        case "invalid_enum_value":
          return `${fieldName}: opcion no valida`;
        case "invalid_string":
          if (issue.validation === "email") return `${fieldName}: debe ser un email valido`;
          if (issue.validation === "uuid") return `${fieldName}: identificador invalido`;
          if (issue.validation === "url") return `${fieldName}: URL invalida`;
          if (issue.validation === "regex") return `${fieldName}: formato invalido`;
          return `${fieldName}: formato invalido`;
        case "custom":
          return `${fieldName}: ${issue.message}`;
        default:
          return `${fieldName}: ${issue.message}`;
      }
    })
    .join("; ");
}
