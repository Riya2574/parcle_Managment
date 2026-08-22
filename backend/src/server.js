import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseFile = path.resolve(__dirname, '..', process.env.DATABASE_FILE || 'data/parcel-manager.sqlite')
mkdirSync(path.dirname(databaseFile), { recursive: true })

const db = new Database(databaseFile)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    city TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    type TEXT NOT NULL DEFAULT 'Retailer',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS parcels (
    id TEXT PRIMARY KEY,
    party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    product TEXT NOT NULL,
    sent_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Received')),
    received_date TEXT,
    payment TEXT NOT NULL DEFAULT '',
    updated_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

const app = express()
const configuredFrontend = process.env.FRONTEND_URL || 'http://localhost:5173'
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required. Set it before starting the server.')
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === configuredFrontend || /^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Origin is not allowed'))
  }
}))
app.use(express.json({ limit: '1mb' }))

const id = () => crypto.randomUUID()
const today = () => new Date().toISOString().slice(0, 10)
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status })
const tokenFor = (user) => jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' })
const parcelSelect = `SELECT p.id, p.party_id AS partyId, p.customer_name AS customerName, p.phone, p.product, p.sent_date AS sentDate, p.status, COALESCE(p.received_date, '-') AS receivedDate, p.payment, p.updated_by AS updatedBy, pa.name AS partyName FROM parcels p JOIN parties pa ON pa.id = p.party_id`

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = jwt.verify(token, jwtSecret)
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = \'Active\'').get(payload.sub)
    if (!user) return res.status(401).json({ error: 'Authentication required' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Administrator access required' })
  }
  next()
}

const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() })
  req[source] = result.data
  next()
}

const authSchema = z.object({ name: z.string().trim().min(2, 'Name must contain at least 2 characters').optional(), email: z.string().trim().email('Enter a valid email address'), password: z.string().min(8, 'Password must contain at least 8 characters') })
const userSchema = z.object({ name: z.string().trim().min(2, 'Name must contain at least 2 characters'), email: z.string().trim().email('Enter a valid email address'), password: z.string().min(8, 'Password must contain at least 8 characters'), role: z.enum(['Admin', 'Staff']).default('Staff') })
const partySchema = z.object({ name: z.string().trim().min(2), city: z.string().trim().max(120).default(''), phone: z.string().trim().max(30).default(''), type: z.string().trim().max(40).default('Retailer') })
const parcelSchema = z.object({ partyId: z.string().min(1), customerName: z.string().trim().min(2), phone: z.string().trim().min(5).max(30), product: z.string().trim().min(1), sentDate: z.string().min(1).default(today()), status: z.enum(['Pending', 'Received']).default('Pending'), payment: z.string().trim().max(100).default('') })

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'parcel-management-api' }))

app.post('/api/auth/signup', validate(authSchema), async (req, res) => {
  if (!process.env.ALLOW_PUBLIC_SIGNUP || process.env.ALLOW_PUBLIC_SIGNUP !== 'true') {
    return res.status(403).json({ error: 'Public signup is disabled. Ask an administrator to create your account.' })
  }

  if (!req.body.name) return res.status(400).json({ error: 'Name is required for signup' })
  try {
    const user = { id: id(), name: req.body.name, email: req.body.email, passwordHash: await bcrypt.hash(req.body.password, 12) }
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, \'Admin\')').run(user.id, user.name, user.email, user.passwordHash)
    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
    res.status(201).json({ token: tokenFor(created), user: publicUser(created) })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email is already registered' })
    res.status(500).json({ error: 'Could not create account' })
  }
})

app.post('/api/auth/login', validate(authSchema.omit({ name: true })), async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email)
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' })
  res.json({ token: tokenFor(user), user: publicUser(user) })
})
app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }))

app.get('/api/parties', auth, (_req, res) => {
  res.json(db.prepare(`SELECT pa.*, COUNT(p.id) AS parcels, SUM(CASE WHEN p.status = 'Pending' THEN 1 ELSE 0 END) AS pending FROM parties pa LEFT JOIN parcels p ON p.party_id = pa.id GROUP BY pa.id ORDER BY pa.created_at DESC`).all())
})
app.post('/api/parties', auth, validate(partySchema), (req, res) => {
  try {
    const party = { id: id(), ...req.body }
    db.prepare('INSERT INTO parties (id, name, city, phone, type) VALUES (@id, @name, @city, @phone, @type)').run(party)
    res.status(201).json(db.prepare('SELECT *, 0 AS parcels, 0 AS pending FROM parties WHERE id = ?').get(party.id))
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Party name already exists' })
    res.status(500).json({ error: 'Could not create party' })
  }
})
app.delete('/api/parties/:id', auth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM parties WHERE id = ?').run(req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'Party not found' })
  res.status(204).end()
})

