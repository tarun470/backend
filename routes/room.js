import express from "express"
import Room from "../models/Room.js"
import { verifyToken } from "../utils/jwt.js"

const router = express.Router()

/* =========================
   CREATE ROOM (AUTH REQUIRED)
========================= */
router.post("/create", async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // works for "Bearer token" and "token"
    const token = authHeader.split(" ").pop()
    const user = verifyToken(token)

    if (!user || !user.id) {
      return res.status(401).json({ error: "Invalid token" })
    }

    let code
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (await Room.findOne({ code }))

    const room = await Room.create({
      code,
      createdBy: user.id   // 🔥 REQUIRED BY SCHEMA
    })

    res.status(201).json({ room })
  } catch (err) {
    console.error("Create room error:", err)
    res.status(500).json({ error: err.message })
  }
})

/* =========================
   GET ROOM (PUBLIC)
========================= */
router.get("/:code", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code })
    if (!room) {
      return res.status(404).json({ error: "Room not found" })
    }
    res.json({ room })
  } catch (err) {
    console.error("Get room error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
