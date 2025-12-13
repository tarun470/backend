import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const SECRET = process.env.JWT_SECRET

// ❌ Do NOT crash server at import time
if (!SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment variables")
}

/* =========================
   SIGN TOKEN (STANDARDIZED)
========================= */
export function signToken(user) {
  if (!SECRET) {
    throw new Error("JWT_SECRET missing")
  }

  return jwt.sign(
    {
      id: user._id.toString()   // 🔥 ALWAYS use `id`
    },
    SECRET,
    { expiresIn: "7d" }
  )
}

/* =========================
   VERIFY TOKEN (SAFE)
========================= */
export function verifyToken(token) {
  if (!token || !SECRET) return null

  try {
    return jwt.verify(token, SECRET)
  } catch (err) {
    return null
  }
}
