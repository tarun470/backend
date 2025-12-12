import express from 'express'
import Room from '../models/Room.js'
import { verifyToken } from '../utils/jwt.js'

const router = express.Router()

router.post('/create', async (req, res) => {
  const { token } = req.body
  const u = verifyToken(token)
  if (!u) return res.status(401).json({ error: 'Unauthorized' })

  let code = Math.random().toString(36).substr(2,6).toUpperCase()
  while (await Room.findOne({ code })) code = Math.random().toString(36).substr(2,6).toUpperCase()

  const room = await Room.create({ code })
  res.json({ room })
})

router.get('/:code', async (req, res) => {
  const room = await Room.findOne({ code: req.params.code })
  if (!room) return res.status(404).json({ error: 'Not found' })
  res.json({ room })
})

export default router
