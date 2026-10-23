import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  const auth =
    env.MONGODB_USER && env.MONGODB_PASSWORD
      ? { username: env.MONGODB_USER, password: env.MONGODB_PASSWORD }
      : undefined;

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    dbName: 'voltnest',
    ...(auth ? { auth, authSource: 'admin' } : {}),
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}