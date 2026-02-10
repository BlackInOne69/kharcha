# Generated manually for receipt/screenshot support.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("expense", "0005_alter_expense_date"),
    ]

    operations = [
        migrations.AddField(
            model_name="expense",
            name="ai_amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="ai_confidence",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="ai_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="ai_merchant",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="expense",
            name="engine_used",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="expense",
            name="expense_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="image",
            field=models.ImageField(blank=True, null=True, upload_to="expenses/"),
        ),
        migrations.AddField(
            model_name="expense",
            name="merchant",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="expense",
            name="note",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="expense",
            name="ocr_text",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="expense",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("cash", "Cash"),
                    ("esewa", "eSewa"),
                    ("khalti", "Khalti"),
                    ("bank", "Bank"),
                    ("card", "Card"),
                    ("other", "Other"),
                ],
                default="cash",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="expense",
            name="source_type",
            field=models.CharField(
                choices=[("manual", "Manual"), ("receipt", "Receipt"), ("screenshot", "Screenshot")],
                default="manual",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="expense",
            name="category",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="expense.category"),
        ),
        migrations.AlterField(
            model_name="expense",
            name="description",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
