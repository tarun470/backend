/* =========================
   CHECK WINNER
========================= */
export function checkWinner(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ]

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }

  if (board.every(cell => cell !== null)) return "draw"
  return null
}

/* =========================
   MINIMAX (ALPHA-BETA)
========================= */
export function minimax(
  board,
  player,
  depth = 0,
  alpha = -Infinity,
  beta = Infinity
) {
  const winner = checkWinner(board)

  if (winner === "O") return { score: 10 - depth }
  if (winner === "X") return { score: depth - 10 }
  if (winner === "draw") return { score: 0 }

  let bestMove = null

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue

    board[i] = player
    const result = minimax(
      board,
      player === "O" ? "X" : "O",
      depth + 1,
      alpha,
      beta
    )
    board[i] = null

    const score = result.score

    if (player === "O") {
      if (score > alpha) {
        alpha = score
        bestMove = { index: i, score }
      }
    } else {
      if (score < beta) {
        beta = score
        bestMove = { index: i, score }
      }
    }

    if (alpha >= beta) break
  }

  return bestMove || { score: 0 }
}

