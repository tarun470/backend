import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import roomRoutes from './routes/room.js'
import scoreRoutes from './routes/score.js'
import { socketHandler } from './socket.js'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/room', roomRoutes)
app.use('/score', scoreRoutes)

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error:', err))

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST'] }
})

// Optional Redis adapter (if USE_REDIS=true)
if (process.env.USE_REDIS === 'true' && process.env.REDIS_URL) {
  try {
    const { createAdapter } = await import('socket.io-redis')
    const adapter = createAdapter({ url: process.env.REDIS_URL })
    io.adapter(adapter)
    console.log('Socket.IO Redis adapter enabled')
  } catch (err) {
    console.warn('Failed to enable Redis adapter:', err)
  }
}

io.on('connection', socket => socketHandler(io, socket))

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log('Server running on ' + PORT))
