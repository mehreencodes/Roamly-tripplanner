import type { NextFunction, Request, Response } from 'express'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from './config.js'

initializeApp({ projectId: config.firebaseProjectId })

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }

  try {
    const decoded = await getAuth().verifyIdToken(header.slice(7))
    res.locals.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}