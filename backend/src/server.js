import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import multer from 'multer'
import { pool } from './db.js'
import { optional } from './auth.js'
import { buildState } from './state.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import staffRoutes, { UPLOAD_DIR } from './routes/staff.js'
import userRoutes from './routes/user.js'
import notificationRoutes from './routes/notifications.js'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }))

app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }) })
// role-scoped snapshot (public data when no token)
app.get('/api/state', optional, async (req, res, next) => { try { res.json(await buildState(req.auth)) } catch (e) { next(e) } })
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/user', userRoutes)
app.use('/api/notifications', notificationRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Photo too large (max 8 MB)' : err.message })
  if (!err.status) console.error(err)
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong' })
})

const port = +(process.env.PORT || 4000)
app.listen(port, () => console.log(`Clickit API running on http://localhost:${port}`))
