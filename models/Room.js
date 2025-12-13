import mongoose from "mongoose"

const playerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    symbol: {
      type: String,
      enum: ["X", "O"],
      required: true
    },
    socketId: {
      type: String,
      required: true
    }
  },
  { _id: false }
)

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    board: {
      type: [String],
      default: () => Array(9).fill(null)
    },

    players: {
      type: [playerSchema],
      default: []
    },

    spectators: {
      type: [String],
      default: []
    },

    turn: {
      type: String,
      enum: ["X", "O"],
      default: "X"
    },

    rematchVotes: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    },

    finished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model("Room", roomSchema)
