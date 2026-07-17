# TungaTV Backend

API Backend para TungaTV - Aplicación de streaming de películas y series en React Native.

## Endpoints

### Health Check
```
GET /api/health
```
Respuesta: `{ status: "ok", timestamp: "..." }`

### Obtener versión
```
GET /api/version
```
Respuesta:
```json
{
  "version": "11.2.3",
  "apkUrl": "https://...",
  "changelog": "..."
}
```

### Obtener stream de película
```
GET /api/movie/:tmdbId
```
Ejemplo: `GET /api/movie/550`

Respuesta:
```json
{
  "url": "https://...",
  "headers": {...},
  "source": "vidsrc"
}
```

### Obtener stream de serie
```
GET /api/tv/:tmdbId/:season/:episode
```
Ejemplo: `GET /api/tv/1399/1/1`

Respuesta:
```json
{
  "url": "https://...",
  "headers": {...},
  "source": "vidsrc"
}
```

## Instalación Local

```bash
npm install
npm run dev
```

Servidor corriendo en `http://localhost:3000`

## Despliegue en Vercel

```bash
vercel deploy
```

## Variables de Entorno

Actualmente no se requieren variables de entorno específicas. El backend conecta directamente a VidSrc.
