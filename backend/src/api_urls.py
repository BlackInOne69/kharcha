from django.urls import path

from src.apps.auth.views import UserLoginView, UserRegisterView
from src.apps.expense.views import (
    CategoryListCreateView,
    ExpenseListCreateView,
    ExpenseRetrieveUpdateDestroyView,
    MonthlyAnalyticsView,
)

urlpatterns = [
    path("register", UserRegisterView.as_view(), name="api-register"),
    path("login", UserLoginView.as_view(), name="api-login"),
    path("categories", CategoryListCreateView.as_view(), name="api-categories"),
    path("expenses", ExpenseListCreateView.as_view(), name="api-expenses"),
    path("expenses/<int:pk>", ExpenseRetrieveUpdateDestroyView.as_view(), name="api-expense-detail"),
    path("analytics/monthly", MonthlyAnalyticsView.as_view(), name="api-monthly-analytics"),
]
