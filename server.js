import express from "express"
import http from "http"
import { Server } from "socket.io"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.js"
import roomRoutes from "./routes/room.js"
import scoreRoutes from "./routes/score.js"
import { socketHandler } from "./socket.js"

dotenv.config()

const app = express()

/* =========================
   ✅ CORS CONFIG (FIXED)
========================= */

const allowedOrigins = [
  "https://frontend-opr8.onrender.com",
  "https://frontend-tictactoe-uq28.onrender.com"
]

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools (Postman, curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      } else {
        return callback(new Error("CORS not allowed"), false)
      }
    },
    credentials: true
  })
)

app.use(express.json())

/* =========================
   ROUTES
========================= */

app.use("/auth", authRoutes)
app.use("/room", roomRoutes)
app.use("/score", scoreRoutes)

/* =========================
   DATABASE
========================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connect error:", err))

/* =========================
   SOCKET.IO
========================= */

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
})

/* =========================
   OPTIONAL REDIS ADAPTER
========================= */

if (process.env.USE_REDIS === "true" && process.env.REDIS_URL) {
  try {
    const { createAdapter } = await import("@socket.io/redis-adapter")
    const { createClient } = await import("redis")

    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()

    await pubClient.connect()
    await subClient.connect()

    io.adapter(createAdapter(pubClient, subClient))
    console.log("Socket.IO Redis adapter enabled")
  } catch (err) {
    console.warn("Failed to enable Redis adapter:", err)
  }
}

/* =========================
   SOCKET HANDLER
========================= */

io.on("connection", (socket) => socketHandler(io, socket))

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log("Server running on port " + PORT)
})

