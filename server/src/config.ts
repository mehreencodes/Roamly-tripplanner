import 'dotenv/config'
import { z } from 'zod'

const parsed = z
  .object({
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().min(1),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
  })
  .safeParse(process.env)

if (!parsed.success) {
  console.error(
    'Missing or invalid environment variables:',
    parsed.error.issues.map((i) => i.path.join('.')).join(', '),
  )
  process.exit(1)
}

export const config = {
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  firebaseProjectId: parsed.data.FIREBASE_PROJECT_ID,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}