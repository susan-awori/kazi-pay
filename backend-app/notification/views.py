from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer
from authApp.models import CustomUser 
from .utils import send_kazi_sms # Assuming your SMS logic is here

from clients.models import Job
from escrow.models import Escrow
from escrow.mpesa import MpesaC2B  # For STK Push
from wallet.mpesa import MpesaB2C   # For Payouts


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
@csrf_exempt
def ussd_callback(request):
    if request.method == 'POST':
        # Clean up the phone number
        raw_phone = request.POST.get("phoneNumber", "")
        phone_number = raw_phone.replace("+", "") 
        
        # Get and clean USSD text
        text = request.POST.get("text", "")
        input_parts = [part.strip() for part in text.split('*')] if text else []
        level = len(input_parts)
        
        # Identity Check
        user = CustomUser.objects.filter(phone_number__icontains=phone_number[-9:]).first()
        response = ""

        # --- PATHWAY: UNREGISTERED USER ---
        if not user:
            if level == 0:
                response = "CON Welcome to KaziPesa\n1. Register as Worker\n2. Register as Client\n3. Info"
            elif level == 1:
                choice = input_parts[0]
                if choice in ["1", "2"]:
                    role = "Worker" if choice == "1" else "Client"
                    response = f"CON Registering as {role}\nPlease enter your Full Name:"
                else:
                    response = "END KaziPesa: We secure payments via M-Pesa Escrow. Dial again to join."
            elif level == 2:
                choice_path = input_parts[0]
                full_name = input_parts[1]
                role = "WORKER" if choice_path == "1" else "CLIENT"
                try:
                    CustomUser.objects.create(
                        username=full_name.replace(" ", "_").lower(),
                        phone_number=phone_number,
                        role=role
                    )
                    response = f"END Hongera {full_name}!\nRegistered as {role}. Dial again to start."
                except Exception:
                    response = "END Registration failed. Please try a different name."

        # --- PATHWAY: EXISTING USER ---
        else:
            # --- CLIENT FLOW (The one we worked on) ---
            if user.role == 'CLIENT':
                if level == 0:
                    response = f"CON KaziPesa Client: {user.username}\n1. Post a Job (Escrow)\n2. My Active Jobs\n3. Check Balance"
                
                elif level == 1:
                    if input_parts[0] == "1":
                        response = "CON Enter Job Title (e.g. Plumber):"
                    else:
                        response = "END Active Jobs feature coming soon!"

                elif level == 2:
                    job_title = input_parts[1]
                    response = f"CON Enter Amount for {job_title}:"

                elif level == 3:
                    job_title = input_parts[1]
                    amount = input_parts[2]
                    response = f"CON Post {job_title} for KES {amount}?\n1. Confirm & Pay\n2. Cancel"

                elif level == 4:
                    if input_parts[3] == "1":
                        job_title = input_parts[1]
                        amount_val = input_parts[2]
                        try:
                            amount = float(amount_val)
                            # Job Creation
                            job = Job.objects.create(
                                client=user, 
                                title=job_title,
                                description=f"USSD Job: {job_title}",
                                price=amount
                            )
                            # Note: Escrow creation here will fail if 'worker' is required (NOT NULL)
                            # If you haven't changed the model to null=True for worker, 
                            # you must use the Worker Flow below or skip escrow until a worker joins.
                            response = f"END Request sent! Enter PIN on your phone to secure KES {amount}."
                            mpesa = MpesaC2B()
                            mpesa.stk_push(phone_number, int(amount), f"JobID_{job.id}")
                        except Exception as e:
                            response = f"END Error: {str(e)}"
                    else:
                        response = "END Job cancelled."

            # --- WORKER FLOW (The new updated version) ---
            elif user.role == 'WORKER':
                if level == 0:
                    response = f"CON KaziPesa Worker: {user.username}\n1. Request Payment (Invoice)\n2. My Tasks\n3. Withdraw"
                
                elif level == 1:
                    if input_parts[0] == "1":
                        response = "CON Enter Client Phone (07XXXXXXXX):"
                    elif input_parts[0] == "3":
                        response = "END Withdrawal request received. Processing shortly."
                    else:
                        response = "END Tasks feature coming soon!"

                elif level == 2:
                    response = "CON Enter Job Title (e.g. Cleaning):"

                elif level == 3:
                    job_title = input_parts[2]
                    response = f"CON Enter Amount for {job_title}:"

                elif level == 4:
                    client_phone = input_parts[1]
                    job_title = input_parts[2]
                    amount = input_parts[3]
                    response = f"CON Request KES {amount} from {client_phone}?\n1. Confirm & Send\n2. Cancel"

                elif level == 5:
                    if input_parts[4] == "1":
                        client_phone = input_parts[1]
                        job_title = input_parts[2]
                        amount_val = input_parts[3]
                        try:
                            # Verify if the client exists in the system
                            target_client = CustomUser.objects.filter(phone_number__icontains=client_phone[-9:]).first()
                            if not target_client:
                                response = "END Error: This client is not registered on KaziPesa."
                            else:
                                amount = float(amount_val)
                                # 1. Create Job
                                job = Job.objects.create(
                                    client=target_client,
                                    title=job_title,
                                    price=amount
                                )
                                # 2. Create Escrow (Succeeds because both worker and client exist!)
                                p_fee = amount * 0.05
                                Escrow.objects.create(
                                    job=job,
                                    client=target_client,
                                    worker=user, # The worker dialing
                                    total_amount=amount,
                                    platform_fee=p_fee,
                                    worker_payout=amount - p_fee,
                                    status='pending'
                                )
                                # 3. STK Push to the CLIENT
                                mpesa = MpesaC2B()
                                mpesa.stk_push(client_phone, int(amount), f"JobID_{job.id}")
                                response = f"END Invoice sent! Client {client_phone} has been prompted to pay."
                        except Exception as e:
                            response = f"END Error: {str(e)}"
                    else:
                        response = "END Cancelled."

        return HttpResponse(response, content_type='text/plain')
                              
@csrf_exempt
def sms_callback(request):
    """
    Handles inbound SMS from Africa's Talking
    """
    if request.method == 'POST':
        return HttpResponse("OK", status=200)
    return HttpResponse("Method not allowed", status=405)