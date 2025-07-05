from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create-room/', views.create_room, name='create_room'),
    path('join-room/', views.join_room, name='join_room'),
    path('game/<str:room_code>/', views.game_view, name='game'),
    path('submit-guess/', views.submit_guess, name='submit_guess'),
]
