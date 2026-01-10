# 🚂 POS Backend - Railway + PostgreSQL

Backend listo para deploy en Railway con PostgreSQL.

## 🚀 Deploy Rápido en Railway

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "POS Backend PostgreSQL"
git remote add origin https://github.com/TU-USUARIO/pos-backend.git
git push -u origin main
```

### 2. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Login con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecciona tu repo `pos-backend`

### 3. Agregar PostgreSQL

1. En tu proyecto, click **"+ New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway conecta automáticamente via `DATABASE_URL`

### 4. Configurar Variables

En tu servicio backend → **Variables**, agrega:

```env
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app
ENABLE_LOGGING=true
ENABLE_RATE_LIMITING=true
```

**Opcional (para emails):**
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
MAIL_FROM=tu-email@gmail.com
ADMIN_EMAIL=admin@example.com
```

### 5. Generar Dominio

1. Settings → Networking → **Generate Domain**
2. Obtendrás: `https://tu-proyecto.up.railway.app`

### 6. Verificar

```bash
curl https://tu-proyecto.up.railway.app/api/health
```

Deberías ver:
```json
{"ok":true,"timestamp":"...","environment":"production","database":"postgresql"}
```

## ✅ ¡Listo!

Tu backend está en producción con:
- ✅ PostgreSQL en la nube
- ✅ Auto-deploy desde GitHub
- ✅ HTTPS automático
- ✅ Logs en tiempo real

## 📡 Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta
- `GET /api/receipts` - Listar recibos
- `POST /api/import/products` - Importar CSV/Excel
- `GET /report/close` - Datos de cierre
- `POST /report/close` - Cerrar caja

## 🔗 Conectar Frontend

En tu frontend `.env`:
```env
VITE_API_URL=https://tu-proyecto.up.railway.app
```

## 💰 Costos

Railway: **$5 USD gratis/mes** (suficiente para empezar)

## 📊 Monitoreo

Railway Dashboard → Deployments → Ver logs en tiempo real

---

**¿Problemas?** Verifica que PostgreSQL esté en el mismo proyecto y que `FRONTEND_URL` esté configurada.
