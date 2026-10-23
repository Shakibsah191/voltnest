import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';

async function main() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 VoltNest API → http://localhost:${env.PORT}/api/v1/health`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('❌ Failed to start the server:', err.message);
  if (/ENOTFOUND|querySrv|whitelist|IP/i.test(err.message)) {
    console.error('   → Check MONGODB_URI in .env and Atlas → Network Access (add your IP).');
  }
  process.exit(1);
});
