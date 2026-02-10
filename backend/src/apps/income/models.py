from django.db import models
from src.apps.auth.models import User
class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=100, blank=True, null=True, default='food-apple')

    def __str__(self):
        return self.name

# Create your models here.
class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    group = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    updated = models.DateField(auto_now=True)
    wallet = models.ForeignKey('Wallet', on_delete=models.SET_NULL, null=True, blank=True, related_name='incomes')

    def __str__(self):
        return f"{self.user} - {self.amount} - {self.date}"


class Wallet(models.Model):
    WALLET_TYPES = (
        ('digital', 'Digital Wallet'),
        ('bank', 'Bank Account'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallets')
    name = models.CharField(max_length=100)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    type = models.CharField(max_length=20, choices=WALLET_TYPES, default='other')
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Icon name or simple text icon like 'e'")
    color = models.CharField(max_length=20, default='#27272A', help_text="Hex color code")
    identifier = models.CharField(max_length=50, blank=True, null=True, help_text="Account number or ID")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"