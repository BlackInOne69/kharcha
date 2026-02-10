from django.urls import path    
from .views import IncomeListCreateView, IncomeRetrieveUpdateDestroyView, CategoryListCreateView, WalletListCreateView, WalletRetrieveUpdateDestroyView

urlpatterns = [
    path("", IncomeListCreateView.as_view(), name="income-list-create"),
    path("<int:pk>/", IncomeRetrieveUpdateDestroyView.as_view(), name="income-retrieve-update-destroy"),
    path("categories/", CategoryListCreateView.as_view(), name="income-category-list-create"),
    path("wallets/", WalletListCreateView.as_view(), name="wallet-list-create"),
    path("wallets/<int:pk>/", WalletRetrieveUpdateDestroyView.as_view(), name="wallet-retrieve-update-destroy"),
]