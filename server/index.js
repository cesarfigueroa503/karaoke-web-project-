import express from 'express'
import multer from 'multer'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VIDEOS_DIR = join(__dirname, 'videos')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VIDEOS_DIR),
  filename: (req, file, cb) => {
    const artist = (req.body.artist || '').trim() || 'Desconocido'
    const song = (req.body.song || '').trim() || file.originalname.replace(extname(file.originalname), '')
    const ext = extname(file.originalname) || '.mp4'
    let name = `${artist} - ${song}${ext}`
    if (existsSync(join(VIDEOS_DIR, name))) {
      const ts = Date.now()
      name = `${artist} - ${song} - ${ts}${ext}`
    }
    cb(null, name)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const videoExts = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.m4v']
    const ext = extname(file.originalname).toLowerCase()
    if (videoExts.includes(ext)) return cb(null, true)
    cb(new Error(`Formato no soportado: ${ext}. Usa: ${videoExts.join(', ')}`))
  },
  limits: { fileSize: 500 * 1024 * 1024 },
})

const app = express()
app.use(express.json())
app.use(express.static(join(__dirname, '..', 'dist')))

app.get('/api/videos', async (_req, res) => {
  try {
    if (!existsSync(VIDEOS_DIR)) return res.json([])
    const files = await readdir(VIDEOS_DIR)
    const videos = files
      .filter((f) => /\.(mp4|webm|mkv|avi|mov|flv|m4v)$/i.test(f))
      .map((filename) => {
        const withoutExt = filename.replace(/\.[^.]+$/, '')
        const parts = withoutExt.split(' - ')
        return {
          filename,
          artist: parts.length > 1 ? parts.slice(0, -1).join(' - ') : 'Desconocido',
          song: parts.length > 1 ? parts[parts.length - 1] : withoutExt,
        }
      })
    res.json(videos)
  } catch {
    res.status(500).json({ error: 'Error al listar videos' })
  }
})

app.get('/api/videos/:filename', (req, res) => {
  const filePath = join(VIDEOS_DIR, req.params.filename)
  if (!filePath.startsWith(VIDEOS_DIR)) return res.status(403).json({ error: 'Acceso denegado' })
  if (!existsSync(filePath)) return res.status(404).json({ error: 'Video no encontrado' })
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) res.status(500).json({ error: 'Error al enviar el video' })
  })
})

app.post('/api/videos/upload', (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      const msg = err instanceof multer.MulterError
        ? `Error de subida: ${err.message}`
        : err.message
      return res.status(400).json({ error: msg })
    }
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' })
    res.json({
      filename: req.file.filename,
      artist: (req.body.artist || '').trim() || 'Desconocido',
      song: (req.body.song || '').trim() || req.file.originalname,
    })
  })
})

app.delete('/api/videos/:filename', async (req, res) => {
  const filePath = join(VIDEOS_DIR, req.params.filename)
  if (!filePath.startsWith(VIDEOS_DIR)) return res.status(403).json({ error: 'Acceso denegado' })
  try {
    await unlink(filePath)
    res.json({ success: true })
  } catch {
    res.status(404).json({ error: 'Video no encontrado' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Karaoke Video server at http://localhost:${PORT}`)
})
