import express from 'express'
import Match from '../models/Match.js'

const router = express.Router()

router.get('/recent', async (req, res) => {
  const matches = await Match.find().sort({ playedAt: -1 }).limit(20)
  res.json({ matches })
})

export default router
