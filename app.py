from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import string
import time
from datetime import datetime, timedelta
import threading

app = Flask(__name__)
CORS(app)

# In-memory storage for games (in production, use a proper database)
games = {}
game_cleanup_lock = threading.Lock()

def generate_room_code():
    """Generate a 4-character room code"""
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return ''.join(random.choice(letters) for _ in range(4))

def generate_secret_number():
    """Generate a random 4-digit number with unique digits"""
    digits = []
    while len(digits) < 4:
        digit = str(random.randint(0, 9))
        if digit not in digits:
            digits.append(digit)
    return ''.join(digits)

def cleanup_old_games():
    """Remove games older than 2 hours"""
    with game_cleanup_lock:
        current_time = datetime.now()
        games_to_remove = []
        
        for room_code, game_data in games.items():
            game_time = datetime.fromtimestamp(game_data['timestamp'] / 1000)
            if current_time - game_time > timedelta(hours=2):
                games_to_remove.append(room_code)
        
        for room_code in games_to_remove:
            del games[room_code]

# Schedule cleanup every 30 minutes
def schedule_cleanup():
    cleanup_old_games()
    threading.Timer(1800, schedule_cleanup).start()

schedule_cleanup()

@app.route('/api/create-game', methods=['POST'])
def create_game():
    """Create a new game room"""
    try:
        data = request.json
        player_name = data.get('playerName', '').strip()
        secret_number = data.get('secretNumber', '').strip()
        
        if not player_name or len(player_name) > 10:
            return jsonify({'error': 'Invalid player name'}), 400
            
        if not secret_number or len(secret_number) != 4:
            return jsonify({'error': 'Invalid secret number'}), 400
            
        # Validate secret number (4 unique digits)
        if not secret_number.isdigit() or len(set(secret_number)) != 4:
            return jsonify({'error': 'Secret number must have 4 unique digits'}), 400
        
        # Generate unique room code
        room_code = generate_room_code()
        while room_code in games:
            room_code = generate_room_code()
        
        # Store game data
        games[room_code] = {
            'roomCode': room_code,
            'secretNumber': secret_number,
            'hostName': player_name,
            'guesserName': None,
            'gameActive': False,
            'guesses': [],
            'timestamp': int(time.time() * 1000)
        }
        
        return jsonify({
            'success': True,
            'roomCode': room_code
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create-single-player', methods=['POST'])
def create_single_player():
    """Create a single player game"""
    try:
        data = request.json
        player_name = data.get('playerName', '').strip()
        
        if not player_name or len(player_name) > 10:
            return jsonify({'error': 'Invalid player name'}), 400
        
        secret_number = generate_secret_number()
        
        # Generate a unique game ID for single player
        game_id = f"SINGLE_{int(time.time() * 1000)}"
        
        # Store single player game data server-side
        games[game_id] = {
            'roomCode': game_id,
            'secretNumber': secret_number,
            'playerName': player_name,
            'gameType': 'single_player',
            'guesses': [],
            'timestamp': int(time.time() * 1000)
        }
        
        return jsonify({
            'success': True,
            'gameId': game_id  # Return game ID, NOT the secret number
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/join-game', methods=['POST'])
def join_game():
    """Join an existing game room"""
    try:
        data = request.json
        room_code = data.get('roomCode', '').strip().upper()
        player_name = data.get('playerName', '').strip()
        
        if not player_name or len(player_name) > 10:
            return jsonify({'error': 'Invalid player name'}), 400
            
        if not room_code or len(room_code) != 4:
            return jsonify({'error': 'Invalid room code'}), 400
        
        if room_code not in games:
            return jsonify({'error': 'Room not found'}), 404
            
        game = games[room_code]
        
        if game['guesserName'] is not None:
            return jsonify({'error': 'Room is full'}), 400
        
        # Join the game
        game['guesserName'] = player_name
        game['gameActive'] = True
        
        return jsonify({
            'success': True,
            'hostName': game['hostName'],
            'guesses': game['guesses']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/submit-guess', methods=['POST'])
def submit_guess():
    """Submit a guess and get the result"""
    try:
        data = request.json
        room_code = data.get('roomCode', '').strip()
        guess = data.get('guess', '').strip()
        
        # Handle both multiplayer room codes and single player game IDs
        if room_code.startswith('SINGLE_'):
            game_key = room_code
        else:
            game_key = room_code.upper()
        
        if not game_key or game_key not in games:
            return jsonify({'error': 'Game not found'}), 404
            
        if not guess or len(guess) != 4 or not guess.isdigit():
            return jsonify({'error': 'Invalid guess'}), 400
            
        # Validate guess has unique digits
        if len(set(guess)) != 4:
            return jsonify({'error': 'Guess must have 4 unique digits'}), 400
        
        game = games[game_key]
        secret_number = game['secretNumber']
        
        # Calculate result
        correct_positions = sum(1 for i in range(4) if guess[i] == secret_number[i])
        correct_numbers = sum(1 for digit in guess if digit in secret_number)
        is_win = correct_positions == 4
        
        # Store the guess
        guess_data = {
            'guess': guess,
            'correctNumbers': correct_numbers,
            'correctPositions': correct_positions,
            'isWin': is_win,
            'timestamp': int(time.time() * 1000)
        }
        
        game['guesses'].append(guess_data)
        
        return jsonify({
            'success': True,
            'result': guess_data,
            'totalGuesses': len(game['guesses']),
            'secretNumber': secret_number if is_win or len(game['guesses']) >= 15 else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/game-status/<room_code>', methods=['GET'])
def get_game_status(room_code):
    """Get current game status"""
    try:
        room_code = room_code.upper()
        
        if room_code not in games:
            return jsonify({'error': 'Room not found'}), 404
            
        game = games[room_code]
        
        return jsonify({
            'success': True,
            'gameActive': game['gameActive'],
            'hostName': game['hostName'],
            'guesserName': game['guesserName'],
            'guesses': game['guesses'],
            'totalGuesses': len(game['guesses'])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leave-game', methods=['POST'])
def leave_game():
    """Leave/delete a game"""
    try:
        data = request.json
        room_code = data.get('roomCode', '').strip().upper()
        
        if room_code in games:
            del games[room_code]
            
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': int(time.time() * 1000),
        'active_games': len(games)
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    print("Starting Guess The Number Game Server...")
    if debug_mode:
        print("Server will be available at: http://localhost:5000")
    else:
        print(f"Server will be available at: http://0.0.0.0:{port}")
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port) 