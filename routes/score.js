import express from "express"
import Match from "../models/Match.js"
import { verifyToken } from "../utils/jwt.js"

const router = express.Router()

/* =========================
   RECENT MATCHES (AUTH)
========================= */
router.get("/recent", async (req, res) => {
  try {
    // 🔐 Auth check
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]
    const user = verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    // 🔢 Safe limit
    const limit = Math.min(
      parseInt(req.query.limit) || 20,
      50 // max allowed
    )

    const matches = await Match.find()
      .sort({ playedAt: -1 })
      .limit(limit)

    res.json({ matches })
  } catch (err) {
    console.error("Fetch recent matches error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
