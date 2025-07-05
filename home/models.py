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
