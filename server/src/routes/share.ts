import { Router } from 'express'
import { toPublicTrip, trips } from '../db.js'

export const shareRouter = Router()

shareRouter.get('/:token', async (req, res, next) => {
  try {
    const token = req.params.token
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const doc = await trips().findOne({ shareToken: token })
    if (!doc) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    // Stop sharing foran asar kare, isliye cache nahi
    res.set('Cache-Control', 'no-store')
    res.json(toPublicTrip(doc))
  } catch (err) {
    next(err)
  }
})