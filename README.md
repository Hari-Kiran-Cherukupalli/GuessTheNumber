# �� Guess The Number - Multiplayer & Single Player Game

A fun number guessing game with both single player and multiplayer modes, featuring sound effects and secure server-side game logic.

## ✨ Features

- **Player Names**: Enter your name (max 10 characters) for personalized gameplay
- **Single Player Mode**: Play against the computer with randomly generated numbers
- **Multiplayer Mode**: Create or join rooms with 4-character room codes
- **Sound Effects**: Audio feedback for clicks, guesses, wins, and losses
- **Secure Backend**: Secret numbers stored server-side to prevent cheating
- **Real-time Updates**: Live game state synchronization for multiplayer

## 🚀 Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 3. Start the Frontend

Open `index.html` in your web browser or serve it with a simple HTTP server:

```bash
# Using Python's built-in server
python -m http.server 8080

# Then open http://localhost:8080 in your browser
```

## 🎮 How to Play

### Single Player Mode
1. Enter your name
2. Click "Single Player"
3. Start guessing the computer's 4-digit number
4. You have 15 tries to guess correctly

### Multiplayer Mode

**Creating a Room:**
1. Enter your name
2. Click "Create Room"
3. Set your 4-digit secret number (all digits must be different)
4. Share the 4-character room code with your friend
5. Wait for them to join

**Joining a Room:**
1. Enter your name
2. Click "Join Room"
3. Enter the 4-character room code
4. Start guessing the host's secret number

## 🎨 Game Rules

- **Secret Number**: Must be exactly 4 digits with all different digits
- **Guesses**: You have 15 attempts to guess correctly
- **Feedback**: After each guess, you'll see:
  - **N (Numbers)**: How many digits are correct
  - **P (Positions)**: How many are in the right position
- **Color Coding**:
  - 🔴 Red: Less than 4 correct numbers
  - 🟡 Yellow: 4 correct numbers, wrong positions
  - 🟢 Green: Perfect match - You win!

## 🔧 Technical Details

- **Backend**: Python Flask with CORS support
- **Frontend**: Vanilla JavaScript with Web Audio API for sounds
- **Room Codes**: 4-character codes (reduced from 7 for easier sharing)
- **Security**: Secret numbers stored server-side only
- **Cleanup**: Automatic cleanup of games older than 2 hours

## 🎵 Sound Effects

The game includes audio feedback using the Web Audio API:
- Click sounds for button interactions
- Correct guess notifications
- Winning celebration melody
- Game over sound
- Error notifications

## 🔒 Security Features

- Secret numbers are never sent to the client
- All game logic validation happens server-side
- Prevents cheating through browser inspection
- Automatic game cleanup prevents memory leaks

## 📝 API Endpoints

- `POST /api/create-game` - Create a new multiplayer game
- `POST /api/create-single-player` - Start a single player game
- `POST /api/join-game` - Join an existing game room
- `POST /api/submit-guess` - Submit a guess and get result
- `GET /api/game-status/<room_code>` - Get current game state
- `POST /api/leave-game` - Leave/delete a game
- `GET /api/health` - Server health check

Enjoy the game! 🎉 