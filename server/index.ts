import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import playerRoutes from './routes/players.js'
import { getPublicConfig } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT ?? 3001)
const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(
  cors({
    origin: isProd ? false : 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/config', (_req, res) => {
  res.json(getPublicConfig())
})

app.use('/api/auth', authRoutes)
app.use('/api/players', playerRoutes)

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`)
})
