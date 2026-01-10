# 🚀 POS Compassion & Love v2.0

Sistema de Punto de Venta moderno construido con las mejores tecnologías actuales.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)

---

## ✨ Características Principales

### 🎨 **Frontend Moderno**
- ⚡ **Vite** - Build ultrarrápido y HMR instantáneo
- ⚛️ **React 18** - Última versión con Concurrent Features
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🎭 **Framer Motion** - Animaciones fluidas y profesionales
- 📊 **Recharts** - Gráficos interactivos
- 🧭 **React Router v6** - Navegación moderna
- 🎯 **Lucide React** - +1000 iconos modernos
- 🍞 **Sonner** - Notificaciones toast elegantes

### 🔧 **Backend Robusto**
- 🟢 **Node.js + Express** - API REST modular
- 💾 **SQLite (better-sqlite3)** - Base de datos rápida y confiable
- 📄 **XLSX** - Importación/exportación Excel
- 📧 **Nodemailer** - Envío de correos (cierres de caja)

### 🎯 **Funcionalidades**
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Sistema de ventas con carrito inteligente
- ✅ Gestión de inventario con búsqueda
- ✅ Importación masiva CSV/Excel
- ✅ Generación de recibos
- ✅ Cierre de caja automatizado
- ✅ Etiquetas de productos con código de barras
- ✅ Diseño responsive (móvil, tablet, desktop)

---

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm 9+ o yarn

### Paso 1: Instalar Dependencias

```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd server
npm install
cd ..
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
nano .env
```

Configuración mínima (`.env`):
```env
PORT=4000
NODE_ENV=development

# Opcional: Configurar SMTP para envío de emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-app
```

### Paso 3: Iniciar el Proyecto

**Opción A: Desarrollo (Frontend + Backend simultáneos)**

Terminal 1 - Backend:
```bash
npm run server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Opción B: Producción**

```bash
# Build del frontend
npm run build

# Servidor con archivos estáticos
npm run server
```

El frontend estará en: `http://localhost:3000`
El backend API en: `http://localhost:4000`

---

## 📁 Estructura del Proyecto

```
pos-modern/
├── public/                  # Archivos estáticos
├── server/                  # Backend Node.js
│   ├── routes/             # Rutas modulares de API
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── receipts.js
│   │   ├── import.js
│   │   └── reports.js
│   ├── utils/              # Utilidades del servidor
│   │   └── db-setup.js
│   ├── index.js            # Servidor principal
│   └── pos.db              # Base de datos SQLite (auto-generada)
├── src/
│   ├── assets/             # Imágenes, fuentes, etc.
│   ├── components/         # Componentes reutilizables
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Input.jsx
│   ├── context/            # Context API (estado global)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Sales.jsx
│   │   ├── Inventory.jsx
│   │   ├── Receipts.jsx
│   │   ├── CloseCash.jsx
│   │   ├── ProductLabel.jsx
│   │   └── NotFound.jsx
│   ├── services/           # Servicios de API
│   ├── utils/              # Funciones utilitarias
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🎨 Guía de Componentes

### 🔘 Button Component

```jsx
import Button from '@components/Button'

// Variantes
<Button variant="primary">Primario</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="danger">Peligro</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="md">Mediano (default)</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra Grande</Button>

// Con icono y loading
import { Plus } from 'lucide-react'
<Button icon={Plus} loading={isLoading}>Agregar</Button>
```

### 📦 Card Component

```jsx
import Card, { StatCard } from '@components/Card'

// Card básica
<Card title="Título" subtitle="Subtítulo" icon={PackageIcon}>
  Contenido aquí
</Card>

// StatCard (para métricas)
<StatCard
  title="Ventas Hoy"
  value="$1,234.56"
  icon={DollarSign}
  trend="+12.5%"
  trendUp={true}
  color="primary"
/>
```

### 📝 Input Component

```jsx
import Input from '@components/Input'
import { Search } from 'lucide-react'

<Input
  label="Buscar Producto"
  placeholder="Escribe aquí..."
  icon={Search}
  error="Campo requerido"
