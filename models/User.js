import User from "../models/User.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // 🔥 IMPORTANT FIX
    const user = await User.findOne({ username }).select("+password")
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username
      }
    })

  } catch (err) {
    console.error("Login Error:", err)
    res.status(500).json({ message: "Server error" })
  }
}
