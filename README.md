# App Relatórios TFC

Stack full-stack com **Django + DRF** no backend, **React + TypeScript + Vite** no frontend, e duas bases de dados: **PostgreSQL** (dados da app) e **SQLite** (autenticação).

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Variáveis de ambiente](#2-variáveis-de-ambiente)
3. [Subir o PostgreSQL](#3-subir-o-postgresql-docker)
4. [Backend (Django)](#4-backend-django)
5. [Frontend (React + Vite)](#5-frontend-react--vite)
6. [Login (modo mock)](#6-login-modo-mock)
7. [Troubleshooting](#7-troubleshooting)
8. [Comandos rápidos](#8-comandos-rápidos-tldr)

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| Docker Desktop | qualquer recente |

Confirmar instalações:
```powershell
python --version
node -v
npm -v
docker --version
```

---

## 2. Variáveis de ambiente

O projeto usa **dois** ficheiros `.env` separados.

### `.env` — raiz do projeto (Docker / PostgreSQL)

Criar `./.env` ao lado do `docker-compose.yml`:

```env
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_PORT=5432
```

### `backend/.env` — configuração Django

Criar `./backend/.env`:

```env
DJANGO_SECRET_KEY=troca-por-uma-chave-segura
DEBUG=True

POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

> **Gerar uma secret key:**
> ```powershell
> python -c "import secrets; print(secrets.token_urlsafe(50))"
> ```

---

## 3. Subir o PostgreSQL (Docker)

Na raiz do projeto:

```powershell
docker compose up -d
```

```powershell
docker ps            # verificar container
docker compose down  # parar
```

---

## 4. Backend (Django)

### 4.1 Criar e ativar o ambiente virtual

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> Se o PowerShell bloquear scripts:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

### 4.2 Instalar dependências

```powershell
pip install -r requirements.txt
```

### 4.3 Executar migrações (multi-DB)

O projeto usa dois routers:
- `default` → PostgreSQL
- `auth_db` → SQLite (`backend/auth.sqlite3`)

```powershell
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
```

> ⚠️ Não usar `migrate` sem `--database` — as tabelas ficam no sítio errado.

### 4.4 Criar superutilizador

```powershell
python manage.py createsuperuser --database=auth_db
```

### 4.5 Arrancar o servidor

```powershell
python manage.py runserver 127.0.0.1:8000
```

| URL | Descrição |
|---|---|
| http://127.0.0.1:8000/admin/ | Painel de administração |
| http://127.0.0.1:8000/ | API base |

---

## 5. Frontend (React + Vite)

### 5.1 Instalar dependências

```powershell
cd frontend
npm ci    # usa o package-lock.json — preferível a npm install para setups limpos
```

> O design depende de `tailwindcss`, `@radix-ui/*`, `lucide-react`, `tailwind-merge` e componentes em `src/components/ui/` (padrão shadcn).

### 5.2 Arrancar o servidor de desenvolvimento

```powershell
npm run dev
```

Abrir: http://127.0.0.1:5173/

### 5.3 Build de produção

```powershell
npm run build
npm run preview
```

---

## 6. Login (modo mock)

A autenticação do frontend está em modo **mock** via `frontend/src/context/AuthContext.tsx`.

| Campo | Valor |
|---|---|
| Email | `admin@aresdopinhal.pt` |
| Password | `Admin123!` |

**Fluxo:** `/` → redireciona para `/login` → após login, redireciona para `/dashboard` (guardado em `localStorage`).

---

## 7. Troubleshooting

**Frontend não instala / versões erradas**
```powershell
Remove-Item -Recurse -Force node_modules
npm ci
```

**Postgres — connection refused**
- Confirmar que o Docker está a correr: `docker ps`
- Verificar `POSTGRES_HOST=127.0.0.1` no `backend/.env`
- Confirmar que a porta é consistente nos dois ficheiros `.env`

**`OperationalError: server closed the connection unexpectedly`**

O Postgres ainda não arrancou ou está a reiniciar. Ver logs:
```powershell
docker logs <nome-do-container>
```

**Tabelas em falta (só aparecem migrations)**
```powershell
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
```

---

## 8. Comandos rápidos (tl;dr)

```powershell
# 1. Postgres
docker compose up -d

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
python manage.py runserver 127.0.0.1:8000

# 3. Frontend
cd frontend
npm ci
npm run dev
```
