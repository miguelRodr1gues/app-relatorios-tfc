# backend/core/dbrouters.py
class AuthRouter:
    """
    Envia models de autenticação/admin/sessões/allauth para SQLite (auth_db).
    O resto fica em Postgres (default).
    """

    auth_apps = {
        "auth",
        "admin",
        "contenttypes",
        "sessions",
        "sites",
        "account",
        "socialaccount",
        "authtoken",
    }

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.auth_apps:
            return "auth_db"
        return "default"

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.auth_apps:
            return "auth_db"
        return "default"

    def allow_relation(self, obj1, obj2, **hints):
        # Relações cross\-db não são suportadas; permite só dentro do mesmo DB
        db1 = self.db_for_read(obj1.__class__)
        db2 = self.db_for_read(obj2.__class__)
        if db1 and db2 and db1 == db2:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.auth_apps:
            return db == "auth_db"
        return db == "default"