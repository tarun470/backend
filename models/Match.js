import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  roomCode: String,
  playerX: String,
  playerO: String,
  winner: String,
  playedAt: { type: Date, default: Date.now }
})

export default mongoose.model('Match', schema)
