from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_savedreport_is_public"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="savedreport",
            name="file_json",
        ),
        migrations.RemoveField(
            model_name="savedreport",
            name="file_csv",
        ),
        migrations.RemoveField(
            model_name="savedreport",
            name="file_pdf",
        ),
    ]
