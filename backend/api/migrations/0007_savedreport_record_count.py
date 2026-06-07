from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_remove_savedreport_file_exports"),
    ]

    operations = [
        migrations.AddField(
            model_name="savedreport",
            name="record_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]
