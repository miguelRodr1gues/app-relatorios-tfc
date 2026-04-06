# App Relatórios TFC

Projeto full‑stack com:
- **Backend**: Django + Django REST Framework
- **Frontend**: React + TypeScript + Vite
- **Base de dados**:
  - **PostgreSQL** (dados da app / recursos do dashboard)
  - **SQLite** (autenticação: `auth_db`)

> Data do guia: 2026‑04‑06

---

## 1) Pré‑requisitos

### Windows
Instalar:
- **Python 3.11+** (recomendado)
- **Node.js 18+** (ou 20+)
- **Docker Desktop** (recomendado para Postgres via `docker-compose`)

Confirmar versões:
```powershell
python --version
node -v
npm -v
docker --version
```

---

## 2) Dependências (como garantir que tens tudo)

### 2.1) Frontend (Node)
Este projeto usa **npm** e inclui **lockfile**: `frontend/package-lock.json`.

Para instalares *exatamente* as mesmas versões que funcionam no projeto (incluindo libs de design/UI como Tailwind, Radix, etc.), usa:
```powershell
cd frontend
npm ci
```

- `npm install` também funciona, mas `npm ci` é o recomendado para setups limpos/CI porque respeita 100% o `package-lock.json`.

> Regra de ouro: **commitar sempre o `package-lock.json`** quando adicionas/atualizas dependências.

#### Adicionar dependências novas
```powershell
cd frontend
npm install nome-do-pacote
```

#### Adicionar dependências de desenvolvimento
```powershell
cd frontend
npm install -D nome-do-pacote
```


### 2.2) Backend (Python)
As dependências Python estão fixas em `backend/requirements.txt`.

Para instalar:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> Regra de ouro: sempre que adicionares um pacote Python novo, atualiza o `requirements.txt`.


### 2.3) Dependências de design (Tailwind / UI)
O design do frontend depende principalmente de:
- `tailwindcss` + `postcss` + `autoprefixer`
- componentes UI em `frontend/src/components/ui/*` (muitos seguem o padrão shadcn)
- libs como `@radix-ui/*`, `lucide-react`, `tailwind-merge`, etc.

O mesmo `npm ci` instala tudo. Não há passos extra *desde que* corras o frontend via Vite (`npm run dev`) ou faças build (`npm run build`).

---

## 3) Variáveis de ambiente (obrigatório)

Este repo usa **dois** ficheiros `.env`:

### 3.1) `.env` na raiz (para o `docker-compose.yml` do Postgres)
Criar `./.env` (na raiz do projeto, ao lado do `docker-compose.yml`):
```env
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_PORT=5432
```

> O `docker-compose.yml` lê este `.env` e expõe a porta para o host.

### 3.2) `backend/.env` (para Django)
Criar `backend/.env`:
```env
DJANGO_SECRET_KEY=troca-por-uma-chave-segura
DEBUG=True

# Postgres (DB principal da app)
POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

Gerar uma secret key (opcional):
```powershell
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## 4) Subir o PostgreSQL (Docker)

Na raiz do projeto:
```powershell
docker compose up -d
```

Verificar container:
```powershell
docker ps
```

Para parar:
```powershell
docker compose down
```

---

## 5) Backend (Django)

### 5.1) Criar e ativar venv
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Se o PowerShell bloquear scripts:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 5.2) Instalar dependências
```powershell
pip install -r requirements.txt
```

### 5.3) Migrar as bases de dados (multi‑DB)
O `core/settings.py` define:
- `default`  -> Postgres
- `auth_db`  -> SQLite (`backend/auth.sqlite3`)

Executar migrações:
```powershell
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
```

> Importante: se só fizeres `migrate` sem `--database`, podes acabar com tabelas no sítio errado.

### 5.4) Criar superuser (na auth_db)
```powershell
python manage.py createsuperuser --database=auth_db
```

### 5.5) Correr o backend
```powershell
python manage.py runserver 127.0.0.1:8000
```

URLs úteis:
- Admin: http://127.0.0.1:8000/admin/
- API base: http://127.0.0.1:8000/

---

## 6) Frontend (Vite + React)

### 6.1) Instalar dependências
```powershell
cd frontend
npm ci
```

### 6.2) Correr o frontend
```powershell
npm run dev
```

Abrir:
- http://127.0.0.1:5173/

### 6.3) Build
```powershell
npm run build
npm run preview
```

---

## 7) Login (mock) no frontend

Atualmente a autenticação do frontend está em modo **mock** via `frontend/src/context/AuthContext.tsx`.

Credenciais de teste:
- **Email**: `admin@aresdopinh al.pt` (o código remove o espaço automaticamente)
- **Password**: `Admin123!`

Fluxo esperado:
- Ao entrar em `/` -> vai para `/login`
- Se existir `user` no `localStorage` -> redireciona para `/dashboard`

---

## 8) Troubleshooting

### 8.1) Instalação do frontend falha / versões diferentes
Apaga `node_modules` e instala com `npm ci`:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm ci
```

### 8.2) Erro Postgres (connection refused)
- Confirma que o Docker está a correr: `docker ps`
- Confirma a porta no `.env` da raiz e `backend/.env`
- Confirma que `POSTGRES_HOST=127.0.0.1`

### 8.3) `django.db.utils.OperationalError: server closed the connection unexpectedly`
Geralmente significa que o Postgres não arrancou bem ou está a reiniciar.
- Ver logs: `docker logs bdtfc`

### 8.4) Falta de tabelas (apenas migrations aparecem)
Confirma que migraste **nos dois** DBs:
```powershell
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
```

---

## 9) Comandos rápidos (tl;dr)

### Subir Postgres
```powershell
docker compose up -d
```

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate --database=auth_db
python manage.py migrate --database=default
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```powershell
cd frontend
npm ci
npm run dev
```
