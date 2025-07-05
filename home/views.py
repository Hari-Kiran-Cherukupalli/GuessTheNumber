from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from .models import Room, Guess
from django.utils.crypto import get_random_string


def home(request):
    return render(request, 'home/index.html')


def create_room(request):
    if request.method == 'POST':
        player1_name = request.POST.get('name')
        room = Room.objects.create(player1_name=player1_name)
        return redirect('game', room_code=room.room_code)
    return JsonResponse({'error': 'Invalid request'}, status=400)


def join_room(request):
    if request.method == 'POST':
        room_code = request.POST.get('room_code')
        player2_name = request.POST.get('name')
        try:
            room = Room.objects.get(room_code=room_code)
            if room.player2_name:
                return JsonResponse({'error': 'Room already full'}, status=403)
            room.player2_name = player2_name
            room.save()
            return redirect('game', room_code=room.room_code)
        except Room.DoesNotExist:
            return JsonResponse({'error': 'Room not found'}, status=404)
    return JsonResponse({'error': 'Invalid request'}, status=400)


def game_view(request, room_code):
    room = get_object_or_404(Room, room_code=room_code)
    guesses = Guess.objects.filter(room=room).order_by('created_at')
    return render(request, 'home/game.html', {
        'room': room,
        'guesses': guesses,
        'player_name': request.GET.get('name', ''),
    })


def submit_guess(request):
    if request.method == 'POST':
        room_code = request.POST.get('room_code')
        player_name = request.POST.get('player_name')
        guess_number = request.POST.get('guess_number')

        room = get_object_or_404(Room, room_code=room_code)

        # Determine player number
        if player_name == room.player1_name:
            player_number = 1
        elif player_name == room.player2_name:
            player_number = 2
        else:
            return JsonResponse({'error': 'Invalid player'}, status=403)

        # Enforce turn
        if room.current_turn != player_number:
            return JsonResponse({'error': 'Not your turn'}, status=403)

        # Secret number set only by player 1
        if not room.secret_number and player_number == 1:
            room.secret_number = guess_number
            room.current_turn = 2
            room.save()
            return redirect('game', room_code=room_code)

        # Check guess
        secret = room.secret_number
        matched_digits = sum(1 for digit in guess_number if digit in secret)
        correct_positions = sum(1 for i in range(4) if guess_number[i] == secret[i])

        attempt_number = Guess.objects.filter(room=room, player_number=player_number).count() + 1

        guess = Guess.objects.create(
            room=room,
            player_number=player_number,
            guess_number=guess_number,
            matched_digits=matched_digits,
            correct_positions=correct_positions,
            attempt_number=attempt_number
        )

        if correct_positions == 4:
            room.is_active = False
            room.save()
            return JsonResponse({'message': 'You win!'}, status=200)

        if attempt_number >= 15:
            room.is_active = False
            room.save()
            return JsonResponse({'message': 'Out of tries. You lose!'}, status=200)

        # Switch turn
        room.current_turn = 1 if player_number == 2 else 2
        room.save()
        return redirect('game', room_code=room_code)

    return JsonResponse({'error': 'Invalid method'}, status=405)
