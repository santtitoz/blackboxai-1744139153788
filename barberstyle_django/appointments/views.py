from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, user_passes_test
from .models import Appointment
import json
from django.contrib.auth.models import User

def is_admin(user):
    return user.is_staff

@login_required
def appointment_list(request):
    if request.user.is_staff:
        appointments = Appointment.objects.all()
    else:
        appointments = Appointment.objects.filter(user=request.user)
    data = list(appointments.values())
    return JsonResponse(data, safe=False)

@csrf_exempt
@login_required
def appointment_create(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        appointment = Appointment.objects.create(
            user=request.user,
            name=data.get('name'),
            service=data.get('service'),
            date=data.get('date'),
            time=data.get('time'),
            status='pending'
        )
        return JsonResponse({'id': appointment.id, 'message': 'Appointment created'}, status=201)
    return JsonResponse({'error': 'Invalid method'}, status=405)

@csrf_exempt
@login_required
@user_passes_test(is_admin)
def appointment_update(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    if request.method == 'PUT':
        data = json.loads(request.body)
        appointment.status = data.get('status', appointment.status)
        appointment.service = data.get('service', appointment.service)
        appointment.date = data.get('date', appointment.date)
        appointment.time = data.get('time', appointment.time)
        appointment.name = data.get('name', appointment.name)
        appointment.save()
        return JsonResponse({'message': 'Appointment updated'})
    return JsonResponse({'error': 'Invalid method'}, status=405)

@csrf_exempt
@login_required
@user_passes_test(is_admin)
def appointment_delete(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    if request.method == 'DELETE':
        appointment.delete()
        return JsonResponse({'message': 'Appointment deleted'})
    return JsonResponse({'error': 'Invalid method'}, status=405)
