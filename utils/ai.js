export function checkWinner(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ]

  for (let [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }

  if (board.every(cell => cell !== null)) return "draw"
  return null
}

/* =========================
   MINIMAX (AI = 'O')
========================= */
export function minimax(board, player, depth = 0) {
  const winner = checkWinner(board)

  if (winner === "O") return { score: 10 - depth }
  if (winner === "X") return { score: depth - 10 }
  if (winner === "draw") return { score: 0 }

  const moves = []

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = player

      const result = minimax(
        board,
        player === "O" ? "X" : "O",
        depth + 1
      )

      moves.push({ index: i, score: result.score })
      board[i] = null
    }
  }

  // AI turn (maximize)
  if (player === "O") {
    return moves.reduce((best, move) =>
      move.score > best.score ? move : best
    )
  }

  // Human turn (minimize)
  return moves.reduce((best, move) =>
    move.score < best.score ? move : best
  )
}
