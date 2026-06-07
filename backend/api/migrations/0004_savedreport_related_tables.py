from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_savedreport"),
    ]

    operations = [
        migrations.AddField(
            model_name="savedreport",
            name="related_tables",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
