from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_savedreport_related_tables"),
    ]

    operations = [
        migrations.AddField(
            model_name="savedreport",
            name="is_public",
            field=models.BooleanField(default=False),
        ),
    ]
