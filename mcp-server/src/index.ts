import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mirrors the enums in src/schemas/dataSchemas.ts on the main app — kept in sync manually
// since this is a separate Node project without access to that module.
const STUDENT_PAYMENT_METHODS = ["Efectivo", "Transferencia", "Domiciliación", "Bizum"] as const;
const COST_PAYMENT_METHODS = ["Efectivo", "Transferencia", "Domiciliación", "Tarjeta"] as const;
const COST_CATEGORIES = ["Profesores", "Alquiler", "Suministros", "Licencias", "Impuestos", "Marketing", "Mantenimiento", "Otros"] as const;

const StudentPaymentMethodSchema = z.enum(STUDENT_PAYMENT_METHODS);
const CostPaymentMethodSchema = z.enum(COST_PAYMENT_METHODS);
const CostCategorySchema = z.enum(COST_CATEGORIES);

// Returns a user-facing error string if invalid, or null if the value is fine (or absent).
function validateEnumArg(value: unknown, schema: z.ZodTypeAny, fieldName: string, allowed: readonly string[]): string | null {
  if (value === undefined) return null;
  const result = schema.safeParse(value);
  if (!result.success) {
    return `Error: valor inválido para "${fieldName}": "${value}". Valores permitidos: ${allowed.join(", ")}.`;
  }
  return null;
}

// Initialize Firebase Admin SDK
let initialized = false;
try {
  // Check if serviceAccountKey.json is in the mcp-server root
  const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");
  
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || "xen-dance-erp"
    });
    initialized = true;
    console.error("Firebase Admin initialized using serviceAccountKey.json");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    initialized = true;
    console.error("Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS");
  } else {
    // Attempt default initialization (might require local credentials via gcloud CLI)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "xen-dance-erp"
    });
    initialized = true;
    console.error("Firebase Admin initialized using default project credentials");
  }
} catch (error: any) {
  console.error("Failed to initialize Firebase Admin SDK:", error.message);
  console.error("The server will run but will return a setup warning on tool execution.");
}

const db = initialized ? admin.firestore() : null;

