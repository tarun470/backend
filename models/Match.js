import mongoose from "mongoose"

const matchSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      index: true
    },

    playerX: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    playerO: {
      type: mongoose.Schema.Types.Mixed, // ObjectId or "AI"
      required: true
    },

    winner: {
      type: String,
      enum: ["X", "O", "D"],
      required: true
    }
  },
  {
    timestamps: true
  }
)

/* =========================
   INDEXES FOR PERFORMANCE
========================= */
matchSchema.index({ playerX: 1 })
matchSchema.index({ playerO: 1 })
matchSchema.index({ createdAt: -1 })

export default mongoose.model("Match", matchSchema)
