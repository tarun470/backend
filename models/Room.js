import mongoose from 'mongoose'

const playerSchema = new mongoose.Schema({
  userId: String,
  symbol: String,
  socketId: String
})

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  board: { type: [String], default: Array(9).fill('') },
  players: { type: [playerSchema], default: [] },
  spectators: { type: [String], default: [] },
  turn: { type: String, default: 'X' },
  rematchVotes: { type: [String], default: [] },
  finished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Room', roomSchema)
