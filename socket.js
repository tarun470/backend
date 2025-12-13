import Room from "./models/Room.js"
import Match from "./models/Match.js"
import { minimax, checkWinner } from "./utils/ai.js"
import { verifyToken } from "./utils/jwt.js"

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const socketHandler = (io, socket) => {
  /* =========================
     SOCKET AUTH
  ========================= */
  const token = socket.handshake.auth?.token
  const user = verifyToken(token)

  if (!user || !user.id) {
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
     JOIN ROOM
  ========================= */
  socket.on("joinRoom", async ({ code }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room) return socket.emit("roomError", "Room not found")

      // reconnect
      const existing = room.players.find(p =>
        p.userId.equals(user.id)
      )

      if (existing) {
        existing.socketId = socket.id
        await room.save()
        socket.join(code)
        return io.to(code).emit("playerJoined", { room })
      }

      // join as second player (1v1)
      if (!room.isAI && room.players.length < 2) {
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
     MAKE MOVE
  ========================= */
  socket.on("makeMove", async ({ code, index }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room || room.finished) return
      if (room.board[index] !== null) return

      const player = room.players.find(p => p.socketId === socket.id)
      if (!player || room.turn !== player.symbol) return

      room.board[index] = player.symbol

      const win = checkWinner(room.board)
      if (win) {
        room.finished = true
        await room.save()

        await Match.create({
          roomCode: code,
          playerX: room.players[0]?.userId,
          playerO: room.isAI ? "AI" : room.players[1]?.userId,
          winner: win === "draw" ? "D" : win
        })

        return io.to(code).emit("gameOver", {
          winner: win,
          board: room.board
        })
      }

      room.turn = room.turn === "X" ? "O" : "X"
      await room.save()

      io.to(code).emit("moveMade", {
        board: room.board,
        turn: room.turn
      })

      /* =========================
         AI MOVE
      ========================= */
      if (room.isAI && room.turn === "O") {
        await new Promise(r => setTimeout(r, 400))

        const move = minimax([...room.board], "O")
        if (move?.index === undefined) return

        room.board[move.index] = "O"

        const aiWin = checkWinner(room.board)
        if (aiWin) {
          room.finished = true
          await room.save()

          await Match.create({
            roomCode: code,
            playerX: room.players[0].userId,
            playerO: "AI",
            winner: aiWin === "draw" ? "D" : aiWin
          })

          return io.to(code).emit("gameOver", {
            winner: aiWin,
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
     REMATCH (AUTO + WAITING MESSAGE)
  ========================= */
  socket.on("voteRematch", async ({ code }) => {
    try {
      const room = await Room.findOne({ code })
      if (!room) return

      if (!room.rematchVotes.some(id => id.equals(user.id))) {
        room.rematchVotes.push(user.id)
      }

      const requiredVotes = room.isAI ? 1 : 2

      // 🔔 send vote status for UI
      io.to(code).emit("rematchVote", {
        votes: room.rematchVotes.length,
        required: requiredVotes
      })

      // ✅ auto restart
      if (room.rematchVotes.length >= requiredVotes) {
        room.board = Array(9).fill(null)
        room.finished = false
        room.turn = "X"
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
