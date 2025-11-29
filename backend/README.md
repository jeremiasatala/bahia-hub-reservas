# Bahía Hub - Backend API

Sistema de reservas y gestión de espacios para Bahía Hub.

## Características

- ✅ Autenticación JWT
- ✅ Gestión de usuarios y roles
- ✅ CRUD completo de espacios
- ✅ Sistema de reservas con validación de conflictos
- ✅ Generación de reportes (PDF/Excel)
- ✅ Protección con API Key
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ Rate limiting
- ✅ Seguridad con Helmet

## Tecnologías

- Node.js
- Express.js
- MongoDB con Mongoose
- JWT para autenticación
- Bcrypt para hash de contraseñas
- Express Validator
- PDFKit para reportes PDF
- ExcelJS para reportes Excel

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`
4. Ejecutar en desarrollo: `npm run dev`

## Variables de Entorno

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu_jwt_secret
API_KEY=tu_api_key
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email
EMAIL_PASS=tu_password
FRONTEND_URL=http://localhost:3000