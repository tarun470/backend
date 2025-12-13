import express from "express"
import bcrypt from "bcryptjs"
import User from "../models/User.js"
import { signToken } from "../utils/jwt.js"

const router = express.Router()

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" })
    }

    const exists = await User.findOne({ username })
    if (exists) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await User.create({
      username,
      password: hash
    })

    const token = signToken({
      id: user._id,
      username: user.username
    })

    res.json({
      token,
      user: { id: user._id, username: user.username }
    })
  } catch (err) {
    console.error("Register error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" })
    }

    const user = await User.findOne({ username })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    const token = signToken({
      id: user._id,
      username: user.username
    })

    res.json({
      token,
      user: { id: user._id, username: user.username }
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
