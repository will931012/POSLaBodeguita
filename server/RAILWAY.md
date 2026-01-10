# 🚂 Guía Rápida: Deploy en Railway

## ⚡ Setup en 5 minutos

### 1️⃣ Preparar el código

```bash
# En tu máquina local
cd backend-postgres
cp .env.example .env
# Edita .env con tus configuraciones locales (opcional para testing)
```

### 2️⃣ Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit - POS Backend"
git branch -M main
git remote add origin https://github.com/tu-usuario/pos-backend.git
git push -u origin main
```

### 3️⃣ Deploy en Railway

1. **Ir a** [railway.app](https://railway.app)
2. **Login** con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecciona** tu repositorio `pos-backend`
5. **Add Service** → **Database** → **PostgreSQL**

### 4️⃣ Configurar Variables

En el servicio de tu backend, ve a **Variables** y agrega:

```env
NODE_ENV=production
JWT_SECRET=genera-un-secreto-super-fuerte-aqui
FRONTEND_URL=https://tu-frontend.vercel.app
ENABLE_EMAIL=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
```

**Si quieres emails de cierre de caja, agrega:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-gmail
MAIL_FROM=tu-email@gmail.com
ADMIN_EMAIL=donde-recibes-cierres@gmail.com
```

### 5️⃣ Obtener la URL

Railway te dará una URL como:
```
https://pos-backend-production-xxxx.up.railway.app
```

**Cópiala** y úsala en tu frontend como `VITE_API_URL`

---

## 🔧 Configuración del Frontend

En tu proyecto frontend, crea/edita `.env`:

```env
VITE_API_URL=https://pos-backend-production-xxxx.up.railway.app
```

O si usas Vercel, agrégala en:
**Settings → Environment Variables**

---

## ✅ Verificar que funciona

```bash
curl https://tu-backend.railway.app/api/health
```

Deberías ver:
```json
{
  "ok": true,
  "timestamp": "...",
  "environment": "production",
  "database": "postgresql"
}
```

---

## 🗄️ Migrar datos desde SQLite

Si ya tienes datos en SQLite:

### Opción A: Localmente (recomendado)

1. **Configura acceso** a Railway PostgreSQL:
   ```bash
   # En Railway, ve a PostgreSQL → Variables
   # Copia el DATABASE_URL
   
   # En tu .env local:
   DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
   ```

2. **Coloca tu** `pos.db` en la carpeta backend

3. **Ejecuta migración:**
   ```bash
   npm run migrate
   ```

### Opción B: Manualmente

1. **Exporta datos** de SQLite a CSV
2. **Importa** usando la función de importación del POS

---

## 📊 Monitoreo

### Ver logs en tiempo real

En Railway dashboard:
1. Tu servicio
2. Tab **"Deployments"**
3. Click en el deployment activo
4. Ver **logs** en tiempo real

### Comandos útiles

```bash
# Ver variables
railway variables

# Ver logs
railway logs

# Abrir dashboard
railway open
```

---

## 🔄 Actualizar el Backend

Cada vez que hagas cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Railway **desplegará automáticamente** los cambios.

---

## 💰 Costos

Railway ofrece:
- ✅ **$5 USD/mes** de crédito gratis
- ✅ PostgreSQL pequeña incluida
- ✅ Suficiente para empezar

Para un POS pequeño-mediano, esto es **suficiente**.

Si creces, puedes:
- Upgrade a plan Pro ($20/mes)
- O migrar a un VPS

---

## 🆘 Troubleshooting Rápido

### "Build failed"
- Verifica que `package.json` tenga `"start": "node index.js"`
- Asegúrate de tener Node 18+ en engines

### "Database connection failed"
- PostgreSQL debe estar en el mismo proyecto
- Railway conecta automáticamente con `DATABASE_URL`

### "CORS error"
- Verifica que `FRONTEND_URL` esté correctamente configurada
- Debe ser la URL exacta de tu frontend (sin trailing slash)

### El backend funciona pero el frontend no se conecta
- Verifica `VITE_API_URL` en el frontend
- Debe apuntar a tu Railway URL
- Reconstruye el frontend después de cambiar variables

---

## 🎉 ¡Listo!

Tu backend está en producción y listo para usar.

**URL del Backend:** `https://tu-proyecto.railway.app`
**Endpoints:** `/api/products`, `/api/sales`, etc.

---

### Próximos pasos opcionales:

1. ✅ Configurar dominio personalizado en Railway
2. ✅ Habilitar backups automáticos
3. ✅ Agregar autenticación JWT
4. ✅ Configurar monitoring (Sentry, LogRocket)

**¿Preguntas?** Revisa el README.md completo para más detalles.
