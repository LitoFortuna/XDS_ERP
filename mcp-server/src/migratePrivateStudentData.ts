/**
 * One-time migration: moves dni/iban off the public students/{id} doc into the restricted
 * students/{id}/private/sensitive subdocument (see firestore.rules for why). Run this AFTER
 * deploying the updated app/rules/functions, so nothing writes dni/iban back to the old spot
 * while this runs.
 *
 * Usage (from mcp-server/):
 *   npx tsx src/migratePrivateStudentData.ts --dry-run   # preview, writes nothing
 *   npx tsx src/migratePrivateStudentData.ts             # actually migrate
 *
 * Lives here (not in src/scripts/ on the main app) because this needs firebase-admin and a
 * service account, both of which are already set up in this project — the main Vite app only
 * has the browser client SDK.
 */
import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.resolve(__dirname, "../serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error("No se encontró serviceAccountKey.json en mcp-server/. Este script necesita credenciales de administrador (ver README del mcp-server).");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || "xen-dance-erp",
});

const db = admin.firestore();
const isDryRun = process.argv.includes("--dry-run");

async function migrate() {
  console.log(`Migrando dni/iban a students/{id}/private/sensitive${isDryRun ? " (DRY RUN, no se escribirá nada)" : ""}...\n`);

  const snapshot = await db.collection("students").get();
  let migrated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasDni = !!data.dni;
    const hasIban = !!data.iban;

    if (!hasDni && !hasIban) {
      skipped++;
      continue;
    }

    const privateData: Record<string, any> = {};
    if (hasDni) privateData.dni = data.dni;
    if (hasIban) privateData.iban = data.iban;

    console.log(`  ${doc.id} (${data.name || "sin nombre"}): moviendo ${Object.keys(privateData).join(", ")}`);

    if (!isDryRun) {
      await doc.ref.collection("private").doc("sensitive").set(privateData, { merge: true });
      await doc.ref.update({
        dni: admin.firestore.FieldValue.delete(),
        iban: admin.firestore.FieldValue.delete(),
      });
    }
    migrated++;
  }

  console.log(`\nHecho. ${migrated} alumnos migrados, ${skipped} sin dni/iban que migrar.`);
  if (isDryRun) {
    console.log("Esto era un dry-run: no se ha escrito nada. Ejecuta sin --dry-run para aplicar los cambios de verdad.");
  }
}

migrate().catch(err => {
  console.error("Error en la migración:", err);
  process.exit(1);
});
