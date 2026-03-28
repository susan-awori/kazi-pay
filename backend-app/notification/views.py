from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from authApp.models import CustomUser 

# --- 1. TEAMMATE'S VIEWSET (API) ---
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({"status": "read"})

# --- 2. AFRICA'S TALKING WEBHOOKS (USSD/SMS) ---
from .utils import send_kazi_sms # Assuming your SMS logic is here

@csrf_exempt
def ussd_callback(request):
    if request.method == 'POST':
        phone_number = request.POST.get("phoneNumber")
        text = request.POST.get("text", "")
        
        # 1. Quick identification
        user = CustomUser.objects.filter(phone_number=phone_number).first()
        
        input_parts = text.split('*')
        level = 0 if text == "" else len(input_parts)
        response = ""

        # --- NEW USER PATHWAY ---
        if not user:
            if level == 0:
                response = "CON Welcome to KaziPesa\n1. Register as Worker\n2. Register as Client\n3. Info"
            
            elif level == 1:
                choice = input_parts[0]
                if choice in ["1", "2"]:
                    role = "Worker" if choice == "1" else "Client"
                    response = f"CON Registering as {role}\nPlease enter your Full Name:"
                else:
                    response = "END KaziPesa secures payments using M-Pesa. No pay, no work. No work, no pay."
            
            elif level == 2:
                # The user just typed their name
                choice_path = input_parts[0]
                full_name = input_parts[1]
                role = "WORKER" if choice_path == "1" else "CLIENT"
                
                try:
                    # Create the user instantly
                    new_user = CustomUser.objects.create(
                        username=full_name.replace(" ", "_").lower(),
                        phone_number=phone_number,
                        role=role
                    )
                    
                    # SEND SMS CONFIRMATION
                    sms_msg = f"Welcome {full_name} to KaziPesa! You are registered as a {role}. Dial *384*23550# anytime to use our service."
                    send_kazi_sms(phone_number, sms_msg)
                    
                    response = f"END Hongera {full_name}!\nYou are registered. We've sent you a confirmation SMS. Dial again to start."
                except Exception as e:
                    response = "END Sorry, registration failed. Please try again."

        # --- EXISTING USER PATHWAY ---
        else:
            if level == 0:
                if user.role == 'CLIENT':
                    response = f"CON KaziPesa Client: {user.username}\n1. Post a Job (Escrow)\n2. My Active Jobs\n3. Check Balance"
                else:
                    response = f"CON KaziPesa Worker: {user.username}\n1. Browse Jobs\n2. My Tasks\n3. Withdraw"
            
            # Additional levels for Existing Users...
            elif level == 1:
                if user.role == 'CLIENT' and input_parts[0] == "1":
                    response = "CON Describe the job (e.g. Electrician):"
                else:
                    response = "END Coming soon!"
                    
        return HttpResponse(response, content_type='text/plain')
        
@csrf_exempt
def sms_callback(request):
    """
    Handles inbound SMS from Africa's Talking
    """
    if request.method == 'POST':
        return HttpResponse("OK", status=200)
    return HttpResponse("Method not allowed", status=405)