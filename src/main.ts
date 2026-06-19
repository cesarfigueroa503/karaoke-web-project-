import './style.css'
import { AudioEngine } from './audio-engine'

interface VideoInfo {
  filename: string
  artist: string
  song: string
}

type Step = 1 | 2 | 3 | 4

class VideoKaraokeApp {
  private audio = new AudioEngine()
  private videoEl!: HTMLVideoElement
  private videoUrl: string | null = null
  private selectedVideo: VideoInfo | null = null

  private playing = false
  private recording = false
  private paused = false
  private animFrame = 0
  private trackDuration = 0

  private videos: VideoInfo[] = []
  private currentStep: Step = 1

  constructor() {
    this.render()
    this.bind()
    this.loadVideos()
  }

  private esc(s: string): string {
    const d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  private nowStr(): string {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  }

  private render(): void {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div class="karaoke-container">
        <header class="header">
          <h1>Karaoke</h1>
          <p>Canta sobre tu video favorito</p>
        </header>

        <div id="alert-box" class="alert-box hidden" role="alert">
          <div class="alert-icon">!</div>
          <div class="alert-body">
            <div class="alert-title" id="alert-title"></div>
            <div class="alert-detail" id="alert-detail"></div>
            <div class="alert-help" id="alert-help"></div>
          </div>
          <button class="alert-close" id="alert-close" aria-label="Cerrar">&times;</button>
        </div>

        <nav class="steps" id="steps-nav">
          <div class="step" data-step="1">
            <div class="step-circle" id="step-1-circle">1</div>
            <span class="step-label">Elige video</span>
          </div>
          <div class="step-connector" id="step-conn-1"></div>
          <div class="step" data-step="2">
            <div class="step-circle" id="step-2-circle">2</div>
            <span class="step-label">Preparar</span>
          </div>
          <div class="step-connector" id="step-conn-2"></div>
          <div class="step" data-step="3">
            <div class="step-circle" id="step-3-circle">3</div>
            <span class="step-label">Grabar</span>
          </div>
          <div class="step-connector" id="step-conn-3"></div>
          <div class="step" data-step="4">
            <div class="step-circle" id="step-4-circle">4</div>
            <span class="step-label">Mezclar</span>
          </div>
        </nav>

        <section id="step-1-section" class="card step-panel">
          <div class="step-header">
            <h2>Videoteca</h2>
            <button id="show-upload-btn" class="btn btn-secondary btn-sm">+ Subir Video</button>
          </div>
          <div id="upload-form" class="upload-form hidden">
            <input type="text" id="upload-artist" class="input" placeholder="Artista">
            <input type="text" id="upload-song" class="input" placeholder="Canción">
            <div class="upload-file-row">
              <label for="upload-file" class="file-label-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span id="upload-file-label">Seleccionar archivo</span>
              </label>
              <input type="file" id="upload-file" accept="video/*" hidden>
              <button id="upload-submit-btn" class="btn btn-primary btn-sm" disabled>Subir</button>
            </div>
            <div id="upload-status" class="upload-status hidden"></div>
          </div>
          <div id="video-list" class="video-list"><p class="loading"><span class="spinner"></span>Cargando videoteca...</p></div>
        </section>

        <section id="step-2-section" class="card step-panel hidden">
          <div class="step-header">
            <h2>Confirmar selección</h2>
          </div>
          <div class="selected-video-info">
            <div class="selected-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <div>
              <div id="selected-song" class="selected-song"></div>
              <div id="selected-artist" class="selected-artist"></div>
            </div>
          </div>
          <div class="step-actions">
            <button id="back-from-step2-btn" class="btn btn-secondary">Volver</button>
            <button id="start-btn" class="btn btn-primary">Iniciar Karaoke</button>
          </div>
        </section>

        <section id="step-3-section" class="step-panel hidden">
          <div class="step-header">
            <h2>Grabación</h2>
            <span id="rec-timer" class="rec-timer">0:00</span>
          </div>
          <div class="video-wrapper">
            <video id="video-player"></video>
          </div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="rec-progress"></div>
            </div>
            <div class="time-display">
              <span id="rec-current-time">0:00</span>
              <span class="time-sep">/</span>
              <span id="rec-total-time">0:00</span>
            </div>
          </div>
          <div class="rec-volume-row">
            <div class="rec-fader">
              <label>Vol. Video</label>
              <input type="range" id="rec-track-volume" min="0" max="100" step="1" value="70">
              <span id="rec-track-vol-value" class="rec-fader-val">70%</span>
            </div>
            <div class="rec-fader">
              <label>Vol. Monitor</label>
              <input type="range" id="rec-monitor-volume" min="0" max="100" step="1" value="80">
              <span id="rec-monitor-vol-value" class="rec-fader-val">80%</span>
            </div>
          </div>
          <div class="monitor-row">
            <label class="switch-label">
              <input type="checkbox" id="monitor-check" checked>
              <span class="switch-track">
                <span class="switch-thumb"></span>
              </span>
              <span class="switch-text">Monitorear voz</span>
            </label>
          </div>
          <div id="rec-indicator" class="rec-indicator">
            <span class="rec-dot"></span>
            <span id="rec-indicator-text">Grabando...</span>
          </div>
          <div class="step-actions" id="rec-actions">
            <button id="pause-btn" class="btn btn-secondary">Pausar</button>
            <button id="stop-btn" class="btn btn-danger">Detener</button>
          </div>
        </section>

        <section id="step-4-section" class="step-panel hidden">
          <div class="step-header">
            <h2>Mezclador</h2>
            <span id="mix-timer" class="rec-timer">0:00</span>
          </div>
          <div id="track-status" class="track-status hidden"></div>

          <div class="progress-container">
            <div class="progress-bar" id="mix-progress-bar">
              <div class="progress-fill" id="mix-progress"></div>
            </div>
            <div class="time-display">
              <span id="mix-current-time">0:00</span>
              <span class="time-sep">/</span>
              <span id="mix-total-time">0:00</span>
            </div>
          </div>

          <div class="mixer-controls">
            <div class="fader-group">
              <label>Vol. Video</label>
              <input type="range" id="track-volume" min="0" max="100" step="1" value="70">
              <span id="track-volume-value">70%</span>
            </div>
            <div class="fader-group">
              <label>Vol. Voz</label>
              <input type="range" id="vocals-volume" min="0" max="1.5" step="0.01" value="1">
              <span id="vocals-volume-value">100%</span>
            </div>
          </div>

          <h2>Efectos de Voz</h2>
          <div class="effects-panel">
            <div class="effect-group">
              <h3>Ecualizador</h3>
              <div class="band">
                <label>Graves</label>
                <input type="range" id="eq-low" min="-12" max="12" step="0.1" value="0">
                <span id="eq-low-value">0 dB</span>
              </div>
              <div class="band">
                <label>Medios</label>
                <input type="range" id="eq-mid" min="-12" max="12" step="0.1" value="0">
                <span id="eq-mid-value">0 dB</span>
              </div>
              <div class="band">
                <label>Agudos</label>
                <input type="range" id="eq-high" min="-12" max="12" step="0.1" value="0">
                <span id="eq-high-value">0 dB</span>
              </div>
            </div>
            <div class="effect-group">
              <h3>Eco</h3>
              <div class="band">
                <label>Tiempo</label>
                <input type="range" id="delay-time" min="0.1" max="0.8" step="0.01" value="0.3">
                <span id="delay-time-value">0.3s</span>
              </div>
              <div class="band">
                <label>Intensidad</label>
                <input type="range" id="delay-feedback" min="0" max="0.6" step="0.01" value="0.3">
                <span id="delay-feedback-value">30%</span>
              </div>
            </div>
            <div class="effect-group">
              <h3>Reverberación</h3>
              <div class="band">
                <label>Mezcla</label>
                <input type="range" id="reverb-mix" min="0" max="1" step="0.01" value="0.3">
                <span id="reverb-mix-value">30%</span>
              </div>
            </div>
          </div>

          <div class="mix-actions">
            <button id="stop-mix-btn" class="btn btn-danger hidden">Detener</button>
            <button id="playback-btn" class="btn btn-accent" disabled>Escuchar Mezcla</button>
            <button id="export-btn" class="btn btn-success" disabled>Exportar WAV</button>
          </div>
          <div class="step-actions" style="margin-top:16px">
            <button id="back-to-library-btn" class="btn btn-secondary">Volver a Videoteca</button>
            <button id="restart-btn" class="btn btn-primary hidden">Grabar de Nuevo</button>
          </div>
        </section>
      </div>
    `
  }

  private bind(): void {
    const q = <T extends HTMLElement>(id: string) => document.querySelector<T>(id)!

    q<HTMLButtonElement>('#alert-close').addEventListener('click', () => this.dismissAlert())
    q<HTMLButtonElement>('#show-upload-btn').addEventListener('click', () => {
      q<HTMLDivElement>('#upload-form').classList.toggle('hidden')
    })
    q<HTMLInputElement>('#upload-file').addEventListener('change', () => this.onUploadFileChange())
    q<HTMLButtonElement>('#upload-submit-btn').addEventListener('click', () => this.uploadVideo())

    q<HTMLButtonElement>('#back-from-step2-btn').addEventListener('click', () => this.goToStep(1))
    q<HTMLButtonElement>('#back-to-library-btn').addEventListener('click', () => this.goToStep(1))

    q<HTMLButtonElement>('#start-btn').addEventListener('click', () => this.start())
    q<HTMLInputElement>('#rec-track-volume').addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value)
      this.setVideoVolume(v)
      document.querySelector<HTMLSpanElement>('#rec-track-vol-value')!.textContent = `${Math.round(v)}%`
    })
    q<HTMLInputElement>('#rec-monitor-volume').addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value)
      this.audio.setMonitorVolume(v / 100)
      document.querySelector<HTMLSpanElement>('#rec-monitor-vol-value')!.textContent = `${Math.round(v)}%`
    })
    q<HTMLInputElement>('#monitor-check').addEventListener('change', (e) => {
      this.audio.setMonitoring((e.target as HTMLInputElement).checked)
    })
    q<HTMLButtonElement>('#pause-btn').addEventListener('click', () => this.togglePause())
    q<HTMLButtonElement>('#stop-btn').addEventListener('click', () => this.stopRecording())

    q<HTMLInputElement>('#track-volume').addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value)
      this.setVideoVolume(v)
      this.audio._trackVolume = v / 100
      document.querySelector<HTMLSpanElement>('#track-volume-value')!.textContent = `${Math.round(v)}%`
    })

    const mixBar = document.querySelector<HTMLDivElement>('#mix-progress-bar')
    if (mixBar) {
      mixBar.style.cursor = 'pointer'
      mixBar.addEventListener('click', (e) => this.onMixProgressClick(e))
    }

    q<HTMLButtonElement>('#playback-btn').addEventListener('click', () => this.togglePlayback())
    q<HTMLButtonElement>('#stop-mix-btn').addEventListener('click', () => this.stopMixPlayback())
    q<HTMLButtonElement>('#export-btn').addEventListener('click', () => this.export())
    q<HTMLButtonElement>('#restart-btn').addEventListener('click', () => this.restartRecording())

    this.bindSliders()
  }

  private bindSliders(): void {
    const pairs: [string, string, (v: number) => void, string?][] = [
      ['vocals-volume', 'vocals-volume-value', (v) => this.audio.setVocalsVolume(v), 'pct'],
      ['eq-low', 'eq-low-value', (v) => this.audio.setEqLow(v), 'db'],
      ['eq-mid', 'eq-mid-value', (v) => this.audio.setEqMid(v), 'db'],
      ['eq-high', 'eq-high-value', (v) => this.audio.setEqHigh(v), 'db'],
      ['delay-time', 'delay-time-value', (v) => this.audio.setDelayTime(v), 's'],
      ['delay-feedback', 'delay-feedback-value', (v) => this.audio.setDelayFeedback(v), 'pct'],
      ['reverb-mix', 'reverb-mix-value', (v) => this.audio.setReverbMix(v), 'pct'],
    ]

    for (const [inputId, spanId, setter, fmt] of pairs) {
      const input = document.querySelector<HTMLInputElement>(`#${inputId}`)!
      const span = document.querySelector<HTMLSpanElement>(`#${spanId}`)!
      input.addEventListener('input', () => {
        const v = parseFloat(input.value)
        setter(v)
        if (fmt === 'pct') span.textContent = `${Math.round(v * 100)}%`
        else if (fmt === 'db') span.textContent = `${v} dB`
        else if (fmt === 's') span.textContent = `${v}s`
      })
    }
  }

