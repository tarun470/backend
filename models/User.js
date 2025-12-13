import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // ⛔ never return password by default
    }
  },
  { timestamps: true }
)

/* =========================
   PASSWORD HASHING
========================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

/* =========================
   PASSWORD CHECK
========================= */
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)
