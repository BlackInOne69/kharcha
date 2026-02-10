from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone  # ✅ correct import



User = get_user_model()

class Group(models.Model):
    name = models.CharField(max_length=255)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='group_members')

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Expense(models.Model):
    SOURCE_TYPE_CHOICES = (
        ('manual', 'Manual'),
        ('receipt', 'Receipt'),
        ('screenshot', 'Screenshot'),
    )

    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti'),
        ('bank', 'Bank'),
        ('card', 'Card'),
        ('other', 'Other'),
    )

    SPLIT_TYPE_CHOICES = (
        ('equal', 'Equal'),
        ('manual', 'Manual'),
        ('itemized', 'Itemized'),
    )

    id = models.AutoField(primary_key=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, default='')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses_created')
    date = models.DateField()
    updated = models.DateField(auto_now=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    image = models.ImageField(upload_to='expenses/', null=True, blank=True)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES, default='manual')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    merchant = models.CharField(max_length=255, blank=True, default='')
    expense_date = models.DateField(null=True, blank=True)
    note = models.TextField(blank=True, default='')

    # Optional OCR/AI logging fields for diagnostics.
    ocr_text = models.TextField(blank=True, default='')
    ai_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    engine_used = models.CharField(max_length=100, blank=True, default='')
    ai_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ai_date = models.DateField(null=True, blank=True)
    ai_merchant = models.CharField(max_length=255, blank=True, default='')

    # Group expense functionality
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses_paid')
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPE_CHOICES, default='equal')
    is_settled = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if self.expense_date and not self.date:
            self.date = self.expense_date
        if self.date and not self.expense_date:
            self.expense_date = self.date

        if self.pk:
            old = Expense.objects.filter(pk=self.pk).first()
            if old and old.image and old.image != self.image:
                old.image.delete(save=False)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.description}: {self.amount} on {self.date}"


class ExpenseShare(models.Model):
    """
    Represents how much a user owes for an expense.
    Works for both manual and itemized splits.
    """
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_shares')
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2)

    # For itemized splits
    item_name = models.CharField(max_length=255, null=True, blank=True)

    is_settled = models.BooleanField(default=False)

    class Meta:
        unique_together = ('expense', 'user', 'item_name')  # allows multiple items per user

    def __str__(self):
        if self.item_name:
            return f"{self.user.username} owes ${self.amount_owed} for {self.item_name} ({self.expense.description})"
        return f"{self.user.username} owes ${self.amount_owed} for {self.expense.description}"


class Settlement(models.Model):
    expense_share = models.ForeignKey(ExpenseShare, on_delete=models.SET_NULL, null=True, related_name='settlements')
    settled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settlements_made')
    amount_settled = models.DecimalField(max_digits=10, decimal_places=2)
    date_settled = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Settlement of ${self.amount_settled} by {self.settled_by.username}"
