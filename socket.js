import Room from "./models/Room.js"
import Match from "./models/Match.js"
import { minimax, checkWinner } from "./utils/ai.js"
import { verifyToken } from "./utils/jwt.js"

function generateCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

export const socketHandler = (io, socket) => {
  // 🔐 socket authentication (MANDATORY)
  const token = socket.handshake.auth?.token
  const user = verifyToken(token)

  if (!user) {
    console.log("Unauthorized socket:", socket.id)
    socket.disconnect()
    return
  }

  socket.user = user
  console.log("Socket connected:", socket.id, "User:", user.id)

  /* =========================
     CREATE ROOM
  ========================= */
  socket.on("createRoom", async () => {
    let code = generateCode()
    while (await Room.findOne({ code })) code = generateCode()

    const room = await Room.create({
      code,
      board: Array(9).fill(null),
      players: [{ userId: user.id, symbol: "X", socketId: socket.id }],
      spectators: [],
      turn: "X",
      rematchVotes: [],
      finished: false
    })

    socket.join(code)
    socket.emit("roomCreated", { code, symbol: "X", room })
  })

  /* =========================
     JOIN ROOM
  ========================= */
  socket.on("joinRoom", async ({ code }) => {
    const room = await Room.findOne({ code })
    if (!room) return socket.emit("error", "Room not found")

    // 🔁 Reconnect handling
    const existing = room.players.find(p => p.userId === user.id)
    if (existing) {
      existing.socketId = socket.id
      await room.save()
      socket.join(code)
      return socket.emit("playerJoined", { room })
    }

    if (room.players.length < 2) {
      const symbol = room.players[0].symbol === "X" ? "O" : "X"
      room.players.push({ userId: user.id, symbol, socketId: socket.id })
      await room.save()
      socket.join(code)
      io.to(code).emit("playerJoined", { room })
    } else {
      if (!room.spectators.includes(socket.id)) {
        room.spectators.push(socket.id)
        await room.save()
      }
      socket.join(code)
      socket.emit("joinedAsSpectator", { room })
    }
  })

  /* =========================
     MAKE MOVE
  ========================= */
  socket.on("makeMove", async ({ code, index }) => {
    if (index < 0 || index > 8) return

    const room = await Room.findOne({ code })
    if (!room || room.finished) return
    if (room.board[index] !== null) return

    const player = room.players.find(p => p.socketId === socket.id)
    if (!player) return
    if (room.turn !== player.symbol) return

    room.board[index] = player.symbol

    const winner = checkWinner(room.board)
    if (winner) {
      room.finished = true
      await room.save()

      await Match.create({
        roomCode: code,
        playerX: room.players[0]?.userId || null,
        playerO: room.players[1]?.userId || "AI",
        winner: winner === "draw" ? "D" : winner
      })

      return io.to(code).emit("gameOver", { winner, board: room.board })
    }

    room.turn = room.turn === "X" ? "O" : "X"
    await room.save()
    io.to(code).emit("moveMade", { board: room.board, turn: room.turn })

    /* ===== AI MOVE ===== */
    if (room.players.length === 1 && room.turn === "O") {
      const move = minimax([...room.board], "O")
      if (move?.index !== undefined) {
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
          io.to(code).emit("gameOver", { winner: aiWin, board: room.board })
        } else {
          room.turn = "X"
          await room.save()
          io.to(code).emit("moveMade", { board: room.board, turn: room.turn })
        }
      }
    }
  })

  /* =========================
     REMATCH
  ========================= */
  socket.on("voteRematch", async ({ code }) => {
    const room = await Room.findOne({ code })
    if (!room) return

    if (!room.rematchVotes.includes(user.id)) {
      room.rematchVotes.push(user.id)
    }

    if (room.rematchVotes.length === room.players.length) {
      room.board = Array(9).fill(null)
      room.finished = false
      room.turn = "X"
      room.rematchVotes = []
      await room.save()
      io.to(code).emit("rematchStarted", { room })
    } else {
      await room.save()
      io.to(code).emit("rematchVote", { votes: room.rematchVotes.length })
    }
  })

  /* =========================
     DISCONNECT
  ========================= */
  socket.on("disconnect", async () => {
    const rooms = await Room.find({ "players.userId": user.id })
    for (const r of rooms) {
      const p = r.players.find(p => p.userId === user.id)
      if (p) p.socketId = null
      await r.save()
      io.to(r.code).emit("playerLeft", { room: r })
    }
  })
}
