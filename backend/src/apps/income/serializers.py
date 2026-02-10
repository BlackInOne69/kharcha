from .models import Income, Category, Wallet
from rest_framework import serializers

class IncomeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon']

class WalletSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Wallet
        fields = ['id', 'user', 'name', 'balance', 'type', 'icon', 'color', 'identifier', 'created_at']
        read_only_fields = ['created_at']

class IncomeSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault()) 
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    wallet_id = serializers.PrimaryKeyRelatedField(
        queryset=Wallet.objects.all(), source="wallet", write_only=True, required=False, allow_null=True
    )
    # Read-only nested fields for display
    category = IncomeCategorySerializer(read_only=True)
    wallet = WalletSerializer(read_only=True)

    class Meta:
        model = Income
        fields = ['id', 'user', 'amount', 'description', 'category_id', 'wallet_id', 'category', 'wallet', 'group', 'date', 'updated']

    def create(self, validated_data):
        user = self.context['request'].user
        
        # Extract wallet if present
        wallet = validated_data.get('wallet')
        amount = validated_data.get('amount')
        
        income = Income.objects.create(**validated_data)
        
        # If wallet is linked, update its balance
        if wallet and amount:
            wallet.balance += amount
            wallet.save(update_fields=['balance'])
            
        return income


