from django.contrib import admin
from django.urls import path
from api.views import teste_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/teste/', teste_api),
]