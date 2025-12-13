import Room from "./models/Room.js"
import Match from "./models/Match.js"
import { minimax, checkWinner } from "./utils/ai.js"
import { verifyToken } from "./utils/jwt.js"

/* =========================
   HELPERS
========================= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const delay = (ms) => new Promise(res => setTimeout(res, ms))

const toggleTurn = (turn) => (turn === "X" ? "O" : "X")

/* =========================
   SOCKET HANDLER
========================= */
export const socketHandler = (io, socket) => {

  /* =========================
     SOCKET AUTH
  ========================= */
  const token = socket.handshake.auth?.token
  const user = verifyToken(token)

  if (!user?.id) {
    socket.disconnect()
    return
  }

  socket.user = user
  console.log("✅ Socket connected:", socket.id, user.id)

  /* =========================
     CREATE ROOM (1v1)
  ========================= */
  socket.on("createRoom", async () => {
    try {
      let code
      do {
        code = generateCode()
      } while (await Room.findOne({ code }))

      const room = await Room.create({
        code,
        createdBy: user.id,
        isAI: false,
        board: Array(9).fill(null),
        players: [{
          userId: user.id,
          symbol: "X",
          socketId: socket.id
        }],
        spectators: [],
        turn: "X",
        finished: false,
        rematchVotes: []
      })

      socket.join(code)
      socket.emit("roomCreated", { room })
    } catch (err) {
      console.error("Create room error:", err)
      socket.emit("roomError", "Failed to create room")
    }
  })

  /* =========================
     CREATE ROOM (AI)
  ========================= */
  socket.on("createAiRoom", async () => {
    try {
      let code
      do {
        code = generateCode()
      } while (await Room.findOne({ code }))

      const room = await Room.create({
        code,
        createdBy: user.id,
        isAI: true,
        board: Array(9).fill(null),
        players: [{
          userId: user.id,
          symbol: "X",
          socketId: socket.id
        }],
        spectators: [],
        turn: "X",
        finished: false,
        rematchVotes: []
      })

      socket.join(code)
      socket.emit("roomCreated", { room })
    } catch (err) {
      console.error("Create AI room error:", err)
      socket.emit("roomError", "Failed to create AI room")
    }
  })

  /* =========================
     JOIN ROOM (SAFE)
  ========================= */
  socket.on("joinRoom", async ({ code }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room) return socket.emit("roomError", "Room not found")

      // reconnect
      const existing = room.players.find(p => p.userId.equals(user.id))
      if (existing) {
        existing.socketId = socket.id
        await room.save()
        socket.join(code)
        return io.to(code).emit("playerJoined", { room })
      }

      // ⚠️ SAFETY: if no players exist
      if (room.players.length === 0) {
        room.players.push({
          userId: user.id,
          symbol: "X",
          socketId: socket.id
        })
        await room.save()
        socket.join(code)
        return io.to(code).emit("playerJoined", { room })
      }

      // second player (1v1)
      if (!room.isAI && room.players.length === 1) {
        const symbol = room.players[0].symbol === "X" ? "O" : "X"
        room.players.push({
          userId: user.id,
          symbol,
          socketId: socket.id
        })
        await room.save()
        socket.join(code)
        return io.to(code).emit("playerJoined", { room })
      }

      // spectator
      if (!room.spectators.some(id => id.equals(user.id))) {
        room.spectators.push(user.id)
        await room.save()
      }

      socket.join(code)
      socket.emit("joinedAsSpectator", { room })
    } catch (err) {
      console.error("Join room error:", err)
      socket.emit("roomError", "Failed to join room")
    }
  })

  /* =========================
     MAKE MOVE (PLAYER + AI)
  ========================= */
  socket.on("makeMove", async ({ code, index }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room || room.finished) return
      if (room.board[index] !== null) return

      const player = room.players.find(p => p.socketId === socket.id)
      if (!player || room.turn !== player.symbol) return

      // PLAYER MOVE
      room.board[index] = player.symbol

      let winner = checkWinner(room.board)
      if (winner) {
        room.finished = true
        await room.save()
        return io.to(code).emit("gameOver", { winner, board: room.board })
      }

      room.turn = toggleTurn(room.turn)
      await room.save()

      io.to(code).emit("moveMade", {
        board: room.board,
        turn: room.turn
      })

      // AI MOVE
      if (room.isAI && room.turn === "O" && room.players.length === 1) {
        await delay(500)

        const aiMove = minimax([...room.board], "O")
        if (aiMove?.index === undefined) return

        room.board[aiMove.index] = "O"

        winner = checkWinner(room.board)
        if (winner) {
          room.finished = true
          await room.save()
          return io.to(code).emit("gameOver", {
            winner,
            board: room.board
          })
        }

        room.turn = "X"
        await room.save()

        io.to(code).emit("moveMade", {
          board: room.board,
          turn: room.turn
        })
      }
    } catch (err) {
      console.error("Make move error:", err)
    }
  })

  /* =========================
     REMATCH (AUTO SAFE)
  ========================= */
  socket.on("voteRematch", async ({ code }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room) return

      if (!room.rematchVotes.some(id => id.equals(user.id))) {
        room.rematchVotes.push(user.id)
      }

      const required = room.isAI ? 1 : room.players.length

      io.to(code).emit("rematchVote", {
        votes: room.rematchVotes.length,
        required
      })

      if (room.rematchVotes.length >= required) {
        room.board = Array(9).fill(null)
        room.turn = "X"
        room.finished = false
        room.rematchVotes = []
        await room.save()
        io.to(code).emit("rematchStarted", { room })
      } else {
        await room.save()
      }
    } catch (err) {
      console.error("Rematch error:", err)
    }
  })

  /* =========================
     DISCONNECT
  ========================= */
  socket.on("disconnect", async () => {
    const rooms = await Room.find({ "players.userId": user.id })
    for (const r of rooms) {
      r.players = r.players.filter(p => !p.userId.equals(user.id))
      await r.save()
      io.to(r.code).emit("playerLeft", { room: r })
    }
  })
}
