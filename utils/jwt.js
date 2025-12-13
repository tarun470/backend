import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const SECRET = process.env.JWT_SECRET

if (!SECRET) {
  console.error("JWT_SECRET is not defined")
}

export function signToken(user) {
  if (!user || !user._id) {
    throw new Error("Invalid user object passed to signToken")
  }

  return jwt.sign(
    { id: user._id.toString() },
    SECRET,
    { expiresIn: "7d" }
  )
}

export function verifyToken(token) {
  if (!token || !SECRET) return null

  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

