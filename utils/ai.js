import { checkWinner } from "./ai.js" // remove if same file

export function minimax(board, player, depth = 0, alpha = -Infinity, beta = Infinity) {
  const winner = checkWinner(board)

  if (winner === "O") return { score: 10 - depth }
  if (winner === "X") return { score: depth - 10 }
  if (winner === "draw") return { score: 0 }

  let bestMove = null

  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue

    board[i] = player
    const { score } = minimax(
      board,
      player === "O" ? "X" : "O",
      depth + 1,
      alpha,
      beta
    )
    board[i] = null

    if (player === "O") {
      if (bestMove === null || score > alpha) {
        alpha = score
        bestMove = { index: i, score }
      }
    } else {
      if (bestMove === null || score < beta) {
        beta = score
        bestMove = { index: i, score }
      }
    }

    if (alpha >= beta) break
  }

  // ✅ ALWAYS return a move when possible
  return bestMove ?? { index: null, score: 0 }
}
