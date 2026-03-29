from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from .models import WorkerProfile, Bid
from .serializers import WorkerProfileSerializer, BidSerializer
from clients.models import Job
from clients.serializers import JobSerializer
from rest_framework.decorators import action
from .services import WorkerService


class WorkerViewSet(viewsets.ModelViewSet):
    serializer_class = WorkerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkerProfile.objects.filter(user=self.request.user)


class JobDiscoveryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = JobSerializer
    queryset = Job.objects.filter(status='open')


class BidViewSet(viewsets.ModelViewSet):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bid.objects.filter(worker=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            bid = WorkerService.place_bid(
                worker=request.user,
                job_id=request.data.get('job'),
                amount=request.data.get('amount'),
                proposal=request.data.get('proposal'),
            )
            serializer = self.get_serializer(bid)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            raise DRFValidationError(e.message if hasattr(e, 'message') else str(e))

    @action(detail=True, methods=['post'], url_path='mark-complete')
    def mark_complete(self, request, pk=None):
        bid = self.get_object()
        try:
            WorkerService.complete_job(request.user, bid.job)
            return Response({"message": "Job marked as complete. Waiting for client approval."})
        except ValidationError as e:
            return Response({"error": str(e)}, status=400)