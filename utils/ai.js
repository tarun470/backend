export function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a]
  }
  if (board.every(c => c)) return 'draw'
  return null
}

export function minimax(board, player) {
  const winner = checkWinner(board)
  if (winner === 'X') return { score: 1 }
  if (winner === 'O') return { score: -1 }
  if (winner === 'draw') return { score: 0 }

  const moves = []
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player
      const result = minimax(board, player === 'X' ? 'O' : 'X')
      moves.push({ index: i, score: result.score })
      board[i] = ''
    }
  }

  if (player === 'X') return moves.reduce((a,b) => a.score > b.score ? a : b)
  else return moves.reduce((a,b) => a.score < b.score ? a : b)
}
