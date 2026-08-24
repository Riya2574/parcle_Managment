import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import { z } from 'zod'
import crypto from 'crypto'

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const initializeDatabase = async () => {
  await db.query(`CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(120) NOT NULL DEFAULT '',
    phone VARCHAR(30) NOT NULL DEFAULT '',
    type VARCHAR(40) NOT NULL DEFAULT 'Retailer',
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await db.query(`CREATE TABLE IF NOT EXISTS parcels (
    id VARCHAR(32) PRIMARY KEY,
    party_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    product VARCHAR(255) NOT NULL,
    sent_date DATE NOT NULL,
    status ENUM('Pending', 'Received') NOT NULL DEFAULT 'Pending',
    received_date DATE NULL,
    payment VARCHAR(100) NOT NULL DEFAULT '',
    updated_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await db.query(`CREATE TABLE IF NOT EXISTS settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    \`value\` TEXT NOT NULL
  )`)
}

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

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = jwt.verify(token, jwtSecret)
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND status = ?', [payload.sub, 'Active'])
    const user = users[0]
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
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
const partySchema = z.object({ name: z.string().trim().min(2), city: z.string().trim().max(120).default(''), phone: z.string().trim().max(30).default(''), type: z.string().trim().max(40).default('Retailer') })
const parcelSchema = z.object({ partyId: z.string().min(1), customerName: z.string().trim().min(2), phone: z.string().trim().min(5).max(30), product: z.string().trim().min(1), sentDate: z.string().min(1).default(today()), status: z.enum(['Pending', 'Received']).default('Pending'), payment: z.string().trim().max(100).default('') })

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'parcel-management-api' }))




app.get('/api/db-test', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS connected, DATABASE() AS databaseName')
    res.json(rows[0])
  } catch (error) {
    console.error('Database test failed:', error)
    res.status(500).json({
      connected: false,
      error: error.message
    })
  }
})




app.post('/api/auth/signup', validate(authSchema), async (req, res) => {
  if (!process.env.ALLOW_PUBLIC_SIGNUP || process.env.ALLOW_PUBLIC_SIGNUP !== 'true') {
    return res.status(403).json({ error: 'Public signup is disabled. Ask an administrator to create your account.' })
  }

  if (!req.body.name) return res.status(400).json({ error: 'Name is required for signup' })
  try {
    const user = { id: id(), name: req.body.name, email: req.body.email, passwordHash: await bcrypt.hash(req.body.password, 12) }
    await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [user.id, user.name, user.email, user.passwordHash, 'Admin'])
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [user.id])
    const created = users[0]
    res.status(201).json({ token: tokenFor(created), user: publicUser(created) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email is already registered' })
    res.status(500).json({ error: 'Could not create account' })
  }
})

app.post('/api/auth/login', validate(authSchema.omit({ name: true })), async (req, res) => {
  const [users] = await db.query('SELECT * FROM users WHERE email = ?', [req.body.email])
  const user = users[0]
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' })
  res.json({ token: tokenFor(user), user: publicUser(user) })
})
app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }))
app.patch('/api/auth/password', auth, validate(passwordSchema), async (req, res) => {
  if (!(await bcrypt.compare(req.body.currentPassword, req.user.password_hash))) return res.status(400).json({ error: 'Current password is incorrect' })
  const passwordHash = await bcrypt.hash(req.body.newPassword, 12)
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id])
  res.json({ message: 'Password changed successfully' })
})

app.get('/api/parties', auth, async (_req, res) => {
  const [rows] = await db.query(`SELECT pa.*, COUNT(p.id) AS parcels, SUM(CASE WHEN p.status = 'Pending' THEN 1 ELSE 0 END) AS pending FROM parties pa LEFT JOIN parcels p ON p.party_id = pa.id GROUP BY pa.id ORDER BY pa.created_at DESC`)
  res.json(rows)
})
app.post('/api/parties', auth, validate(partySchema), async (req, res) => {
  try {
    const party = { id: id(), ...req.body }
    await db.query('INSERT INTO parties (id, name, city, phone, type) VALUES (?, ?, ?, ?, ?)', [party.id, party.name, party.city, party.phone, party.type])
    const [rows] = await db.query('SELECT *, 0 AS parcels, 0 AS pending FROM parties WHERE id = ?', [party.id])
    res.status(201).json(rows[0])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Party name already exists' })
    res.status(500).json({ error: 'Could not create party' })
  }
})
app.delete('/api/parties/:id', auth, requireAdmin, async (req, res) => {
  const result = await db.query('DELETE FROM parties WHERE id = ?', [req.params.id])
  if (result[0].affectedRows === 0) return res.status(404).json({ error: 'Party not found' })
  res.status(204).end()
})

