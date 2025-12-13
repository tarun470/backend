import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const SECRET = process.env.JWT_SECRET

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables")
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: "7d"
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch (err) {
    return null
  }
}
