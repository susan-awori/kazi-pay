from rest_framework import serializers
from .models import Job
from workers.models import Bid


class BidSummarySerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.username')

    class Meta:
        model = Bid
        fields = ['id', 'worker', 'worker_name', 'amount', 'proposal', 'is_accepted', 'created_at']
        read_only_fields = ['id', 'worker', 'worker_name', 'is_accepted', 'created_at']


class JobSerializer(serializers.ModelSerializer):
    client = serializers.ReadOnlyField(source='client.username')
    assigned_worker_name = serializers.ReadOnlyField(source='assigned_worker.user.username')
    bid_count = serializers.SerializerMethodField()
    bids = BidSummarySerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'client', 'title', 'description', 'price',
            'status', 'assigned_worker', 'assigned_worker_name', 'bids', 'bid_count'
        ]
        read_only_fields = ['client', 'status', 'assigned_worker']

    def get_bid_count(self, obj):
        return obj.bids.count()

class AcceptBidSerializer(serializers.Serializer):
    bid_id = serializers.IntegerField()