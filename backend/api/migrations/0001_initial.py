from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='OTPChallenge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('verification_token', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('email', models.EmailField(db_index=True, max_length=254)),
                ('purpose', models.CharField(choices=[('register', 'Register'), ('login', 'Login')], max_length=20)),
                ('code_hash', models.CharField(max_length=128)),
                ('first_name', models.CharField(blank=True, default='', max_length=150)),
                ('last_name', models.CharField(blank=True, default='', max_length=150)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('expires_at', models.DateTimeField()),
                ('consumed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='otpchallenge',
            index=models.Index(fields=['verification_token'], name='otp_verif_idx'),
        ),
        migrations.AddIndex(
            model_name='otpchallenge',
            index=models.Index(fields=['email', 'purpose'], name='otp_email_pur_idx'),
        ),
        migrations.AddIndex(
            model_name='otpchallenge',
            index=models.Index(fields=['expires_at'], name='otp_exp_idx'),
        ),
    ]

