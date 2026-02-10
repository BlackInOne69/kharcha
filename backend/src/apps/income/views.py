from django.shortcuts import render
from .models import Income, Category, Wallet
from .serializers import IncomeSerializer, IncomeCategorySerializer, WalletSerializer
from rest_framework.generics import GenericAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .filters import IncomeFilter
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class IncomeListCreateView(ListCreateAPIView):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    filterset_class = IncomeFilter
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class IncomeRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class CategoryListCreateView(ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = IncomeCategorySerializer
    permission_classes = [IsAuthenticated]

class WalletListCreateView(ListCreateAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)

class WalletRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    serializer_class = WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)