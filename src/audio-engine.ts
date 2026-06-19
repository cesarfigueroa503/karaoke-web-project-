export class AudioEngine {
  private ctx: AudioContext | null = null
  private videoAudioBuffer: AudioBuffer | null = null
  private recordedBuffer: AudioBuffer | null = null

  private recordingSource: AudioBufferSourceNode | null = null
  private vocalsGain: GainNode | null = null

  private eqLow: BiquadFilterNode | null = null
  private eqMid: BiquadFilterNode | null = null
  private eqHigh: BiquadFilterNode | null = null

  private delayNode: DelayNode | null = null
  private delayFeedback: GainNode | null = null

  private convolver: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private dryGain: GainNode | null = null
  private wetGain: GainNode | null = null

  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private micStream: MediaStream | null = null
  private recordedBlob: Blob | null = null
  private micSource: MediaStreamAudioSourceNode | null = null
  private _monitoringEnabled: boolean = true

  private videoRecorder: MediaRecorder | null = null
  private recordedVideoChunks: Blob[] = []

  private _duration: number = 0
  _trackVolume: number = 0.7
  private monitorGain: GainNode | null = null

  hasRecording(): boolean {
    return this.recordedBuffer !== null
  }

  hasVideoAudio(): boolean {
    return this.videoAudioBuffer !== null
  }

  getDuration(): number {
    return this._duration
  }

  getVideoDuration(): number {
    return this.videoAudioBuffer?.duration ?? 0
  }

  getRecordingDuration(): number {
    return this.recordedBuffer?.duration ?? 0
  }

  async init(): Promise<void> {
    if (this.ctx) await this.ctx.close()
    this.ctx = new AudioContext()

    this.vocalsGain = this.ctx.createGain()
    this.vocalsGain.gain.value = 1

    this.eqLow = this.ctx.createBiquadFilter()
    this.eqLow.type = 'lowshelf'
    this.eqLow.frequency.value = 150
    this.eqLow.gain.value = 0

    this.eqMid = this.ctx.createBiquadFilter()
    this.eqMid.type = 'peaking'
    this.eqMid.frequency.value = 2500
    this.eqMid.Q.value = 1
    this.eqMid.gain.value = 0

    this.eqHigh = this.ctx.createBiquadFilter()
    this.eqHigh.type = 'highshelf'
    this.eqHigh.frequency.value = 8000
    this.eqHigh.gain.value = 0

    this.delayNode = this.ctx.createDelay(1)
    this.delayNode.delayTime.value = 0.3

    this.delayFeedback = this.ctx.createGain()
    this.delayFeedback.gain.value = 0.3

    this.convolver = this.ctx.createConvolver()
    this.convolver.buffer = this.createReverbImpulseResponse(2, 2, this.ctx.sampleRate, this.ctx)

    this.dryGain = this.ctx.createGain()
    this.dryGain.gain.value = 1
    this.wetGain = this.ctx.createGain()
    this.wetGain.gain.value = 0.3

    this.reverbGain = this.ctx.createGain()
    this.reverbGain.gain.value = 0.7

    this.wireEffectsChain()
    this.videoAudioBuffer = null
  }

  private wireEffectsChain(): void {
    if (!this.ctx) return

    this.eqLow!.connect(this.eqMid!)
    this.eqMid!.connect(this.eqHigh!)
    this.eqHigh!.connect(this.dryGain!)
    this.eqHigh!.connect(this.delayNode!)
    this.delayNode!.connect(this.delayFeedback!)
    this.delayFeedback!.connect(this.delayNode!)
    this.delayNode!.connect(this.convolver!)
    this.convolver!.connect(this.reverbGain!)
    this.reverbGain!.connect(this.wetGain!)
    this.dryGain!.connect(this.vocalsGain!)
    this.wetGain!.connect(this.vocalsGain!)
    this.vocalsGain!.connect(this.ctx.destination)
  }

  private createReverbImpulseResponse(duration: number, decay: number, sampleRate: number, ctx?: AudioContext | OfflineAudioContext): AudioBuffer {
    const length = sampleRate * duration
    const audioContext = ctx ?? this.ctx
    if (!audioContext) throw new Error('No AudioContext available')
    const impulse = audioContext.createBuffer(2, length, sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)
    for (let i = 0; i < length; i++) {
      const percent = i / length
      const rand = Math.random() * 2 - 1
      const val = rand * Math.pow(1 - percent, decay)
      left[i] = val
      right[i] = val
    }
    return impulse
  }

  async requestMic(): Promise<MediaStream> {
    if (!this.ctx) throw new Error('AudioContext not initialized')

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      } as MediaTrackConstraints,
    })

    this.micSource = this.ctx.createMediaStreamSource(this.micStream)
    this.monitorGain = this.ctx.createGain()
    this.monitorGain.gain.value = 1
    this.monitorGain.connect(this.eqLow!)
    if (this._monitoringEnabled) {
      this.micSource.connect(this.monitorGain)
    }

    this.mediaRecorder = new MediaRecorder(this.micStream)
    this.recordedChunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data)
      }
    }

    return this.micStream
  }

  setMonitoring(enabled: boolean): void {
    this._monitoringEnabled = enabled
    if (!this.micSource || !this.ctx) return
    try { this.micSource.disconnect() } catch {}
    if (enabled && this.monitorGain) {
      this.micSource.connect(this.monitorGain)
    }
  }

  isMonitoring(): boolean {
    return this._monitoringEnabled
  }

  setMonitorVolume(value: number): void {
    if (this.monitorGain) this.monitorGain.gain.value = value
  }

  startVideoCapture(videoEl: HTMLVideoElement): void {
    const stream = (videoEl as any).captureStream()
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return

    const audioStream = new MediaStream(audioTracks)
    this.videoRecorder = new MediaRecorder(audioStream)
    this.recordedVideoChunks = []

    this.videoRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedVideoChunks.push(event.data)
      }
    }

    this.videoRecorder.start()
  }

  startCapture(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'recording') return
    this.recordedChunks = []
    this.mediaRecorder.start()
  }

  async stopRecording(): Promise<void> {
    const promises: Promise<void>[] = []

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      promises.push(new Promise<void>((resolve) => {
        this.mediaRecorder!.onstop = async () => {
          try {
            this.recordedBlob = new Blob(this.recordedChunks, { type: 'audio/webm' })
            const buffer = await this.recordedBlob!.arrayBuffer()
            this.recordedBuffer = await this.ctx!.decodeAudioData(buffer)
            this._duration = this.recordedBuffer.duration
          } catch (err) {
            console.error('Error processing mic recording:', err)
            this.recordedBuffer = null
          } finally {
            resolve()
          }
        }
        try { this.mediaRecorder!.stop() } catch { resolve() }
      }))
    }

    if (this.videoRecorder && this.videoRecorder.state === 'recording') {
      promises.push(new Promise<void>((resolve) => {
        this.videoRecorder!.onstop = async () => {
          try {
            const blob = new Blob(this.recordedVideoChunks, { type: 'audio/webm' })
            const buffer = await blob.arrayBuffer()
            this.videoAudioBuffer = await this.ctx!.decodeAudioData(buffer)
            console.log(`Video audio captured: ${this.videoAudioBuffer.duration.toFixed(1)}s`)
          } catch (err) {
            console.error('Error processing video audio:', err)
            this.videoAudioBuffer = null
          } finally {
            resolve()
          }
        }
        this.videoRecorder!.stop()
      }))
    }

    await Promise.all(promises)
  }

  clearRecording(): void {
    this.recordedBuffer = null
    this.videoAudioBuffer = null
    this.recordedChunks = []
    this.recordedVideoChunks = []
    this.recordedBlob = null
    this._duration = 0

    if (this.videoRecorder && this.videoRecorder.state === 'recording') {
      try { this.videoRecorder.stop() } catch {}
    }
    this.videoRecorder = null

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try { this.mediaRecorder.stop() } catch {}
    }
    this.mediaRecorder = null
    this.recordedChunks = []
  }

  resetMicRecorder(): void {
    if (!this.micStream) return
    this.mediaRecorder = new MediaRecorder(this.micStream)
    this.recordedChunks = []
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data)
    }
  }

  releaseMic(): void {
    if (this.micSource) {
      try { this.micSource.disconnect() } catch {}
      this.micSource = null
    }
    this.monitorGain = null
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop())
      this.micStream = null
    }
    this.mediaRecorder = null
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  playRecording(onEnded?: () => void, offset?: number): void {
    if (!this.ctx || !this.recordedBuffer) return
    this.stopPlayback()

    this.recordingSource = this.ctx.createBufferSource()
    this.recordingSource.buffer = this.recordedBuffer

    const safeOffset = Math.min(offset ?? 0, this.recordedBuffer.duration)
    this.recordingSource.connect(this.eqLow!)
    this.recordingSource.start(this.ctx.currentTime, safeOffset)

    this.recordingSource.onended = () => {
      this.recordingSource?.disconnect()
      this.recordingSource = null
      onEnded?.()
    }
  }

  stopPlayback(): void {
    if (this.recordingSource) {
      this.recordingSource.onended = null
      try { this.recordingSource.stop() } catch {}
      try { this.recordingSource.disconnect() } catch {}
      this.recordingSource = null
    }
  }

  stop(): void {
    this.stopPlayback()
  }

  setVocalsVolume(value: number): void {
    if (this.vocalsGain) this.vocalsGain.gain.value = value
  }

  setEqLow(value: number): void {
    if (this.eqLow) this.eqLow.gain.value = value
  }

  setEqMid(value: number): void {
    if (this.eqMid) this.eqMid.gain.value = value
  }

  setEqHigh(value: number): void {
    if (this.eqHigh) this.eqHigh.gain.value = value
  }

  setDelayTime(value: number): void {
    if (this.delayNode) this.delayNode.delayTime.value = value
  }

  setDelayFeedback(value: number): void {
    if (this.delayFeedback) this.delayFeedback.gain.value = value
  }

  setReverbMix(value: number): void {
    if (this.wetGain) this.wetGain.gain.value = value
  }

  async exportMix(): Promise<Blob> {
    const track = this.videoAudioBuffer
    if (!this.recordedBuffer && !track) throw new Error('No hay audio para exportar')

    const sr = this.ctx?.sampleRate ?? 44100
    const duration = Math.max(
      track?.duration ?? 0,
      this.recordedBuffer?.duration ?? 0
    )
    if (duration === 0) throw new Error('Duración inválida')
    const offlineCtx = new OfflineAudioContext(2, sr * duration, sr)

    if (track) {
      const trackGain = offlineCtx.createGain()
      trackGain.gain.value = this._trackVolume
      const trackSource = offlineCtx.createBufferSource()
      trackSource.buffer = track
      trackSource.connect(trackGain)
      trackGain.connect(offlineCtx.destination)
      trackSource.start(0)
    }

    if (this.recordedBuffer) {
      const eqLow = offlineCtx.createBiquadFilter()
      eqLow.type = 'lowshelf'
      eqLow.frequency.value = 150
      eqLow.gain.value = this.eqLow?.gain.value ?? 0

      const eqMid = offlineCtx.createBiquadFilter()
      eqMid.type = 'peaking'
      eqMid.frequency.value = 2500
      eqMid.Q.value = 1
      eqMid.gain.value = this.eqMid?.gain.value ?? 0

      const eqHigh = offlineCtx.createBiquadFilter()
      eqHigh.type = 'highshelf'
      eqHigh.frequency.value = 8000
      eqHigh.gain.value = this.eqHigh?.gain.value ?? 0

      const delayNode = offlineCtx.createDelay(1)
      delayNode.delayTime.value = this.delayNode?.delayTime.value ?? 0.3

      const delayFeedback = offlineCtx.createGain()
      delayFeedback.gain.value = this.delayFeedback?.gain.value ?? 0.3

      const convolver = offlineCtx.createConvolver()
      convolver.buffer = this.createReverbImpulseResponse(2, 2, sr, offlineCtx)

      const dryGain = offlineCtx.createGain()
      dryGain.gain.value = 1

      const wetGain = offlineCtx.createGain()
      wetGain.gain.value = this.wetGain?.gain.value ?? 0.3

      const reverbGain = offlineCtx.createGain()
      reverbGain.gain.value = 0.7

      const vocalsGain = offlineCtx.createGain()
      vocalsGain.gain.value = this.vocalsGain?.gain.value ?? 1

      const vocalsSource = offlineCtx.createBufferSource()
      vocalsSource.buffer = this.recordedBuffer

      eqLow.connect(eqMid)
      eqMid.connect(eqHigh)
      eqHigh.connect(dryGain)
      eqHigh.connect(delayNode)
      delayNode.connect(delayFeedback)
      delayFeedback.connect(delayNode)
      delayNode.connect(convolver)
      convolver.connect(reverbGain)
      reverbGain.connect(wetGain)
      dryGain.connect(vocalsGain)
      wetGain.connect(vocalsGain)
      vocalsGain.connect(offlineCtx.destination)

      vocalsSource.connect(eqLow)
      vocalsSource.start(0)
    }

    const renderedBuffer = await offlineCtx.startRendering()
    return this.audioBufferToWav(renderedBuffer)
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numChannels * bytesPerSample
    const samples = buffer.length
    const dataSize = samples * blockAlign
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const arrayBuffer = new ArrayBuffer(totalSize)
    const view = new DataView(arrayBuffer)

    const w = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i))
    }

    w(0, 'RIFF')
    view.setUint32(4, totalSize - 8, true)
    w(8, 'WAVE')
    w(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    w(36, 'data')
    view.setUint32(40, dataSize, true)

    const channels: Float32Array[] = []
    for (let i = 0; i < numChannels; i++)
      channels.push(buffer.getChannelData(i))

    let offset = 44
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const s = Math.max(-1, Math.min(1, channels[ch][i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }
}
