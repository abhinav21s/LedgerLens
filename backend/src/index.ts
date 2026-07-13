import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Read allowed origins from ALLOWED_ORIGIN env var, default to http://localhost:3000 for local dev
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000'

app.use(
  '*',
  cors({
    origin: allowedOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const port = Number(process.env.PORT) || 4000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
