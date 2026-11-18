import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { setDbPool } from './db.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let activePglite: PGlite | null = null;
let shutdownHookRegistered = false;

async function openPgliteWithRetry(dataDir: string, maxAttempts = 5): Promise<PGlite> {
  let lastError: unknown;
  const pidFile = path.join(dataDir, 'postmaster.pid');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const candidate = new PGlite(dataDir);
      await candidate.query('SELECT 1');
      return candidate;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await sleep(350);
      }
      // Si el proceso previo terminó abruptamente y dejó postmaster.pid huérfano,
      // eliminamos únicamente el archivo de lock para conservar intactos los datos locales.
      if (attempt >= 2 && fs.existsSync(pidFile)) {
        try {
          fs.unlinkSync(pidFile);
        } catch {
          // Ignorar si otro proceso ya lo liberó
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No se pudo abrir .pglite_data tras varios reintentos.');
}

function registerCleanShutdown(): void {
  if (shutdownHookRegistered) return;
  shutdownHookRegistered = true;

  const closeAndExit = async (signal: NodeJS.Signals) => {
    const instance = activePglite;
    activePglite = null;
    if (instance) {
      try {
        await instance.close();
      } catch {
        // Ignorar errores al cerrar durante reinicio
      }
    }
    if (signal !== 'SIGUSR2') {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => void closeAndExit('SIGINT'));
  process.once('SIGTERM', () => void closeAndExit('SIGTERM'));
  process.once('SIGUSR2', () => void closeAndExit('SIGUSR2'));
}

export async function initPgliteFallback(): Promise<void> {
  const dataDir = path.resolve(process.cwd(), '.pglite_data');
  const pg = await openPgliteWithRetry(dataDir, 5);
  activePglite = pg;
  registerCleanShutdown();

  const pglitePoolAdapter = {
    query: async (text: string, params?: any[]) => {
      const res = await pg.query(text, params);
      return { rows: res.rows as any[], rowCount: res.rows.length };
    },
    connect: async () => ({
      query: async (text: string, params?: any[]) => {
        const trimmed = text.trim().toUpperCase();
        if (trimmed === 'BEGIN' || trimmed === 'COMMIT' || trimmed === 'ROLLBACK') {
          await pg.exec(trimmed);
          return { rows: [], rowCount: 0 };
        }
        const res = await pg.query(text, params);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      },
      release: () => {},
    }),
    on: () => {},
  };

  setDbPool(pglitePoolAdapter);

  // Verificar si ya existen tablas en el almacenamiento persistente local
  const check = await pg.query(
    "SELECT COUNT(*)::int AS total FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios';"
  );
  const yaInicializada = Number((check.rows[0] as any)?.total || 0) > 0;

  if (!yaInicializada) {
    const dbDir = path.resolve(process.cwd(), '../database');
    const schemaSql = fs.readFileSync(path.join(dbDir, 'schema_completo_actualizado.sql'), 'utf8');
    const catalogosSql = fs.readFileSync(path.join(dbDir, 'INSERTS_CATALOGOS_OFICIALES.sql'), 'utf8');
    await pg.exec(schemaSql);
    await pg.exec(catalogosSql);

    // Asegurar 3er turno (Noche) y un pedido base inicial para pruebas operativas
    await pg.exec(`
      INSERT INTO turnos (id, nombre_turno, hora_inicio, hora_fin)
      VALUES (3, 'Noche', '22:00', '06:00')
      ON CONFLICT (id) DO NOTHING;

      SELECT setval('turnos_id_seq', (SELECT COALESCE(MAX(id), 3) FROM turnos));

      INSERT INTO pedido (id, folio, id_cliente, fecha_pedido, fecha_compromiso, estado)
      VALUES (1, 'PED-2026-001', 1, CURRENT_DATE, CURRENT_DATE + 7, 'En Producción')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✓ Base de datos PostgreSQL embebida (PGlite) inicializada con esquema y catálogos oficiales.');
  } else {
    // Asegurar 3er turno en bases ya inicializadas
    await pg.exec(`
      INSERT INTO turnos (id, nombre_turno, hora_inicio, hora_fin)
      VALUES (3, 'Noche', '22:00', '06:00')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✓ Conectado a PostgreSQL embebido local (PGlite) en .pglite_data.');
  }
}