app.get('/api/parcels', auth, async (req, res) => {
  const clauses = [], values = []
  if (req.query.partyId) { clauses.push('p.party_id = ?'); values.push(req.query.partyId) }
  if (req.query.status && ['Pending', 'Received'].includes(req.query.status)) { clauses.push('p.status = ?'); values.push(req.query.status) }
  if (req.query.search) { clauses.push('(p.id LIKE ? OR p.customer_name LIKE ? OR p.phone LIKE ? OR p.product LIKE ?)'); values.push(...Array(4).fill(`%${req.query.search}%`)) }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
  const [rows] = await db.query(`${parcelSelect}${where} ORDER BY p.created_at DESC`, values)
  res.json(rows)
})
app.post('/api/parcels', auth, validate(parcelSchema), async (req, res) => {
  const parcel = { id: `SR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, ...req.body, receivedDate: req.body.status === 'Received' ? today() : null }
  const [parties] = await db.query('SELECT id FROM parties WHERE id = ?', [parcel.partyId])
  if (!parties[0]) return res.status(400).json({ error: 'Party not found' })
  await db.query('INSERT INTO parcels (id, party_id, customer_name, phone, product, sent_date, status, received_date, payment, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [parcel.id, parcel.partyId, parcel.customerName, parcel.phone, parcel.product, parcel.sentDate, parcel.status, parcel.receivedDate, parcel.payment, req.user.id])
  const [rows] = await db.query(`${parcelSelect} WHERE p.id = ?`, [parcel.id])
  res.status(201).json(rows[0])
})
app.patch('/api/parcels/:id', auth, validate(parcelSchema.partial()), async (req, res) => {
  const [currentRows] = await db.query('SELECT * FROM parcels WHERE id = ?', [req.params.id])
  const current = currentRows[0]
  if (!current) return res.status(404).json({ error: 'Parcel not found' })
  const next = { ...current, ...req.body, receivedDate: req.body.status === 'Received' ? (current.received_date || today()) : (req.body.status === 'Pending' ? null : current.received_date) }
  await db.query('UPDATE parcels SET party_id=?, customer_name=?, phone=?, product=?, sent_date=?, status=?, received_date=?, payment=?, updated_by=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [next.party_id || next.partyId, next.customer_name || next.customerName, next.phone, next.product, next.sent_date || next.sentDate, next.status, next.receivedDate, next.payment || '', req.user.id, req.params.id])
  const [rows] = await db.query(`${parcelSelect} WHERE p.id = ?`, [req.params.id])
  res.json(rows[0])
})
app.delete('/api/parcels/:id', auth, requireAdmin, async (req, res) => {
  const result = await db.query('DELETE FROM parcels WHERE id = ?', [req.params.id])
  if (result[0].affectedRows === 0) return res.status(404).json({ error: 'Parcel not found' })
  res.status(204).end()
})

app.get('/api/dashboard/summary', auth, async (_req, res) => {
  const [counts] = await db.query("SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) AS received FROM parcels")
  const [recent] = await db.query(`${parcelSelect} ORDER BY p.updated_at DESC LIMIT 10`)
  const [partiesCount] = await db.query('SELECT COUNT(*) AS count FROM parties WHERE status = \'Active\'')
  res.json({ totalParcels: counts[0].total, pending: counts[0].pending || 0, received: counts[0].received || 0, totalParties: partiesCount[0].count, recent })
})
app.get('/api/reports/parcels', auth, async (_req, res) => {
  const [rows] = await db.query(`${parcelSelect} ORDER BY p.sent_date DESC`)
  res.json(rows)
})
app.get('/api/users', auth, requireAdmin, async (_req, res) => {
  const [rows] = await db.query('SELECT id, name, email, role, status, created_at AS createdAt FROM users ORDER BY created_at DESC')
  res.json(rows)
})
app.post('/api/users', auth, requireAdmin, validate(userSchema), async (req, res) => {
  try {
    const user = { id: id(), name: req.body.name, email: req.body.email, passwordHash: await bcrypt.hash(req.body.password, 12) }
    await db.query('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [user.id, user.name, user.email, user.passwordHash, req.body.role])
    const [rows] = await db.query('SELECT id, name, email, role, status, created_at AS createdAt FROM users WHERE id = ?', [user.id])
    res.status(201).json(rows[0])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email is already registered' })
    res.status(500).json({ error: 'Could not create staff account' })
  }
})
app.patch('/api/users/:id/status', auth, requireAdmin, async (req, res) => {
  const status = req.body?.status === 'Active' ? 'Active' : 'Inactive'
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot deactivate your own account' })
  const result = await db.query('UPDATE users SET status = ? WHERE id = ? AND role = ?', [status, req.params.id, 'Staff'])
  if (result[0].affectedRows === 0) return res.status(404).json({ error: 'Staff account not found' })
  const [rows] = await db.query('SELECT id, name, email, role, status, created_at AS createdAt FROM users WHERE id = ?', [req.params.id])
  res.json(rows[0])
})
app.get('/api/settings', auth, requireAdmin, async (_req, res) => {
  const [rows] = await db.query('SELECT `key`, `value` FROM settings')
  res.json(Object.fromEntries(rows.map((item) => [item.key, item.value])))
})
app.patch('/api/settings', auth, requireAdmin, async (req, res) => {
  for (const [key, value] of Object.entries(req.body || {})) {
    await db.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [key, String(value)])
  }
  const [rows] = await db.query('SELECT `key`, `value` FROM settings')
  res.json(Object.fromEntries(rows.map((item) => [item.key, item.value])))
})
app.get('/api/branding', auth, async (_req, res) => {
  const [rows] = await db.query('SELECT `key`, `value` FROM settings WHERE `key` IN (?, ?)', ['shopName', 'logoUrl'])
  const settings = Object.fromEntries(rows.map((item) => [item.key, item.value]))
  res.json({ shopName: settings.shopName || 'Rathore Shop', logoUrl: settings.logoUrl || '' })
})

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Internal server error' }) })
const port = Number(process.env.PORT || 4000)
initializeDatabase()
  .then(() => app.listen(port, () => console.log(`Parcel API listening on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Database initialization failed:', error.message)
    process.exitCode = 1
  })
