 🎮 Tic-Tac-Toe (Backend)

A **scalable real-time Tic-Tac-Toe backend** built using **Node.js, Express, Socket.IO, and MongoDB**, providing secure multiplayer gameplay, AI opponent logic, automatic rematches, and real-time synchronization.

This backend powers both:
- 👥 **Human vs Human (1v1)**
- 🤖 **Human vs AI (Minimax Algorithm)**

and communicates seamlessly with the React frontend via **Socket.IO**.

---

## 🌐 Live Deployment

- **Backend**: https://your-backend-url.onrender.com  
- **Frontend**: https://your-frontend-url.onrender.com  

---

## 🧠 Backend Responsibilities

The backend is responsible for:

- Authenticating users using JWT
- Creating & managing game rooms
- Handling real-time player moves
- Running AI logic (Minimax + Alpha-Beta)
- Syncing board state across clients
- Managing rematches
- Storing match history
- Maintaining game integrity & fairness

---

## 🛠️ Tech Stack

| Technology | Purpose |
|----------|--------|
| Node.js | Runtime |
| Express.js | REST APIs |
| Socket.IO | Real-time communication |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM |
| JWT | Authentication |
| Render | Deployment |

---

## 📁 Project Structure (Backend)

```txt
backend/
│
├── models/
│   ├── User.js        # User schema
│   ├── Room.js        # Game room schema
│   └── Match.js       # Match history schema
│
├── routes/
│   ├── auth.js        # Login / Register APIs
│   ├── room.js        # Room fetch APIs
│   └── score.js       # Match history APIs
│
├── utils/
│   ├── ai.js          # AI (Minimax + Alpha-Beta)
│   └── jwt.js         # JWT helper functions
│
├── socket.js          # Socket.IO game logic
├── server.js          # App entry point
├── package.json
├── .env.example
└── README.md
🗄️ Database (MongoDB)
📌 Database Used
MongoDB Atlas (Cloud)

Stores users, rooms, and match history

Ensures persistence even after server restart

🧩 Database Schemas Explained
👤 User Schema (models/User.js)
Stores authentication details.

Purpose:

Identify players

Secure socket connections

Track match history

Key Fields:

username

password (hashed)

nickname

🏠 Room Schema (models/Room.js)
Represents an active game room.

Why this schema is important:

Maintains game state

Syncs board in real-time

Tracks players & spectators

Handles rematch votes

Key Fields Explained:

Field	Description
code	Unique room code
createdBy	Room owner
board	3×3 game board
players	Player list with symbols
spectators	Watch-only users
turn	Current turn (X / O)
isAI	AI room or not
finished	Game over flag
rematchVotes	Players voting for rematch

🏆 Match Schema (models/Match.js)
Stores completed match history.

Purpose:

Analytics

Scoreboards (future)

User match tracking

Key Fields:

roomCode

playerX

playerO

winner

createdAt

🔐 Authentication Flow (JWT)
User logs in / registers

JWT token generated

Token stored in frontend

Socket connects using token

Backend verifies token

Secure socket session established

This prevents:

Unauthorized players

Fake socket connections

⚡ Socket.IO Architecture
📍 socket.js (Core of Backend)
Handles all real-time game logic.

🔌 Socket Events Overview
Event	Description
createRoom	Create 1v1 room
createAiRoom	Create AI room
joinRoom	Join existing room
makeMove	Player makes move
moveMade	Broadcast move
gameOver	Game finished
voteRematch	Rematch voting
rematchStarted	Restart game
playerLeft	Handle disconnect

🧠 Game Flow (Human vs Human)
Player creates room

Second player joins

Turns alternate (X / O)

Moves validated on backend

Winner calculated

Result broadcasted

🤖 AI Game Flow
Human plays as X

Backend computes AI move using Minimax

AI plays as O

Game continues automatically

No cheating possible (server-controlled)

🧠 AI Logic (utils/ai.js)
Algorithm Used
Minimax

Alpha-Beta Pruning

Why this AI is effective
Optimal play

Cannot be defeated

Efficient pruning for performance

Backend-only AI ensures fairness
Frontend never computes AI moves.

🔁 Rematch System
Players vote for rematch

Votes synced in real-time

Required votes:

AI game → 1 vote

1v1 game → 2 votes

Game resets automatically

Board updates without reload

🚀 How to Run Locally
1️⃣ Clone Repository
bash
Copy code
git clone https://github.com/your-username/tic-tac-toe-backend.git
cd tic-tac-toe-backend
2️⃣ Install Dependencies
bash
Copy code
npm install
3️⃣ Configure Environment Variables
Create a .env file:

env
Copy code
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
4️⃣ Start Server
bash
Copy code
node server.js
Server runs at:

arduino
Copy code
http://localhost:5000
☁️ Deployment on Render (Backend)
Steps Followed
Push backend code to GitHub

Go to Render → New → Web Service

Select repository

Configure:

Setting	Value
Build Command	npm install
Start Command	node server.js
Environment	Node

Add environment variables

Click Deploy 🚀

🔒 Security Measures
✔️ JWT-based socket authentication

✔️ Server-side game validation

✔️ No client-side AI logic

✔️ Protected REST routes

✔️ Secure MongoDB access

📌 Future Enhancements
🧠 AI difficulty levels

📊 Player statistics

🏆 Leaderboards

👀 Live spectators list

🌍 Public matchmaking

👨‍💻 Author
TARUN DUGGEMPUDI
Full-Stack Developer
Node.js | Express | Socket.IO | MongoDB | React

📄 License
This project is licensed under the MIT License.