/>
```

---

## 🔌 API Endpoints

### Products

```
GET    /api/products          # Listar productos (con paginación)
GET    /api/products/:id      # Obtener un producto
POST   /api/products          # Crear producto
PUT    /api/products/:id      # Actualizar producto
DELETE /api/products/:id      # Eliminar producto
```

**Query parameters para GET /api/products:**
- `q` - Buscar por nombre o UPC
- `limit` - Límite de resultados (default: 50, max: 200)
- `offset` - Offset para paginación
- `low` - Filtrar productos con stock bajo (<5)

### Sales

```
GET  /api/sales/today         # Ventas de hoy (por hora)
POST /api/sales               # Registrar venta
```

### Receipts

```
GET  /api/receipts            # Listar recibos
POST /api/receipts            # Crear recibo
```

### Import

```
POST /api/import/products     # Importar productos desde CSV/Excel
```

**Body:** FormData con archivo en campo `file`
**Query:** `?dryRun=1` para simulación sin cambios

### Reports

```
GET /report/close             # Obtener datos de cierre de caja
```

**Query:** `?day=2026-01-10` (formato: YYYY-MM-DD)

---

## 🗄️ Esquema de Base de Datos

### products
```sql
id            INTEGER PRIMARY KEY
upc           TEXT UNIQUE
name          TEXT NOT NULL
price         REAL DEFAULT 0
qty           INTEGER DEFAULT 0
created_at    TEXT
updated_at    TEXT
```

### sales
```sql
id             INTEGER PRIMARY KEY
total          REAL DEFAULT 0
payment_method TEXT (cash/card)
cash_received  REAL
change_due     REAL
created_at     TEXT
```

### sale_items
```sql
id         INTEGER PRIMARY KEY
sale_id    INTEGER (FK)
product_id INTEGER (FK)
qty        INTEGER
price      REAL
```

### receipts
```sql
id         INTEGER PRIMARY KEY
sale_id    INTEGER (FK)
supplier   TEXT
notes      TEXT
content    TEXT (HTML del recibo)
created_at TEXT
```

### closures
```sql
id           INTEGER PRIMARY KEY
day          TEXT
total        REAL
by_method    TEXT (JSON)
counted_cash REAL
counted_card REAL
diff_cash    REAL
diff_card    REAL
diff_total   REAL
created_at   TEXT
```

---

## 🎯 Roadmap / Próximas Funcionalidades

### ✅ Fase 1: Base (Completada)
- [x] Setup del proyecto con Vite
- [x] Configuración de Tailwind CSS
- [x] Componentes base reutilizables
- [x] Layout y navegación
- [x] Dashboard funcional
- [x] API modular backend

### 🚧 Fase 2: Funcionalidades Core (En Progreso)
- [ ] Sistema de ventas completo con carrito
- [ ] Gestión de inventario avanzada
- [ ] Búsqueda en tiempo real
- [ ] Importación/Exportación CSV/Excel
- [ ] Sistema de recibos e impresión

### 📅 Fase 3: Features Avanzadas (Próximamente)
- [ ] Autenticación JWT (login de usuarios)
- [ ] Roles y permisos (admin, cajero, etc.)
- [ ] Reportes avanzados y estadísticas
- [ ] Gráficos de ventas por período
- [ ] Productos más vendidos
- [ ] Historial de inventario
- [ ] Backup automático de base de datos
- [ ] Modo oscuro (dark mode)
- [ ] PWA (Progressive Web App)
- [ ] Soporte offline
- [ ] Notificaciones push

---

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia Vite dev server (frontend)
npm run server       # Inicia servidor Express (backend)

# Producción
npm run build        # Build optimizado para producción
npm run preview      # Preview del build de producción

# Otros
npm run lint         # Lint del código con ESLint
```

---

## 🚀 Deploy a Producción

### Opción 1: VPS/Servidor Propio

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd pos-modern

# 2. Instalar dependencias
npm install
cd server && npm install && cd ..

# 3. Configurar .env
cp .env.example .env
nano .env

# 4. Build del frontend
npm run build

# 5. Usar PM2 para mantener el servidor corriendo
npm install -g pm2
pm2 start server/index.js --name pos-server
pm2 save
pm2 startup
```

### Opción 2: Vercel (Frontend) + Railway (Backend)

**Frontend en Vercel:**
```bash
# Conecta tu repo de GitHub a Vercel
# Build Command: npm run build
# Output Directory: dist
```

**Backend en Railway:**
```bash
# Conecta tu repo de GitHub a Railway
# Start Command: npm run server
# Variables de entorno: Agregar desde el dashboard
```

---

## 📚 Recursos y Documentación

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

---

## 🐛 Solución de Problemas

### El servidor no inicia

**Error:** `Cannot find module 'better-sqlite3'`

**Solución:**
```bash
cd server
npm install
```

### Las fuentes no cargan

**Problema:** Google Fonts bloqueado o sin internet

**Solución:** Descargar fuentes localmente:
```bash
# Descargar Outfit y JetBrains Mono
# Colocar en src/assets/fonts/
# Actualizar index.html
```

### Error de CORS

**Problema:** Frontend en puerto 3000, backend en 4000

**Solución:** Ya configurado en `vite.config.js`:
```js
server: {
  proxy: {
    '/api': 'http://localhost:4000'
  }
}
```

### La base de datos no se crea

**Problema:** Permisos de escritura

**Solución:**
```bash
chmod 755 server
cd server
node index.js
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados © 2026 Compassion & Love.

---

## 📧 Contacto

Para preguntas o soporte:
- Email: gracejecorp@gmail.com

---

## 🎉 Migración desde la Versión Anterior

Si tienes datos en el sistema anterior:

1. **Exporta tu base de datos actual:**
   - Haz backup de `pos.db`

2. **Copia la base de datos:**
   ```bash
   cp /ruta/antigua/pos.db /ruta/nueva/server/pos.db
   ```

3. **La estructura es compatible**, solo se añadieron columnas opcionales

4. **Verifica que todo funcione:**
   ```bash
   npm run server
   # Revisa logs para confirmar que la DB se inicializó correctamente
   ```

---

**¡Gracias por usar POS Compassion & Love! 🙏**

Si encuentras este proyecto útil, ¡dale una ⭐!