// Create MCP Server instance
const server = new Server(
  {
    name: "xds-erp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_students",
        description: "Obtener la lista de estudiantes con opción de filtrar por estado activo/inactivo.",
        inputSchema: {
          type: "object",
          properties: {
            active: {
              type: "boolean",
              description: "Filtrar por estudiantes activos (true) o dados de baja (false). Si se omite, devuelve todos."
            },
            limit: {
              type: "number",
              description: "Cantidad máxima de estudiantes a recuperar (por defecto 100)."
            }
          }
        }
      },
      {
        name: "get_student_detail",
        description: "Obtener el expediente detallado de un estudiante incluyendo información de contacto, pagos y progreso por su ID.",
        inputSchema: {
          type: "object",
          properties: {
            studentId: {
              type: "string",
              description: "El ID único del estudiante."
            }
          },
          required: ["studentId"]
        }
      },
      {
        name: "get_classes",
        description: "Obtener la lista de clases de baile impartidas, con su horario, categoría y profesor asignado.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Filtrar por categoría de clase ('Fitness', 'Baile Moderno', 'Competición', 'Especializada')."
            }
          }
        }
      },
      {
        name: "get_events",
        description: "Obtener la lista de eventos de la academia (competiciones, exhibiciones, talleres) con precio de entrada y participantes.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Cantidad máxima de eventos a recuperar (por defecto 50)."
            }
          }
        }
      },
      {
        name: "get_financials",
        description: "Obtener el resumen de balance financiero mensual o anual (ingresos por cuotas/eventos, gastos y beneficio neto).",
        inputSchema: {
          type: "object",
          properties: {
            year: {
              type: "number",
              description: "El año para el análisis (ej. 2026)."
            },
            month: {
              type: "number",
              description: "El número del mes del 1 al 12 (opcional, si se omite da el balance del año completo)."
            }
          },
          required: ["year"]
        }
      },
      {
        name: "get_stats",
        description: "Obtener métricas y estadísticas clave generales de la academia en tiempo real.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "add_student",
        description: "Añadir un nuevo alumno a la base de datos.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre completo del alumno" },
            monthlyFee: { type: "number", description: "Cuota mensual del alumno (por defecto 19)" },
            paymentMethod: { 
              type: "string", 
              enum: ["Efectivo", "Transferencia", "Domiciliación", "Bizum"],
              description: "Método de pago preferido (por defecto 'Efectivo')" 
            },
            phone: { type: "string", description: "Teléfono de contacto (opcional)" },
            email: { type: "string", description: "Email de contacto (opcional)" },
            dni: { type: "string", description: "DNI/NIE del alumno (opcional)" },
            birthDate: { type: "string", description: "Fecha de nacimiento YYYY-MM-DD (opcional)" },
            notes: { type: "string", description: "Notas adicionales (opcional)" },
            active: { type: "boolean", description: "Si el alumno está activo (por defecto true)" },
            enrolledClassIds: { 
              type: "array", 
              items: { type: "string" },
              description: "IDs de las clases en las que se inscribe (opcional)"
            }
          },
          required: ["name"]
        }
      },
      {
        name: "update_student",
        description: "Modificar la información de un alumno existente.",
        inputSchema: {
          type: "object",
          properties: {
            studentId: { type: "string", description: "El ID único del estudiante a modificar" },
            name: { type: "string", description: "Nombre completo del alumno" },
            monthlyFee: { type: "number", description: "Cuota mensual del alumno" },
            paymentMethod: { 
              type: "string", 
              enum: ["Efectivo", "Transferencia", "Domiciliación", "Bizum"],
              description: "Método de pago preferido" 
            },
            phone: { type: "string", description: "Teléfono de contacto" },
            email: { type: "string", description: "Email de contacto" },
            dni: { type: "string", description: "DNI/NIE del alumno" },
            birthDate: { type: "string", description: "Fecha de nacimiento YYYY-MM-DD" },
            notes: { type: "string", description: "Notas adicionales" },
            active: { type: "boolean", description: "Si el alumno está activo" },
            enrolledClassIds: { 
              type: "array", 
              items: { type: "string" },
              description: "IDs de las clases en las que se inscribe"
            }
          },
          required: ["studentId"]
        }
      },
      {
        name: "add_payment",
        description: "Registrar un nuevo cobro/pago recibido de un alumno.",
        inputSchema: {
          type: "object",
          properties: {
            studentId: { type: "string", description: "El ID del alumno que realiza el pago" },
            amount: { type: "number", description: "Importe cobrado en euros" },
            concept: { type: "string", description: "Concepto del pago (ej: 'Cuota Mayo 2026', 'Matrícula')" },
            paymentMethod: { 
              type: "string", 
              enum: ["Efectivo", "Transferencia", "Domiciliación", "Bizum"],
              description: "Método de pago utilizado" 
            },
            date: { type: "string", description: "Fecha del pago YYYY-MM-DD (por defecto hoy)" },
            notes: { type: "string", description: "Notas adicionales (opcional)" }
          },
          required: ["studentId", "amount", "concept", "paymentMethod"]
        }
      },
      {
        name: "add_cost",
        description: "Registrar un nuevo gasto/coste en la contabilidad.",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "number", description: "Importe del gasto en euros" },
            category: { 
              type: "string", 
              enum: ["Profesores", "Alquiler", "Suministros", "Licencias", "Impuestos", "Marketing", "Mantenimiento", "Otros"],
              description: "Categoría del gasto" 
            },
            beneficiary: { type: "string", description: "Beneficiario o destinatario del pago (ej: 'Iberdrola', 'Profesor Juan')" },
            concept: { type: "string", description: "Concepto o descripción detallada del gasto" },
            paymentMethod: { 
              type: "string", 
              enum: ["Efectivo", "Transferencia", "Domiciliación", "Tarjeta"],
              description: "Método de pago utilizado para abonar el gasto" 
            },
            date: { type: "string", description: "Fecha del gasto YYYY-MM-DD (por defecto hoy)" },
            isRecurring: { type: "boolean", description: "Si es un gasto periódico/recurrente (por defecto false)" },
            notes: { type: "string", description: "Notas adicionales (opcional)" }
          },
          required: ["amount", "category", "beneficiary", "concept", "paymentMethod"]
        }
      }
    ]
  };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check Firebase initialization before doing anything
  if (!initialized || !db) {
    return {
      content: [
        {
          type: "text",
          text: "⚠️ El servidor MCP no está conectado a la base de datos de Firebase.\n\nPor favor, genera y descarga el archivo JSON de clave privada de tu cuenta de servicio desde la Consola de Firebase:\n1. Ve a 'Configuración del proyecto' -> 'Cuentas de servicio'.\n2. Haz clic en 'Generar nueva clave privada'.\n3. Renombra el archivo descargado como 'serviceAccountKey.json'.\n4. Colócalo en la raíz del directorio 'mcp-server/'.\n\nUna vez hecho, reinicia tu cliente de IA para conectar en tiempo real."
        }
      ],
      isError: true
    };
  }

  try {
    switch (name) {
      case "get_students": {
        const active = args?.active as boolean | undefined;
        const limit = (args?.limit as number | undefined) || 100;

        let queryRef: admin.firestore.Query = db.collection("students");
        if (active !== undefined) {
          queryRef = queryRef.where("active", "==", active);
        }
        queryRef = queryRef.orderBy("name").limit(limit);

        const snapshot = await queryRef.get();
        const students = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(students, null, 2)
            }
          ]
        };
      }

      case "get_student_detail": {
        const studentId = args?.studentId as string;
        if (!studentId) {
          return {
            content: [{ type: "text", text: "Error: Falta el parámetro obligatorio studentId." }],
            isError: true
          };
        }

        const studentDoc = await db.collection("students").doc(studentId).get();
        if (!studentDoc.exists) {
          return {
            content: [{ type: "text", text: `Estudiante con ID ${studentId} no encontrado.` }],
            isError: true
          };
        }

        const studentData = { id: studentDoc.id, ...studentDoc.data() };

        // Fetch recent payments (limit 15)
        const paymentsSnapshot = await db.collection("payments")
          .where("studentId", "==", studentId)
          .orderBy("date", "desc")
          .limit(15)
          .get();
        const payments = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch progress details
        const progressDoc = await db.collection("studentProgress").doc(studentId).get();
        const progress = progressDoc.exists ? progressDoc.data() : null;

        // Fetch attendance records where this student was present, most recent first.
        // Sorted and capped in memory (not via .orderBy/.limit) to avoid requiring a composite
        // Firestore index for array-contains + orderBy — array-contains alone isn't ordered by
        // date, so limiting before sorting could silently drop the actual most recent records.
        const attendanceSnapshot = await db.collection("attendance")
          .where("presentStudentIds", "array-contains", studentId)
          .get();

        const recentAttendance = attendanceSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 50);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                student: studentData,
                recentPayments: payments,
                attendance: recentAttendance,
                progress: progress
              }, null, 2)
            }
          ]
        };
      }

      case "get_classes": {
        const category = args?.category as string | undefined;

        let queryRef: admin.firestore.Query = db.collection("classes");
        if (category) {
          queryRef = queryRef.where("category", "==", category);
        }

        const snapshot = await queryRef.get();
        const classes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch instructors map to provide names
        const instSnapshot = await db.collection("instructors").get();
        const instructorsMap: Record<string, string> = {};
        instSnapshot.forEach(doc => {
          instructorsMap[doc.id] = doc.data().name || "Sin nombre";
        });

        const classesWithInstructors = classes.map((c: any) => ({
          ...c,
          instructorName: instructorsMap[c.instructorId] || "Desconocido"
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(classesWithInstructors, null, 2)
            }
          ]
        };
      }

      case "get_events": {
        const limit = (args?.limit as number | undefined) || 50;

        const snapshot = await db.collection("events")
          .orderBy("date", "desc")
          .limit(limit)
          .get();
        
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2)
            }
          ]
        };
      }

      case "get_financials": {
        const year = args?.year as number;
        const month = args?.month as number | undefined;

        if (!year) {
          return {
            content: [{ type: "text", text: "Error: El año es un parámetro obligatorio." }],
            isError: true
          };
        }

        const startPrefix = month 
          ? `${year}-${month.toString().padStart(2, "0")}` 
          : `${year}`;

        // Range query values to filter strings by prefix
        const rangeStart = startPrefix;
        const rangeEnd = startPrefix + "\uf8ff";

        // Query payments (cuotas)
        const paymentsSnapshot = await db.collection("payments")
          .where("date", ">=", rangeStart)
          .where("date", "<=", rangeEnd)
          .get();
        const payments = paymentsSnapshot.docs.map(doc => doc.data());

        // Query expenses (costes)
        const costsSnapshot = await db.collection("costs")
          .where("paymentDate", ">=", rangeStart)
          .where("paymentDate", "<=", rangeEnd)
          .get();
        const costs = costsSnapshot.docs.map(doc => doc.data());

        // Query events
        const eventsSnapshot = await db.collection("events")
          .where("date", ">=", rangeStart)
          .where("date", "<=", rangeEnd)
          .get();
        const events = eventsSnapshot.docs.map(doc => doc.data());

        // Calculate totals
        const tuitionRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        let eventRevenue = 0;
        events.forEach((e: any) => {
          const price = e.price || 0;
          const participants = e.participants || [];
          const ticketsCount = participants.reduce((total: number, p: any) => total + (p.ticketCount || 0), 0);
          eventRevenue += ticketsCount * price;
        });

        const totalRevenue = tuitionRevenue + eventRevenue;
        const totalExpenses = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        // Group expenses by category
        const expensesByCategory: Record<string, number> = {};
        costs.forEach((c: any) => {
          expensesByCategory[c.category] = (expensesByCategory[c.category] || 0) + (c.amount || 0);
        });

        // Group payments by method
        const paymentsByMethod: Record<string, number> = {};
        payments.forEach((p: any) => {
          paymentsByMethod[p.paymentMethod] = (paymentsByMethod[p.paymentMethod] || 0) + (p.amount || 0);
        });

        if (eventRevenue > 0) {
          paymentsByMethod["Efectivo"] = (paymentsByMethod["Efectivo"] || 0) + eventRevenue;
        }

        const summary = {
          periodo: month ? `${year}-${month.toString().padStart(2, "0")}` : `${year}`,
          totales: {
            ingresosCuotas: tuitionRevenue,
            ingresosEventos: eventRevenue,
            ingresosTotales: totalRevenue,
            gastosTotales: totalExpenses,
            beneficioNeto: netProfit
          },
          ingresosPorMetodoPago: paymentsByMethod,
          gastosPorCategoria: expensesByCategory,
          conteoTransacciones: {
            pagosCuotas: payments.length,
            gastos: costs.length,
            eventos: events.length
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2)
            }
          ]
        };
      }

      case "get_stats": {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const monthPrefix = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

        // Fetch students statistics
        const studentsSnapshot = await db.collection("students").get();
        const totalStudents = studentsSnapshot.size;
        let activeStudents = 0;
        studentsSnapshot.forEach(doc => {
          if (doc.data().active) activeStudents++;
        });

        const classesSnapshot = await db.collection("classes").get();
        const totalClasses = classesSnapshot.size;

        const instructorsSnapshot = await db.collection("instructors").get();
        const totalInstructors = instructorsSnapshot.size;

        // Fetch current month payments
        const rangeStart = monthPrefix;
        const rangeEnd = monthPrefix + "\uf8ff";

        const paymentsSnapshot = await db.collection("payments")
          .where("date", ">=", rangeStart)
          .where("date", "<=", rangeEnd)
          .get();
        const tuitionRevenue = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        // Fetch current month events
        const eventsSnapshot = await db.collection("events")
          .where("date", ">=", rangeStart)
          .where("date", "<=", rangeEnd)
          .get();
        
        let eventRevenue = 0;
        eventsSnapshot.forEach(doc => {
          const e = doc.data();
          const price = e.price || 0;
          const participants = e.participants || [];
          const ticketsCount = participants.reduce((total: number, p: any) => total + (p.ticketCount || 0), 0);
          eventRevenue += ticketsCount * price;
        });

        const stats = {
          fechaConsulta: now.toISOString().split("T")[0],
          resumenGeneral: {
            totalAlumnos: totalStudents,
            alumnosActivos: activeStudents,
            alumnosDeBaja: totalStudents - activeStudents,
            totalClases: totalClasses,
            totalProfesores: totalInstructors
          },
          ingresosMesActual: {
            mes: monthPrefix,
            cuotas: tuitionRevenue,
            entradasEventos: eventRevenue,
            totalFacturado: tuitionRevenue + eventRevenue
          }
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }

      case "add_student": {
        const name = args?.name as string;
        const monthlyFee = (args?.monthlyFee as number) ?? 19;
        const paymentMethod = (args?.paymentMethod as string) ?? "Efectivo";
        const phone = args?.phone as string | undefined;
        const email = args?.email as string | undefined;
        const dni = args?.dni as string | undefined;
        const birthDate = args?.birthDate as string | undefined;
        const notes = args?.notes as string | undefined;
        const active = args?.active !== undefined ? (args?.active as boolean) : true;
        const enrolledClassIds = (args?.enrolledClassIds as string[] | undefined) || [];

        const paymentMethodError = validateEnumArg(paymentMethod, StudentPaymentMethodSchema, "paymentMethod", STUDENT_PAYMENT_METHODS);
        if (paymentMethodError) {
          return { content: [{ type: "text", text: paymentMethodError }], isError: true };
        }

        const newStudent = {
          name,
          enrollmentDate: new Date().toISOString().split("T")[0],
          monthlyFee,
          paymentMethod,
          phone,
          email,
          birthDate,
          notes,
          active,
          enrolledClassIds
        };

        // Filter undefined values
        const cleanStudent: Record<string, any> = {};
        for (const [key, value] of Object.entries(newStudent)) {
          if (value !== undefined) {
            cleanStudent[key] = value;
          }
        }

        const docRef = await db.collection("students").add(cleanStudent);

        // El DNI es un dato sensible: vive en students/{id}/private/sensitive, no en el
        // documento público de la alumna (ver firestore.rules). El Admin SDK ignora las reglas,
        // así que aquí lo escribimos explícitamente en el sitio correcto.
        if (dni !== undefined) {
          await db.collection("students").doc(docRef.id).collection("private").doc("sensitive").set({ dni }, { merge: true });
        }

        return {
          content: [
            {
              type: "text",
              text: `Alumno registrado con éxito. ID asignado: ${docRef.id}\n\nDetalles del alumno:\n${JSON.stringify({ id: docRef.id, ...cleanStudent, dni }, null, 2)}`
            }
          ]
        };
      }

      case "update_student": {
        const studentId = args?.studentId as string;
        if (!studentId) {
          return {
            content: [{ type: "text", text: "Error: Falta el parámetro obligatorio studentId." }],
            isError: true
          };
        }

        const studentDocRef = db.collection("students").doc(studentId);
        const studentDoc = await studentDocRef.get();
        if (!studentDoc.exists) {
          return {
            content: [{ type: "text", text: `Estudiante con ID ${studentId} no encontrado.` }],
            isError: true
          };
        }

        const paymentMethodError = validateEnumArg(args?.paymentMethod, StudentPaymentMethodSchema, "paymentMethod", STUDENT_PAYMENT_METHODS);
        if (paymentMethodError) {
          return { content: [{ type: "text", text: paymentMethodError }], isError: true };
        }

        const fieldsToUpdate: Record<string, any> = {};
        const possibleFields = ["name", "monthlyFee", "paymentMethod", "phone", "email", "birthDate", "notes", "active", "enrolledClassIds"];
        for (const field of possibleFields) {
          if (args?.[field] !== undefined) {
            fieldsToUpdate[field] = args[field];
          }
        }

        // DNI es sensible y vive aparte en students/{id}/private/sensitive (ver firestore.rules
        // y add_student más arriba), nunca en el documento público de la alumna.
        const dniProvided = args?.dni !== undefined;
        if (dniProvided) {
          await studentDocRef.collection("private").doc("sensitive").set({ dni: args.dni }, { merge: true });
        }

        if (Object.keys(fieldsToUpdate).length === 0 && !dniProvided) {
          return {
            content: [{ type: "text", text: "Advertencia: No se proporcionaron campos para actualizar." }]
          };
        }

        if (Object.keys(fieldsToUpdate).length > 0) {
          await studentDocRef.update(fieldsToUpdate);
        }

        return {
          content: [
            {
              type: "text",
              text: `Alumno con ID ${studentId} actualizado con éxito.\n\nCampos modificados:\n${JSON.stringify(dniProvided ? { ...fieldsToUpdate, dni: args.dni } : fieldsToUpdate, null, 2)}`
            }
          ]
        };
      }

      case "add_payment": {
        const studentId = args?.studentId as string;
        const amount = args?.amount as number;
        const concept = args?.concept as string;
        const paymentMethod = args?.paymentMethod as string;
        const date = (args?.date as string) || new Date().toISOString().split("T")[0];
        const notes = args?.notes as string | undefined;

        if (!studentId || amount === undefined || !concept || !paymentMethod) {
          return {
            content: [{ type: "text", text: "Error: Faltan parámetros obligatorios para registrar el cobro." }],
            isError: true
          };
        }

        const paymentMethodError = validateEnumArg(paymentMethod, StudentPaymentMethodSchema, "paymentMethod", STUDENT_PAYMENT_METHODS);
        if (paymentMethodError) {
          return { content: [{ type: "text", text: paymentMethodError }], isError: true };
        }

        // Verify student exists
        const studentDoc = await db.collection("students").doc(studentId).get();
        if (!studentDoc.exists) {
          return {
            content: [{ type: "text", text: `Estudiante con ID ${studentId} no encontrado. No se puede registrar el pago.` }],
            isError: true
          };
        }
        const studentName = studentDoc.data()?.name || "Alumno";

        const paymentData = {
          studentId,
          amount,
          concept,
          paymentMethod,
          date,
          notes
        };

        const cleanPayment: Record<string, any> = {};
        for (const [key, value] of Object.entries(paymentData)) {
          if (value !== undefined) {
            cleanPayment[key] = value;
          }
        }

        const paymentRef = await db.collection("payments").add(cleanPayment);

        // Log activity for notification
        const activityDescription = `Cobro registrado vía IA: ${amount}€ de ${studentName} (${concept})`;
        await db.collection("activityLogs").add({
          type: "payment",
          actorEmail: "mcp-server@xendance.space",
          actorName: "Asistente IA MCP",
          description: activityDescription,
          timestamp: new Date().toISOString(),
          read: false,
          targetRole: "SuperAdmin"
        });

        return {
          content: [
            {
              type: "text",
              text: `Cobro registrado con éxito en Firebase. ID de pago: ${paymentRef.id}\n\nDetalles:\n${JSON.stringify({ id: paymentRef.id, studentName, ...cleanPayment }, null, 2)}`
            }
          ]
        };
      }

      case "add_cost": {
        const amount = args?.amount as number;
        const category = args?.category as string;
        const beneficiary = args?.beneficiary as string;
        const concept = args?.concept as string;
        const paymentMethod = args?.paymentMethod as string;
        const date = (args?.date as string) || new Date().toISOString().split("T")[0];
        const isRecurring = args?.isRecurring !== undefined ? (args?.isRecurring as boolean) : false;
        const notes = args?.notes as string | undefined;

        if (amount === undefined || !category || !beneficiary || !concept || !paymentMethod) {
          return {
            content: [{ type: "text", text: "Error: Faltan parámetros obligatorios para registrar el gasto." }],
            isError: true
          };
        }

        const categoryError = validateEnumArg(category, CostCategorySchema, "category", COST_CATEGORIES);
        if (categoryError) {
          return { content: [{ type: "text", text: categoryError }], isError: true };
        }
        const costPaymentMethodError = validateEnumArg(paymentMethod, CostPaymentMethodSchema, "paymentMethod", COST_PAYMENT_METHODS);
        if (costPaymentMethodError) {
          return { content: [{ type: "text", text: costPaymentMethodError }], isError: true };
        }

        const costData = {
          amount,
          category,
          beneficiary,
          concept,
          paymentMethod,
          paymentDate: date, // maps date to paymentDate
          isRecurring,
          notes
        };

        const cleanCost: Record<string, any> = {};
        for (const [key, value] of Object.entries(costData)) {
          if (value !== undefined) {
            cleanCost[key] = value;
          }
        }

        const costRef = await db.collection("costs").add(cleanCost);

        // Log activity for notification
        const activityDescription = `Gasto registrado vía IA: ${amount}€ - ${concept} (${category})`;
        await db.collection("activityLogs").add({
          type: "cost",
          actorEmail: "mcp-server@xendance.space",
          actorName: "Asistente IA MCP",
          description: activityDescription,
          timestamp: new Date().toISOString(),
          read: false,
          targetRole: "SuperAdmin"
        });

        return {
          content: [
            {
              type: "text",
              text: `Gasto registrado con éxito en Firebase. ID de gasto: ${costRef.id}\n\nDetalles:\n${JSON.stringify({ id: costRef.id, ...cleanCost }, null, 2)}`
            }
          ]
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Error: Herramienta ${name} no soportada.` }],
          isError: true
        };
    }
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error al ejecutar la herramienta: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Define available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "culture://business-culture",
        name: "Cultura de Negocio y Valores de Xen Dance Space",
        mimeType: "text/markdown",
        description: "Misión, visión, valores, fortalezas y cultura interna del centro de baile."
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri === "culture://business-culture") {
    // Resolved to the root directory file
    const filePath = path.resolve(__dirname, "../../Cultura_Xen_Dance_Space.md");
    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (e: any) {
      console.error("Error reading business culture file:", e.message);
      content = "# Cultura de Negocio de Xen Dance Space\n\nError: No se pudo leer el archivo de cultura. Asegúrate de que `Cultura_Xen_Dance_Space.md` esté en la raíz del proyecto.";
    }
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: content
        }
      ]
    };
  }
  throw new Error(`Recurso no encontrado: ${uri}`);
});

// Run Stdio MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("XDS ERP MCP Server running on stdio transport.");
}

main().catch((error) => {
  console.error("Critical error in main loop:", error);
  process.exit(1);
});
