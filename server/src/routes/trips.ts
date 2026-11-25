import { Router, type NextFunction, type Request, type Response } from 'express'
import { requireAuth } from '../auth.js'
import { toTrip, trips } from '../db.js'
import { tripSchema } from '../schemas.js'

export const tripsRouter = Router()
tripsRouter.use(requireAuth)

const MAX_TRIPS_PER_USER = 100

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next)
  }

/** Is user ki saari trips */
tripsRouter.get(
  '/',
  wrap(async (_req, res) => {
    const docs = await trips()
      .find({ uid: res.locals.uid })
      .sort({ updatedAt: -1 })
      .toArray()
    res.json(docs.map(toTrip))
  }),
)

/** Trip banana ya poori trip (budget samet) update karna */
tripsRouter.put(
  '/:id',
  wrap(async (req, res) => {
    const parsed = tripSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid trip',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      })
      return
    }
    if (parsed.data.id !== req.params.id) {
      res.status(400).json({ error: 'Trip id does not match the URL' })
      return
    }

    const uid = res.locals.uid as string
    const { id, ...rest } = parsed.data

    const exists = await trips().countDocuments({ _id: id, uid }, { limit: 1 })
    if (!exists && (await trips().countDocuments({ uid })) >= MAX_TRIPS_PER_USER) {
      res.status(403).json({ error: 'Trip limit reached' })
      return
    }

    // Jo optional fields is baar nahi aaye, unhe hata do
    const unset: Record<string, ''> = {}
    if (rest.budget === undefined) unset.budget = ''
    if (rest.dismissedIssues === undefined) unset.dismissedIssues = ''

    try {
      await trips().updateOne(
        { _id: id, uid },
        {
          $set: { ...rest, updatedAt: new Date() },
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
        { upsert: true },
      )
    } catch (err) {
      // Yeh id kisi aur user ki trip ki hai
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
        res.status(404).json({ error: 'Trip not found' })
        return
      }
      throw err
    }

    res.status(204).end()
  }),
)

tripsRouter.delete(
  '/:id',
  wrap(async (req, res) => {
    await trips().deleteOne({ _id: req.params.id, uid: res.locals.uid })
    res.status(204).end()
  }),
)