# Generated migration for simplified voucher system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rewards', '0001_initial'),  # Replace with your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='rewardvoucher',
            name='usage_policy',
            field=models.CharField(
                default='fixed',
                editable=False,
                help_text='Voucher usage policy - always fixed-value',
                max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='rewardvoucher',
            name='used_amount',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Amount marked as used (always full value for simplified system)',
                max_digits=10
            ),
        ),
    ]