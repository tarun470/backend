import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
    const exists = await User.findOne({ username })
    if (exists) return res.status(400).json({ error: 'User exists' })

    const hash = bcrypt.hashSync(password, 10)
    const user = await User.create({ username, password: hash })
    const token = signToken({ id: user._id, username })
    res.json({ token, user: { id: user._id, username } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(400).json({ error: 'User not found' })

    const ok = bcrypt.compareSync(password, user.password)
    if (!ok) return res.status(400).json({ error: 'Wrong password' })

    const token = signToken({ id: user._id, username })
    res.json({ token, user: { id: user._id, username } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
