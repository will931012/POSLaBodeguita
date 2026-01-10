# 🚀 POS Backend - PostgreSQL + Railway

Backend para el sistema POS Compassion & Love con PostgreSQL, optimizado para deploy en Railway.

---

## 🎯 Stack Tecnológico

- **Node.js** 18+
- **Express** 4.x
- **PostgreSQL** 15+
- **Seguridad:** Helmet, CORS, Rate Limiting
- **Email:** Nodemailer
- **Importación:** XLSX, Multer

---

## 📦 Instalación Local

### 1. Clonar e instalar dependencias

```bash
cd backend-postgres
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y configura:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_development
JWT_SECRET=tu-secreto-jwt-super-seguro
FRONTEND_URL=http://localhost:3000
```

### 3. Iniciar PostgreSQL local

**Con Docker:**
```bash
docker run --name pos-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pos_development -p 5432:5432 -d postgres:15
```

**O instala PostgreSQL nativo** desde [postgresql.org](https://www.postgresql.org/download/)

### 4. Iniciar servidor

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:4000`

---

## 🗄️ Migración desde SQLite

Si tienes datos en SQLite y quieres migrarlos a PostgreSQL:

### 1. Coloca tu archivo `pos.db` en la raíz del proyecto

### 2. Asegúrate de tener PostgreSQL corriendo y configurado en `.env`

### 3. Ejecuta el script de migración

```bash
npm run migrate
```

El script:
- ✅ Lee todos los datos de SQLite
- ✅ Los inserta en PostgreSQL
- ✅ Actualiza las secuencias (IDs auto-incrementales)
- ✅ Verifica que todo se haya migrado correctamente

**⚠️ IMPORTANTE:** Haz backup de tu `pos.db` antes de eliminarla

---

## 🚂 Deploy en Railway

Railway es perfecto para este proyecto porque:
- ✅ PostgreSQL incluido gratis
- ✅ Deploy automático desde GitHub
- ✅ HTTPS automático
- ✅ Variables de entorno fáciles
- ✅ $5/mes de crédito gratis

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta (puedes usar GitHub)

### Paso 2: Crear nuevo proyecto

1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio
4. Railway detectará automáticamente que es Node.js

### Paso 3: Agregar PostgreSQL

1. En tu proyecto, click en "New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará una base de datos y configurará `DATABASE_URL` automáticamente

### Paso 4: Configurar variables de entorno

En el dashboard de tu servicio, ve a "Variables" y agrega:

```env
NODE_ENV=production
JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
FRONTEND_URL=https://tu-frontend.vercel.app
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
MAIL_FROM=tu-email@gmail.com
ADMIN_EMAIL=admin@example.com
```

**Nota:** `DATABASE_URL` y `PORT` son provistos automáticamente por Railway

### Paso 5: Deploy

Railway desplegará automáticamente cuando:
- Hagas push a la rama configurada (main/master)
- O puedes hacer deploy manual desde el dashboard

### Paso 6: Obtener la URL de tu API

Railway te dará una URL como:
```
https://tu-proyecto.railway.app
```

**Úsala en tu frontend** (variable `VITE_API_URL`)

---

## 📡 Endpoints de la API

### Health Check
```
GET /api/health
```

### Products
```
GET    /api/products          # Listar productos
GET    /api/products/:id      # Obtener producto
POST   /api/products          # Crear producto
PUT    /api/products/:id      # Actualizar producto
DELETE /api/products/:id      # Eliminar producto
```

### Sales
```
GET  /api/sales              # Listar ventas
GET  /api/sales/:id          # Obtener venta con items
GET  /api/sales/today        # Ventas de hoy por hora
POST /api/sales              # Crear venta
```

### Receipts
```
GET    /api/receipts         # Listar recibos
GET    /api/receipts/:id     # Obtener recibo
POST   /api/receipts         # Crear recibo
DELETE /api/receipts/:id     # Eliminar recibo
```

### Import
```
POST /api/import/products    # Importar productos (CSV/Excel)
```

### Reports
```
GET  /report/close           # Datos de cierre de caja
POST /report/close           # Cerrar caja
```

---

## 🗄️ Esquema de Base de Datos

### products
```sql
id              SERIAL PRIMARY KEY
upc             VARCHAR(50) UNIQUE
name            VARCHAR(255) NOT NULL
price           DECIMAL(10, 2) DEFAULT 0
qty             INTEGER DEFAULT 0
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### sales
```sql
id              SERIAL PRIMARY KEY
total           DECIMAL(10, 2) DEFAULT 0
payment_method  VARCHAR(20)
cash_received   DECIMAL(10, 2)
change_due      DECIMAL(10, 2)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### sale_items
```sql
id              SERIAL PRIMARY KEY
sale_id         INTEGER REFERENCES sales(id) ON DELETE CASCADE
product_id      INTEGER REFERENCES products(id) ON DELETE RESTRICT
qty             INTEGER NOT NULL
price           DECIMAL(10, 2) NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### receipts
```sql
id              SERIAL PRIMARY KEY
sale_id         INTEGER REFERENCES sales(id) ON DELETE CASCADE
supplier        VARCHAR(255)
notes           TEXT
content         TEXT
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### closures
```sql
id              SERIAL PRIMARY KEY
day             DATE NOT NULL
total           DECIMAL(10, 2) DEFAULT 0
by_method       JSONB NOT NULL
counted_cash    DECIMAL(10, 2) DEFAULT 0
counted_card    DECIMAL(10, 2) DEFAULT 0
diff_cash       DECIMAL(10, 2) DEFAULT 0
diff_card       DECIMAL(10, 2) DEFAULT 0
diff_total      DECIMAL(10, 2) DEFAULT 0
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 🔐 Seguridad

El backend incluye:

✅ **Helmet** - Headers de seguridad HTTP
✅ **CORS** - Configurado para tu frontend
✅ **Rate Limiting** - Previene abuso de API
✅ **Input Validation** - Validación de datos
✅ **Prepared Statements** - Previene SQL injection
✅ **Error Handling** - Manejo robusto de errores

---

## 📧 Configuración de Email

Para recibir emails de cierre de caja:

### Gmail (recomendado)

1. Activa la verificación en 2 pasos en tu cuenta Google
2. Genera una "Contraseña de aplicación":
   - Ve a https://myaccount.google.com/security
   - "Verificación en 2 pasos" → "Contraseñas de aplicaciones"
   - Genera una contraseña para "Correo"
3. Usa esa contraseña en `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Contraseña de aplicación
MAIL_FROM=tu-email@gmail.com
ADMIN_EMAIL=destinatario@example.com
```

---

## 🐛 Troubleshooting

### Error: "database does not exist"

**Solución:** Crea la base de datos manualmente:
```bash
createdb pos_development
```

### Error: "connection refused"

**Solución:** PostgreSQL no está corriendo:
```bash
# Mac
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Docker
docker start pos-postgres
```

### Error: "relation does not exist"

**Solución:** Las tablas no se crearon. El servidor las crea automáticamente al iniciar por primera vez.

### Railway: "Build failed"

**Solución:** 
1. Verifica que `package.json` tenga el `start` script
2. Asegúrate de tener Node 18+ en `engines`
3. Revisa los logs en Railway dashboard

---

## 📊 Monitoring

### Logs en Railway

Railway provee logs en tiempo real:
1. Ve a tu servicio
2. Tab "Deployments"
3. Click en el deployment activo
4. Ver logs

### Health Check

Monitorea el estado del servidor:
```bash
curl https://tu-proyecto.railway.app/api/health
```

Respuesta esperada:
```json
{
  "ok": true,
  "timestamp": "2026-01-10T...",
  "environment": "production",
  "database": "postgresql"
}
```

---

## 🔄 Backup de Base de Datos

### Railway Backup Manual

```bash
# Obtén DATABASE_URL de Railway
railway variables

# Haz dump de la base de datos
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Restaurar desde backup

```bash
psql $DATABASE_URL < backup-20260110.sql
```

---

## 🚀 Optimizaciones de Producción

El backend ya incluye:

✅ Connection pooling (max 20 conexiones)
✅ Prepared statements cacheados
✅ Indexes en columnas frecuentes
✅ JSONB para datos flexibles
✅ Transacciones ACID
✅ Cascading deletes configurados

---

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor (producción)
npm run dev        # Desarrollo con nodemon
npm run migrate    # Migrar desde SQLite
```

---

## 🤝 Soporte

¿Problemas con el deploy o configuración?

1. Revisa los logs en Railway dashboard
2. Verifica las variables de entorno
3. Asegúrate de que PostgreSQL esté conectado
4. Prueba el health check endpoint

---

## 📄 Licencia

Privado - © 2026 Compassion & Love

---

**¡Listo para producción! 🎉**

Tu backend está optimizado y listo para manejar miles de transacciones diarias.
