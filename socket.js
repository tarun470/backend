import Room from './models/Room.js'
import Match from './models/Match.js'
import { minimax, checkWinner } from './utils/ai.js'
import { verifyToken } from './utils/jwt.js'

function generateCode() {
  return Math.random().toString(36).substr(2,6).toUpperCase()
}

export const socketHandler = (io, socket) => {
  console.log('Socket connected', socket.id)

  socket.on('createRoom', async ({ token }) => {
    const payload = verifyToken(token)
    if (!payload) return io.to(socket.id).emit('error', 'Unauthorized')

    let code = generateCode()
    while (await Room.findOne({ code })) code = generateCode()

    const room = await Room.create({
      code,
      board: Array(9).fill(''),
      players: [{ userId: payload.id, symbol: 'X', socketId: socket.id }],
      spectators: [],
      turn: 'X',
      rematchVotes: [],
      finished: false
    })

    socket.join(code)
    io.to(socket.id).emit('roomCreated', { code, symbol: 'X', room })
  })

  socket.on('joinRoom', async ({ code, token }) => {
    const payload = verifyToken(token)
    if (!payload) return io.to(socket.id).emit('error', 'Unauthorized')

    const room = await Room.findOne({ code })
    if (!room) return io.to(socket.id).emit('error', 'Room not found')

    if (room.players.length < 2) {
      const symbol = room.players[0].symbol === 'X' ? 'O' : 'X'
      room.players.push({ userId: payload.id, symbol, socketId: socket.id })
      await room.save()
      socket.join(code)
      io.to(code).emit('playerJoined', { room })
    } else {
      // spectator
      room.spectators.push(socket.id)
      await room.save()
      socket.join(code)
      io.to(socket.id).emit('joinedAsSpectator', { room })
    }
  })

  socket.on('makeMove', async ({ code, index, symbol }) => {
    const room = await Room.findOne({ code })
    if (!room || room.finished) return
    if (room.board[index]) return

    const isPlayer = room.players.some(p => p.socketId === socket.id)
    if (!isPlayer) return io.to(socket.id).emit('error', 'Not a player')

    room.board[index] = symbol
    const winner = checkWinner(room.board)
    if (winner) {
      room.finished = true
      await room.save()

      const px = room.players[0]?.userId || null
      const po = room.players[1]?.userId || null
      await Match.create({ roomCode: code, playerX: px, playerO: po, winner: winner === 'draw' ? 'D' : winner })

      io.to(code).emit('gameOver', { winner, board: room.board })
      return
    }

    room.turn = room.turn === 'X' ? 'O' : 'X'
    await room.save()
    io.to(code).emit('moveMade', { board: room.board, turn: room.turn })

    // If 1vAI: single player present and it's O's turn
    if (room.players.length === 1 && room.turn === 'O') {
      const move = minimax([...room.board], 'O')
      if (move && typeof move.index === 'number') {
        room.board[move.index] = 'O'
        const win2 = checkWinner(room.board)
        if (win2) {
          room.finished = true
          await room.save()
          await Match.create({ roomCode: code, playerX: room.players[0].userId, playerO: 'AI', winner: win2 === 'draw' ? 'D' : win2 })
          io.to(code).emit('gameOver', { winner: win2, board: room.board })
        } else {
          room.turn = 'X'
          await room.save()
          io.to(code).emit('moveMade', { board: room.board, turn: room.turn })
        }
      }
    }
  })

  socket.on('voteRematch', async ({ code }) => {
    const room = await Room.findOne({ code })
    if (!room) return
    if (!room.rematchVotes.includes(socket.id)) room.rematchVotes.push(socket.id)
    if (room.rematchVotes.length >= 2) {
      room.board = Array(9).fill('')
      room.finished = false
      room.turn = 'X'
      room.rematchVotes = []
      await room.save()
      io.to(code).emit('rematchStarted', { room })
    } else {
      await room.save()
      io.to(code).emit('rematchVote', { votes: room.rematchVotes.length })
    }
  })

  socket.on('disconnect', async () => {
    const rooms = await Room.find({ $or: [ { 'players.socketId': socket.id }, { spectators: socket.id } ] })
    for (const r of rooms) {
      r.players = r.players.filter(p => p.socketId !== socket.id)
      r.spectators = r.spectators.filter(s => s !== socket.id)
      if (r.players.length === 0) {
        await Room.deleteOne({ _id: r._id })
      } else {
        await r.save()
        io.to(r.code).emit('playerLeft', { room: r })
      }
    }
  })
}
