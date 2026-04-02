from django.urls import path
from .views import EntityListAPIView

urlpatterns = [
    path("entities/", EntityListAPIView.as_view(), name="entities-list"),
]