app.get('/api/parcels', auth, (req, res) => {
  const clauses = [], values = []
  if (req.query.partyId) { clauses.push('p.party_id = ?'); values.push(req.query.partyId) }
  if (req.query.status && ['Pending', 'Received'].includes(req.query.status)) { clauses.push('p.status = ?'); values.push(req.query.status) }
  if (req.query.search) { clauses.push('(p.id LIKE ? OR p.customer_name LIKE ? OR p.phone LIKE ? OR p.product LIKE ?)'); values.push(...Array(4).fill(`%${req.query.search}%`)) }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
  res.json(db.prepare(`${parcelSelect}${where} ORDER BY p.created_at DESC`).all(...values))
})
app.post('/api/parcels', auth, validate(parcelSchema), (req, res) => {
  const parcel = { id: `SR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, ...req.body, receivedDate: req.body.status === 'Received' ? today() : null }
  if (!db.prepare('SELECT id FROM parties WHERE id = ?').get(parcel.partyId)) return res.status(400).json({ error: 'Party not found' })
  db.prepare('INSERT INTO parcels (id, party_id, customer_name, phone, product, sent_date, status, received_date, payment, updated_by) VALUES (@id, @partyId, @customerName, @phone, @product, @sentDate, @status, @receivedDate, @payment, @updatedBy)').run({ ...parcel, updatedBy: req.user.id })
  res.status(201).json(db.prepare(`${parcelSelect} WHERE p.id = ?`).get(parcel.id))
})
app.patch('/api/parcels/:id', auth, validate(parcelSchema.partial()), (req, res) => {
  const current = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id)
  if (!current) return res.status(404).json({ error: 'Parcel not found' })
  const next = { ...current, ...req.body, receivedDate: req.body.status === 'Received' ? (current.received_date || today()) : (req.body.status === 'Pending' ? null : current.received_date) }
  db.prepare('UPDATE parcels SET party_id=@partyId, customer_name=@customerName, phone=@phone, product=@product, sent_date=@sentDate, status=@status, received_date=@receivedDate, payment=@payment, updated_by=@updatedBy, updated_at=CURRENT_TIMESTAMP WHERE id=@id').run({ ...next, partyId: next.party_id || next.partyId, customerName: next.customer_name || next.customerName, sentDate: next.sent_date || next.sentDate, receivedDate: next.receivedDate, payment: next.payment || '', updatedBy: req.user.id, id: req.params.id })
  res.json(db.prepare(`${parcelSelect} WHERE p.id = ?`).get(req.params.id))
})
app.delete('/api/parcels/:id', auth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM parcels WHERE id = ?').run(req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'Parcel not found' })
  res.status(204).end()
})

app.get('/api/dashboard/summary', auth, (_req, res) => {
  const counts = db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) AS received FROM parcels").get()
  const recent = db.prepare(`${parcelSelect} ORDER BY p.updated_at DESC LIMIT 10`).all()
  res.json({ totalParcels: counts.total, pending: counts.pending || 0, received: counts.received || 0, totalParties: db.prepare('SELECT COUNT(*) AS count FROM parties WHERE status = \'Active\'').get().count, recent })
})
app.get('/api/reports/parcels', auth, (_req, res) => res.json(db.prepare(`${parcelSelect} ORDER BY p.sent_date DESC`).all()))
app.get('/api/users', auth, requireAdmin, (_req, res) => res.json(db.prepare('SELECT id, name, email, role, status, created_at AS createdAt FROM users ORDER BY created_at DESC').all()))
app.post('/api/users', auth, requireAdmin, validate(userSchema), async (req, res) => {
  try {
    const user = { id: id(), name: req.body.name, email: req.body.email, passwordHash: await bcrypt.hash(req.body.password, 12) }
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(user.id, user.name, user.email, user.passwordHash, req.body.role)
    const created = db.prepare('SELECT id, name, email, role, status, created_at AS createdAt FROM users WHERE id = ?').get(user.id)
    res.status(201).json(created)
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email is already registered' })
    res.status(500).json({ error: 'Could not create staff account' })
  }
})
app.get('/api/settings', auth, requireAdmin, (_req, res) => res.json(Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((item) => [item.key, item.value]))))
app.patch('/api/settings', auth, requireAdmin, (req, res) => {
  const update = db.transaction((entries) => entries.forEach(([key, value]) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value))))
  update(Object.entries(req.body || {}))
  res.json(Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map((item) => [item.key, item.value])))
})

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Internal server error' }) })
const port = Number(process.env.PORT || 4000)
app.listen(port, () => console.log(`Parcel API listening on http://localhost:${port}`))
