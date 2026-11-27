import app from './app.js';
import { closePool, testConnection } from './config/db.js';
import { env } from './config/env.js';

let server;

async function startServer() {
  try {
    const dbInfo = await testConnection();
    console.log(`[DB] Connected to MySQL ${dbInfo.version} (database: ${dbInfo.dbName})`);

    server = app.listen(env.port, () => {
      console.log(`[SERVER] CINEMATIC Backend running on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error(`[BOOT] Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[SERVER] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closePool();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
