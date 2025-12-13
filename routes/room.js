import express from "express"
import Room from "../models/Room.js"
import { verifyToken } from "../utils/jwt.js"

const router = express.Router()

/* =========================
   CREATE ROOM (AUTH HEADER)
========================= */
router.post("/create", async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]
    const user = verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    let code = Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()

    while (await Room.findOne({ code })) {
      code = Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()
    }

    const room = await Room.create({ code })
    res.json({ room })
  } catch (err) {
    console.error("Create room error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

/* =========================
   GET ROOM (PUBLIC)
========================= */
router.get("/:code", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code })
    if (!room) {
      return res.status(404).json({ error: "Not found" })
    }
    res.json({ room })
  } catch (err) {
    console.error("Get room error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
