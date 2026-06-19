# Karaoke Video

Aplicación web para cantar sobre videos de karaoke, grabar tu voz y exportar la mezcla como archivo WAV.

---

## Requisitos

- Node.js >= 20
- Navegador moderno con soporte para Web Audio API y `getUserMedia` (Chrome, Firefox, Edge)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/karaoke-video.git
cd karaoke-video

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

El servidor de Vite se levanta en `http://localhost:5173` y redirige las peticiones `/api/*` al backend en `http://localhost:3001`.

### Producción

```bash
# Compilar TypeScript y empaquetar frontend
npm run build

# Iniciar servidor (Express sirve dist/ + API)
npm run server
```

Acceder a `http://localhost:3001`.

## Cómo usar

### 1. Elegir video
La página carga la lista de videos disponibles en el servidor. Selecciona uno de la lista o sube un video propio (MP4, WebM, MKV, AVI, MOV, FLV, M4V — máximo 500 MB).

### 2. Preparar
Confirma la selección y presiona **Iniciar Karaoke**.

### 3. Grabar
El video se reproduce y el micrófono se activa automáticamente. Puedes:
- Activar/desactivar la **monitorización** para escucharte en tiempo real
- Ajustar el volumen del **video** y de tu **voz**
- Pausar/reanudar la grabación
- Presionar **Detener** cuando termines

### 4. Mezclar y exportar
Antes de exportar puedes ajustar:
- **Volumen de pista** (audio del video) y **voz**
- **Ecualizador** de 3 bandas (graves, medios, agudos)
- **Delay** (tiempo y feedback)
- **Reverberación** (mezcla)

Presiona **Exportar WAV** para descargar la mezcla final.

## Estructura del proyecto

```
├── server/
│   ├── index.js         # Backend Express (API + estáticos)
│   └── videos/          # Videos subidos (gitignored)
├── src/
│   ├── main.ts          # UI y orquestación
│   ├── audio-engine.ts  # Captura, efectos y exportación WAV
│   ├── lrc-parser.ts    # Parser de letras LRC (no integrado)
│   └── style.css        # Estilos glassmorphism oscuro
├── dist/                # Build de producción (gitignored)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.js
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Vite |
| `npm run build` | TypeCheck + build de producción |
| `npm run server` | Servidor Express en :3001 |
| `npm run preview` | Vista previa del build |

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/videos` | Lista videos disponibles |
| `POST` | `/api/videos/upload` | Subir video (multipart, campo: `video`) |
| `GET` | `/api/videos/:filename` | Descargar/streaming de video |
| `DELETE` | `/api/videos/:filename` | Eliminar video |

## Colaborar

1. Haz un fork del repositorio
2. Crea una rama: `git checkout -b mi-feature`
3. Haz tus cambios y verifica que compile: `npm run build`
4. Commit con mensajes descriptivos (español o inglés)
5. Abre un Pull Request

No hay linter ni formateador configurado, pero el TypeScript compila con restricciones estrictas (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`).

## Licencia

MIT