  private setVideoVolume(value: number): void {
    if (this.videoEl) this.videoEl.volume = value / 100
  }

  // ---- Error Alerts ----

  private showAlert(title: string, detail: string, help: string): void {
    const box = document.querySelector<HTMLDivElement>('#alert-box')!
    box.querySelector<HTMLDivElement>('#alert-title')!.textContent = title
    box.querySelector<HTMLDivElement>('#alert-detail')!.textContent = detail
    box.querySelector<HTMLDivElement>('#alert-help')!.textContent = help
    box.classList.remove('hidden')
    box.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  private dismissAlert(): void {
    document.querySelector<HTMLDivElement>('#alert-box')!.classList.add('hidden')
  }

  // ---- Navigation ----

  private goToStep(step: Step): void {
    const prev = this.currentStep
    this.currentStep = step

    document.querySelectorAll('.step-panel').forEach((el) => el.classList.add('hidden'))
    document.querySelector(`#step-${step}-section`)?.classList.remove('hidden')

    this.updateStepsNav()
    this.scrollToTop()

    if (step === 1 && (prev === 3 || prev === 4)) {
      this.audio.stop()
      this.audio.releaseMic()
      this.playing = false
      this.recording = false
      this.paused = false
      cancelAnimationFrame(this.animFrame)
      if (this.videoEl) this.videoEl.pause()
    }

    this.dismissAlert()
  }

  private updateStepsNav(): void {
    for (let i = 1; i <= 4; i++) {
      const circle = document.querySelector<HTMLDivElement>(`#step-${i}-circle`)!
      const conn = document.querySelector<HTMLDivElement>(`#step-conn-${i}`)
      circle.className = 'step-circle'
      if (i < this.currentStep) {
        circle.classList.add('done')
        circle.innerHTML = '&#10003;'
        conn?.classList.add('done')
      } else if (i === this.currentStep) {
        circle.classList.add('active')
        circle.textContent = String(i)
        conn?.classList.remove('done')
      } else {
        circle.textContent = String(i)
        conn?.classList.remove('done')
      }
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---- Video Library ----

  private isNetworkError(err: unknown): boolean {
    return err instanceof TypeError
  }

  private async loadVideos(): Promise<void> {
    const listEl = document.querySelector<HTMLDivElement>('#video-list')!
    try {
      const res = await fetch('/api/videos')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      this.videos = await res.json()
      this.renderVideoList()
    } catch (err) {
      listEl.innerHTML = `
        <div class="server-error">
          <div class="server-error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p class="server-error-title">Servidor no disponible</p>
          <p class="server-error-detail">${this.isNetworkError(err) ? 'No se puede conectar con el servidor en el puerto 3001.' : 'Error al cargar la videoteca.'}</p>
          <p class="server-error-help">Asegúrate de ejecutar <code>npm run server</code> en otra terminal y vuelve a cargar la página.</p>
          <button class="btn btn-secondary btn-sm" id="reload-btn">Reintentar</button>
        </div>
      `
      document.querySelector<HTMLButtonElement>('#reload-btn')?.addEventListener('click', () => location.reload())
    }
  }

  private renderVideoList(): void {
    const listEl = document.querySelector<HTMLDivElement>('#video-list')!
    if (this.videos.length === 0) {
      listEl.innerHTML = '<p class="empty-hint">No hay videos en el servidor. Sube uno para empezar.</p>'
      return
    }

    listEl.innerHTML = this.videos.map((v) => `
      <div class="video-card" data-filename="${this.esc(v.filename)}">
        <div class="video-card-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <div class="video-card-info">
          <div class="video-card-song">${this.esc(v.song)}</div>
          <div class="video-card-artist">${this.esc(v.artist)}</div>
        </div>
      </div>
    `).join('')

    listEl.querySelectorAll('.video-card').forEach((el) => {
      el.addEventListener('click', () => {
        const filename = el.getAttribute('data-filename')!
        this.selectVideo(filename)
      })
    })
  }

  private selectVideo(filename: string): void {
    const vid = this.videos.find((v) => v.filename === filename)
    if (!vid) return

    this.selectedVideo = vid
    this.videoUrl = `/api/videos/${encodeURIComponent(vid.filename)}`

    document.querySelectorAll('.video-card').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-filename') === filename)
    })

    document.querySelector<HTMLSpanElement>('#selected-song')!.textContent = vid.song
    document.querySelector<HTMLSpanElement>('#selected-artist')!.textContent = vid.artist

    this.goToStep(2)
  }

  // ---- Upload ----

  private onUploadFileChange(): void {
    const input = document.querySelector<HTMLInputElement>('#upload-file')!
    const label = document.querySelector<HTMLSpanElement>('#upload-file-label')!
    const btn = document.querySelector<HTMLButtonElement>('#upload-submit-btn')!
    const status = document.querySelector<HTMLDivElement>('#upload-status')!
    status.classList.add('hidden')

    if (input.files?.length) {
      label.textContent = input.files[0].name
      btn.disabled = false
    } else {
      label.textContent = 'Seleccionar archivo'
      btn.disabled = true
    }
  }

  private async uploadVideo(): Promise<void> {
    const fileInput = document.querySelector<HTMLInputElement>('#upload-file')!
    const artistInput = document.querySelector<HTMLInputElement>('#upload-artist')!
    const songInput = document.querySelector<HTMLInputElement>('#upload-song')!
    const btn = document.querySelector<HTMLButtonElement>('#upload-submit-btn')!
    const status = document.querySelector<HTMLDivElement>('#upload-status')!

    if (!fileInput.files?.length) {
      this.showAlert('Ningún archivo seleccionado', 'Debes elegir un archivo de video antes de subir.', 'Haz clic en "Seleccionar archivo" y elige un video de tu computadora.')
      return
    }

    if (!artistInput.value.trim() || !songInput.value.trim()) {
      this.showAlert('Campos incompletos', 'El artista y la canción son obligatorios para identificar el video.', 'Completa los campos "Artista" y "Canción" antes de subir.')
      return
    }

    btn.disabled = true
    btn.textContent = 'Subiendo...'
    status.className = 'upload-status info'
    status.classList.remove('hidden')
    status.textContent = 'Subiendo video...'

    const form = new FormData()
    form.append('video', fileInput.files[0])
    form.append('artist', artistInput.value.trim())
    form.append('song', songInput.value.trim())

    try {
      const res = await fetch('/api/videos/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status})`)
      status.className = 'upload-status ok'
      status.textContent = 'Video subido correctamente'
      fileInput.value = ''
      artistInput.value = ''
      songInput.value = ''
      document.querySelector<HTMLSpanElement>('#upload-file-label')!.textContent = 'Seleccionar archivo'
      await this.loadVideos()
    } catch (err) {
      status.className = 'upload-status error'
      if (this.isNetworkError(err)) {
        status.textContent = 'Error de conexión: el servidor no responde. Asegúrate de que el servidor esté ejecutándose.'
      } else {
        status.textContent = `Error: ${err instanceof Error ? err.message : 'desconocido'}`
      }
    }

    btn.disabled = false
    btn.textContent = 'Subir'
  }

  // ---- Status ----

  private setTrackStatus(status: boolean | null): void {
    const el = document.querySelector<HTMLDivElement>('#track-status')!
    if (status === null) {
      el.className = 'track-status hidden'
      el.textContent = ''
      return
    }
    el.className = status ? 'track-status ok' : 'track-status error'
    el.innerHTML = status
      ? 'Audio de video capturado ✓'
      : 'El video no tiene pista de audio. La mezcla solo contendrá tu voz.'
  }

  // ---- Karaoke Flow ----

  private async start(): Promise<void> {
    if (!this.selectedVideo) return

    if (!navigator.mediaDevices?.getUserMedia) {
      this.showAlert(
        'Navegador no compatible',
        'Tu navegador no soporta grabación de audio. Esta aplicación requiere la API getUserMedia.',
        'Usa Chrome, Edge, Firefox o Safari en su versión más reciente.'
      )
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      this.showAlert(
        'Grabación no soportada',
        'Tu navegador no soporta MediaRecorder, necesario para grabar tu voz.',
        'Actualiza tu navegador a la versión más reciente (Chrome, Edge o Firefox).'
      )
      return
    }

    this.dismissAlert()
    this.goToStep(3)
    await this.audio.init()

    try {
      await this.audio.requestMic()
    } catch (err) {
      const msg = err instanceof DOMException
        ? (err.name === 'NotAllowedError'
          ? 'Permiso denegado. El navegador bloqueó el acceso al micrófono.'
          : err.name === 'NotFoundError'
            ? 'No se encontró ningún micrófono. Conecta uno e intenta de nuevo.'
            : `Error del navegador: ${err.message}`)
        : 'No se pudo acceder al micrófono.'
      this.showAlert('Micrófono no disponible', msg, 'Verifica que el micrófono esté conectado y concedé permiso cuando el navegador lo solicite. Si usas auriculares con micrófono, asegúrate de que estén seleccionados como dispositivo predeterminado.')
      this.currentStep = 2
      document.querySelectorAll('.step-panel').forEach((el) => el.classList.add('hidden'))
      document.querySelector('#step-2-section')?.classList.remove('hidden')
      this.updateStepsNav()
      this.scrollToTop()
      return
    }

    this.videoEl = document.querySelector<HTMLVideoElement>('#video-player')!
    const initialTrackVol = parseFloat(document.querySelector<HTMLInputElement>('#rec-track-volume')?.value ?? '70')
    this.videoEl.volume = initialTrackVol / 100

    this.videoEl.src = this.videoUrl!

    const total = await new Promise<number>((resolve) => {
      const onMeta = () => {
        cleanup()
        resolve(this.videoEl.duration)
      }
      const onErr = () => {
        cleanup()
        resolve(NaN)
      }
      const cleanup = () => {
        this.videoEl.removeEventListener('loadedmetadata', onMeta)
        this.videoEl.removeEventListener('error', onErr)
      }
      this.videoEl.addEventListener('loadedmetadata', onMeta)
      this.videoEl.addEventListener('error', onErr)
      if (this.videoEl.readyState >= 1) {
        cleanup()
        resolve(this.videoEl.duration)
      }
    })

    if (!total || total === Infinity || isNaN(total)) {
      const reason = this.videoEl.error
        ? `Error ${this.videoEl.error.code}: ${this.videoEl.error.message}`
        : 'El video no tiene información de duración.'
      this.showAlert('Error al cargar el video', reason, 'Verifica que el archivo exista en el servidor y sea un formato compatible (MP4, WebM, MKV).')
      this.recording = false
      this.playing = false
      return
    }

    this.trackDuration = total

    document.querySelector<HTMLSpanElement>('#rec-total-time')!.textContent = this.formatTime(total)
    document.querySelector<HTMLSpanElement>('#mix-total-time')!.textContent = this.formatTime(total)
    document.querySelector<HTMLSpanElement>('#rec-timer')!.textContent = this.formatTime(0)
    document.querySelector<HTMLSpanElement>('#mix-timer')!.textContent = this.formatTime(0)

    this.recording = true
    this.playing = true
    this.videoEl.currentTime = 0
    const initialMonVol = parseFloat(document.querySelector<HTMLInputElement>('#rec-monitor-volume')?.value ?? '80')
    this.audio.setMonitorVolume(initialMonVol / 100)
    this.audio.startVideoCapture(this.videoEl)
    this.audio.startCapture()
    this.videoEl.play()
    this.tick()
  }

  private async onTrackEnd(): Promise<void> {
    if (!this.recording) return
    this.recording = false
    this.playing = false
    this.paused = false
    cancelAnimationFrame(this.animFrame)

    await this.audio.stopRecording()
    this.afterRecording()
  }

  private async stopRecording(): Promise<void> {
    if (!this.recording) return
    this.recording = false
    this.playing = false
    this.paused = false
    cancelAnimationFrame(this.animFrame)

    document.querySelector<HTMLDivElement>('#rec-indicator')!.classList.add('hidden')

    this.videoEl.pause()
    this.audio.stop()
    await this.audio.stopRecording()
    this.afterRecording()
  }

  private afterRecording(): void {
    this.audio.setMonitoring(false)
    document.querySelector<HTMLDivElement>('#rec-indicator')!.classList.add('hidden')

    this.setTrackStatus(this.audio.hasVideoAudio())

    const hasRecording = this.audio.hasRecording()
    if (!hasRecording) {
      this.showAlert('No se grabó tu voz', 'No se detectó audio de tu micrófono durante la grabación. La mezcla solo tendrá la pista del video.', 'Asegúrate de que el micrófono esté funcionando y no esté silenciado. Usa auriculares para evitar que el audio del video se grabe junto con tu voz.')
    }

    document.querySelector<HTMLButtonElement>('#playback-btn')!.disabled = !hasRecording
    document.querySelector<HTMLButtonElement>('#export-btn')!.disabled = false
    document.querySelector<HTMLButtonElement>('#restart-btn')!.classList.remove('hidden')
    document.querySelector<HTMLButtonElement>('#restart-btn')!.textContent = 'Grabar de Nuevo'

    this.goToStep(4)
  }

  private restartRecording(): void {
    this.dismissAlert()
    this.audio.clearRecording()
    this.paused = false
    this.setTrackStatus(null)

    const total = this.trackDuration
    document.querySelector<HTMLSpanElement>('#rec-total-time')!.textContent = this.formatTime(total)
    document.querySelector<HTMLSpanElement>('#mix-total-time')!.textContent = this.formatTime(total)
    document.querySelector<HTMLDivElement>('#rec-progress')!.style.width = '0%'
    document.querySelector<HTMLDivElement>('#mix-progress')!.style.width = '0%'
    document.querySelector<HTMLSpanElement>('#rec-current-time')!.textContent = '0:00'
    document.querySelector<HTMLSpanElement>('#mix-current-time')!.textContent = '0:00'
    document.querySelector<HTMLSpanElement>('#rec-timer')!.textContent = '0:00'
    document.querySelector<HTMLSpanElement>('#mix-timer')!.textContent = '0:00'

    this.audio.stop()
    this.audio.resetMicRecorder()
    this.goToStep(3)

    const monitorChecked = document.querySelector<HTMLInputElement>('#monitor-check')?.checked ?? true
    this.audio.setMonitoring(monitorChecked)
    this.audio.setMonitorVolume(parseFloat(document.querySelector<HTMLInputElement>('#rec-monitor-volume')?.value ?? '80') / 100)

    document.querySelector<HTMLDivElement>('#rec-indicator')!.classList.remove('hidden')
    this.videoEl.currentTime = 0
    this.recording = true
    this.playing = true
    this.audio.startVideoCapture(this.videoEl)
    this.audio.startCapture()
    this.videoEl.play()
    this.tick()
  }

  private togglePause(): void {
    const btn = document.querySelector<HTMLButtonElement>('#pause-btn')!
    const indicator = document.querySelector<HTMLDivElement>('#rec-indicator')!
    const text = document.querySelector<HTMLSpanElement>('#rec-indicator-text')!

    if (!this.paused) {
      this.paused = true
      this.playing = false
      cancelAnimationFrame(this.animFrame)
      this.videoEl.pause()
      this.audio.pauseRecording()
      indicator.classList.add('hidden')
      btn.textContent = 'Reanudar'
    } else {
      this.paused = false
      this.playing = true
      this.videoEl.play()
      this.audio.resumeRecording()
      indicator.classList.remove('hidden')
      text.textContent = 'Grabando...'
      btn.textContent = 'Pausar'
      this.tick()
    }
  }

  private tick(): void {
    if (!this.playing) {
      this.animFrame = 0
      return
    }

    try {
      const t = this.videoEl.currentTime
      const total = this.trackDuration

      const pct = Math.min(100, (t / total) * 100)
      document.querySelector<HTMLDivElement>('#rec-progress')!.style.width = `${pct}%`
      document.querySelector<HTMLDivElement>('#mix-progress')!.style.width = `${pct}%`

      const fmt = this.formatTime(Math.max(0, t))
      document.querySelector<HTMLSpanElement>('#rec-current-time')!.textContent = fmt
      document.querySelector<HTMLSpanElement>('#mix-current-time')!.textContent = fmt
      document.querySelector<HTMLSpanElement>('#rec-timer')!.textContent = fmt
      document.querySelector<HTMLSpanElement>('#mix-timer')!.textContent = fmt

      if (t >= total && this.recording) {
        this.onTrackEnd()
        return
      }
    } catch { /* tick */ }

    this.animFrame = requestAnimationFrame(() => this.tick())
  }

  private onMixProgressClick(e: MouseEvent): void {
    if (this.recording || !this.playing) return
    const bar = document.querySelector<HTMLDivElement>('#mix-progress-bar')
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const seekTime = pct * this.trackDuration

    this.videoEl.currentTime = seekTime
    this.audio.stopPlayback()
    if (seekTime < this.audio.getRecordingDuration()) {
      this.audio.playRecording(undefined, seekTime)
    }
    this.updateMixProgress(seekTime)
  }

  private updateMixProgress(t: number): void {
    const total = this.trackDuration
    const pct = Math.min(100, (t / total) * 100)
    document.querySelector<HTMLDivElement>('#mix-progress')!.style.width = `${pct}%`
    const fmt = this.formatTime(Math.max(0, t))
    document.querySelector<HTMLSpanElement>('#mix-current-time')!.textContent = fmt
    document.querySelector<HTMLSpanElement>('#mix-timer')!.textContent = fmt
  }

  private togglePlayback(): void {
    const btn = document.querySelector<HTMLButtonElement>('#playback-btn')!
    const stopBtn = document.querySelector<HTMLButtonElement>('#stop-mix-btn')!

    if (this.playing) {
      this.stopMixPlayback()
      return
    }

    if (!this.audio.hasRecording()) {
      this.showAlert('No hay grabación para escuchar', 'No se detectó voz grabada. La mezcla no tiene pista vocal para reproducir.', 'Haz clic en "Grabar de Nuevo" para intentar de nuevo, o exporta igual para obtener solo el audio del video.')
      return
    }

    this.playing = true
    this.videoEl.currentTime = 0
    this.videoEl.play()
    this.audio.playRecording(() => this.stopMixPlayback())

    btn.textContent = 'Escuchando...'
    btn.disabled = true
    stopBtn.classList.remove('hidden')
    this.tick()
  }

  private stopMixPlayback(): void {
    if (!this.playing && !this.paused) return
    this.playing = false
    this.paused = false
    cancelAnimationFrame(this.animFrame)
    this.animFrame = 0

    this.videoEl.pause()
    this.audio.stop()

    const btn = document.querySelector<HTMLButtonElement>('#playback-btn')!
    const stopBtn = document.querySelector<HTMLButtonElement>('#stop-mix-btn')!
    btn.textContent = 'Escuchar Mezcla'
    btn.disabled = false
    stopBtn.classList.add('hidden')

    document.querySelector<HTMLDivElement>('#mix-progress')!.style.width = '0%'
    document.querySelector<HTMLSpanElement>('#mix-current-time')!.textContent = '0:00'
    document.querySelector<HTMLSpanElement>('#mix-timer')!.textContent = '0:00'
  }

  private async export(): Promise<void> {
    const btn = document.querySelector<HTMLButtonElement>('#export-btn')!
    btn.disabled = true
    btn.textContent = 'Exportando...'

    try {
      btn.textContent = 'Procesando mezcla...'

      const hasAudio = this.audio.hasVideoAudio() || this.audio.hasRecording()
      if (!hasAudio) {
        throw new Error('No hay ningún audio para exportar. Graba tu voz primero.')
      }

      const blob = await this.audio.exportMix()

      const artist = this.selectedVideo?.artist || 'Desconocido'
      const song = this.selectedVideo?.song || 'grabacion'
      const timestamp = this.nowStr()
      const safeName = `${artist} - ${song} - ${timestamp}.wav`
      const sizeMB = (blob.size / 1024 / 1024).toFixed(1)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = safeName
      a.click()
      URL.revokeObjectURL(url)

      this.showAlert(
        'Exportación completada',
        `Archivo: ${safeName} (${sizeMB} MB)`,
        'La mezcla se descargó automáticamente. Si no aparece, revisa la carpeta de descargas de tu navegador.'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      this.showAlert('Error al exportar la mezcla', msg, 'Verifica que hayas grabado tu voz y que el video tenga audio. Si el problema persiste, intenta con otro video.')
    }

    btn.disabled = false
    btn.textContent = 'Exportar WAV'
  }
}

new VideoKaraokeApp()
