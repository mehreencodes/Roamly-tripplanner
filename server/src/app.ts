import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { config } from './config.js'
import { tripsRouter } from './routes/trips.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: config.corsOrigins }))
  app.use(express.json({ limit: '256kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })
  app.use('/api/trips', tripsRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
        ? err.status
        : 500
    if (status === 500) console.error(err)
    res.status(status).json({ error: status === 500 ? 'Server error' : 'Bad request' })
  })

  return app
}