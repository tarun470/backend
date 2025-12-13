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
    /* =========================
       BASIC ROOM INFO
    ========================= */
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* =========================
       GAME MODE
    ========================= */
    isAI: {
      type: Boolean,
      default: false,
      index: true
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "hard"
    },

    /* =========================
       GAME STATE
    ========================= */
    board: {
      type: [String],
      default: () => Array(9).fill(null)
    },

    players: {
      type: [playerSchema],
      default: []
    },

    spectators: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },

    turn: {
      type: String,
      enum: ["X", "O"],
      default: "X"
    },

    winner: {
      type: String,
      enum: ["X", "O", "draw", null],
      default: null
    },

    finished: {
      type: Boolean,
      default: false
    },

    /* =========================
       REMATCH
    ========================= */
    rematchVotes: {
      type: [mongoose.Schema.Types.ObjectId],
      default: []
    },

    /* =========================
       SAFETY (AI SYNC)
    ========================= */
    lastMoveAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

export default mongoose.model("Room", roomSchema)
