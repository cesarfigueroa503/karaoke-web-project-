(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{ctx=null;videoAudioBuffer=null;recordedBuffer=null;recordingSource=null;vocalsGain=null;eqLow=null;eqMid=null;eqHigh=null;delayNode=null;delayFeedback=null;convolver=null;reverbGain=null;dryGain=null;wetGain=null;mediaRecorder=null;recordedChunks=[];micStream=null;recordedBlob=null;micSource=null;_monitoringEnabled=!0;videoRecorder=null;recordedVideoChunks=[];_duration=0;_trackVolume=.7;monitorGain=null;hasRecording(){return this.recordedBuffer!==null}hasVideoAudio(){return this.videoAudioBuffer!==null}getDuration(){return this._duration}getVideoDuration(){return this.videoAudioBuffer?.duration??0}getRecordingDuration(){return this.recordedBuffer?.duration??0}async init(){this.ctx&&await this.ctx.close(),this.ctx=new AudioContext,this.vocalsGain=this.ctx.createGain(),this.vocalsGain.gain.value=1,this.eqLow=this.ctx.createBiquadFilter(),this.eqLow.type=`lowshelf`,this.eqLow.frequency.value=150,this.eqLow.gain.value=0,this.eqMid=this.ctx.createBiquadFilter(),this.eqMid.type=`peaking`,this.eqMid.frequency.value=2500,this.eqMid.Q.value=1,this.eqMid.gain.value=0,this.eqHigh=this.ctx.createBiquadFilter(),this.eqHigh.type=`highshelf`,this.eqHigh.frequency.value=8e3,this.eqHigh.gain.value=0,this.delayNode=this.ctx.createDelay(1),this.delayNode.delayTime.value=.3,this.delayFeedback=this.ctx.createGain(),this.delayFeedback.gain.value=.3,this.convolver=this.ctx.createConvolver(),this.convolver.buffer=this.createReverbImpulseResponse(2,2,this.ctx.sampleRate,this.ctx),this.dryGain=this.ctx.createGain(),this.dryGain.gain.value=1,this.wetGain=this.ctx.createGain(),this.wetGain.gain.value=.3,this.reverbGain=this.ctx.createGain(),this.reverbGain.gain.value=.7,this.wireEffectsChain(),this.videoAudioBuffer=null}wireEffectsChain(){this.ctx&&(this.eqLow.connect(this.eqMid),this.eqMid.connect(this.eqHigh),this.eqHigh.connect(this.dryGain),this.eqHigh.connect(this.delayNode),this.delayNode.connect(this.delayFeedback),this.delayFeedback.connect(this.delayNode),this.delayNode.connect(this.convolver),this.convolver.connect(this.reverbGain),this.reverbGain.connect(this.wetGain),this.dryGain.connect(this.vocalsGain),this.wetGain.connect(this.vocalsGain),this.vocalsGain.connect(this.ctx.destination))}createReverbImpulseResponse(e,t,n,r){let i=n*e,a=r??this.ctx;if(!a)throw Error(`No AudioContext available`);let o=a.createBuffer(2,i,n),s=o.getChannelData(0),c=o.getChannelData(1);for(let e=0;e<i;e++){let n=e/i,r=(Math.random()*2-1)*(1-n)**t;s[e]=r,c[e]=r}return o}async requestMic(){if(!this.ctx)throw Error(`AudioContext not initialized`);return this.micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!1,noiseSuppression:!1,autoGainControl:!1}}),this.micSource=this.ctx.createMediaStreamSource(this.micStream),this.monitorGain=this.ctx.createGain(),this.monitorGain.gain.value=1,this.monitorGain.connect(this.eqLow),this._monitoringEnabled&&this.micSource.connect(this.monitorGain),this.mediaRecorder=new MediaRecorder(this.micStream),this.recordedChunks=[],this.mediaRecorder.ondataavailable=e=>{e.data.size>0&&this.recordedChunks.push(e.data)},this.micStream}setMonitoring(e){if(this._monitoringEnabled=e,!(!this.micSource||!this.ctx)){try{this.micSource.disconnect()}catch{}e&&this.monitorGain&&this.micSource.connect(this.monitorGain)}}isMonitoring(){return this._monitoringEnabled}setMonitorVolume(e){this.monitorGain&&(this.monitorGain.gain.value=e)}startVideoCapture(e){let t=e.captureStream().getAudioTracks();if(t.length===0)return;let n=new MediaStream(t);this.videoRecorder=new MediaRecorder(n),this.recordedVideoChunks=[],this.videoRecorder.ondataavailable=e=>{e.data.size>0&&this.recordedVideoChunks.push(e.data)},this.videoRecorder.start()}startCapture(){!this.mediaRecorder||this.mediaRecorder.state===`recording`||(this.recordedChunks=[],this.mediaRecorder.start())}async stopRecording(){let e=[];this.mediaRecorder&&this.mediaRecorder.state===`recording`&&e.push(new Promise(e=>{this.mediaRecorder.onstop=async()=>{try{this.recordedBlob=new Blob(this.recordedChunks,{type:`audio/webm`});let e=await this.recordedBlob.arrayBuffer();this.recordedBuffer=await this.ctx.decodeAudioData(e),this._duration=this.recordedBuffer.duration}catch(e){console.error(`Error processing mic recording:`,e),this.recordedBuffer=null}finally{e()}};try{this.mediaRecorder.stop()}catch{e()}})),this.videoRecorder&&this.videoRecorder.state===`recording`&&e.push(new Promise(e=>{this.videoRecorder.onstop=async()=>{try{let e=await new Blob(this.recordedVideoChunks,{type:`audio/webm`}).arrayBuffer();this.videoAudioBuffer=await this.ctx.decodeAudioData(e),console.log(`Video audio captured: ${this.videoAudioBuffer.duration.toFixed(1)}s`)}catch(e){console.error(`Error processing video audio:`,e),this.videoAudioBuffer=null}finally{e()}},this.videoRecorder.stop()})),await Promise.all(e)}clearRecording(){if(this.recordedBuffer=null,this.videoAudioBuffer=null,this.recordedChunks=[],this.recordedVideoChunks=[],this.recordedBlob=null,this._duration=0,this.videoRecorder&&this.videoRecorder.state===`recording`)try{this.videoRecorder.stop()}catch{}if(this.videoRecorder=null,this.mediaRecorder&&this.mediaRecorder.state===`recording`)try{this.mediaRecorder.stop()}catch{}this.mediaRecorder=null,this.recordedChunks=[]}resetMicRecorder(){this.micStream&&(this.mediaRecorder=new MediaRecorder(this.micStream),this.recordedChunks=[],this.mediaRecorder.ondataavailable=e=>{e.data.size>0&&this.recordedChunks.push(e.data)})}releaseMic(){if(this.micSource){try{this.micSource.disconnect()}catch{}this.micSource=null}this.monitorGain=null,this.micStream&&=(this.micStream.getTracks().forEach(e=>e.stop()),null),this.mediaRecorder=null}pauseRecording(){this.mediaRecorder?.state===`recording`&&this.mediaRecorder.pause()}resumeRecording(){this.mediaRecorder?.state===`paused`&&this.mediaRecorder.resume()}playRecording(e,t){if(!this.ctx||!this.recordedBuffer)return;this.stopPlayback(),this.recordingSource=this.ctx.createBufferSource(),this.recordingSource.buffer=this.recordedBuffer;let n=Math.min(t??0,this.recordedBuffer.duration);this.recordingSource.connect(this.eqLow),this.recordingSource.start(this.ctx.currentTime,n),this.recordingSource.onended=()=>{this.recordingSource?.disconnect(),this.recordingSource=null,e?.()}}stopPlayback(){if(this.recordingSource){this.recordingSource.onended=null;try{this.recordingSource.stop()}catch{}try{this.recordingSource.disconnect()}catch{}this.recordingSource=null}}stop(){this.stopPlayback()}setVocalsVolume(e){this.vocalsGain&&(this.vocalsGain.gain.value=e)}setEqLow(e){this.eqLow&&(this.eqLow.gain.value=e)}setEqMid(e){this.eqMid&&(this.eqMid.gain.value=e)}setEqHigh(e){this.eqHigh&&(this.eqHigh.gain.value=e)}setDelayTime(e){this.delayNode&&(this.delayNode.delayTime.value=e)}setDelayFeedback(e){this.delayFeedback&&(this.delayFeedback.gain.value=e)}setReverbMix(e){this.wetGain&&(this.wetGain.gain.value=e)}async exportMix(){let e=this.videoAudioBuffer;if(!this.recordedBuffer&&!e)throw Error(`No hay audio para exportar`);let t=this.ctx?.sampleRate??44100,n=Math.max(e?.duration??0,this.recordedBuffer?.duration??0);if(n===0)throw Error(`Duración inválida`);let r=new OfflineAudioContext(2,t*n,t);if(e){let t=r.createGain();t.gain.value=this._trackVolume;let n=r.createBufferSource();n.buffer=e,n.connect(t),t.connect(r.destination),n.start(0)}if(this.recordedBuffer){let e=r.createBiquadFilter();e.type=`lowshelf`,e.frequency.value=150,e.gain.value=this.eqLow?.gain.value??0;let n=r.createBiquadFilter();n.type=`peaking`,n.frequency.value=2500,n.Q.value=1,n.gain.value=this.eqMid?.gain.value??0;let i=r.createBiquadFilter();i.type=`highshelf`,i.frequency.value=8e3,i.gain.value=this.eqHigh?.gain.value??0;let a=r.createDelay(1);a.delayTime.value=this.delayNode?.delayTime.value??.3;let o=r.createGain();o.gain.value=this.delayFeedback?.gain.value??.3;let s=r.createConvolver();s.buffer=this.createReverbImpulseResponse(2,2,t,r);let c=r.createGain();c.gain.value=1;let l=r.createGain();l.gain.value=this.wetGain?.gain.value??.3;let u=r.createGain();u.gain.value=.7;let d=r.createGain();d.gain.value=this.vocalsGain?.gain.value??1;let f=r.createBufferSource();f.buffer=this.recordedBuffer,e.connect(n),n.connect(i),i.connect(c),i.connect(a),a.connect(o),o.connect(a),a.connect(s),s.connect(u),u.connect(l),c.connect(d),l.connect(d),d.connect(r.destination),f.connect(e),f.start(0)}let i=await r.startRendering();return this.audioBufferToWav(i)}audioBufferToWav(e){let t=e.numberOfChannels,n=e.sampleRate,r=16/8*t,i=e.length,a=i*r,o=44+a,s=new ArrayBuffer(o),c=new DataView(s),l=(e,t)=>{for(let n=0;n<t.length;n++)c.setUint8(e+n,t.charCodeAt(n))};l(0,`RIFF`),c.setUint32(4,o-8,!0),l(8,`WAVE`),l(12,`fmt `),c.setUint32(16,16,!0),c.setUint16(20,1,!0),c.setUint16(22,t,!0),c.setUint32(24,n,!0),c.setUint32(28,n*r,!0),c.setUint16(32,r,!0),c.setUint16(34,16,!0),l(36,`data`),c.setUint32(40,a,!0);let u=[];for(let n=0;n<t;n++)u.push(e.getChannelData(n));let d=44;for(let e=0;e<i;e++)for(let n=0;n<t;n++){let t=Math.max(-1,Math.min(1,u[n][e]));c.setInt16(d,t<0?t*32768:t*32767,!0),d+=2}return new Blob([s],{type:`audio/wav`})}};new class{audio=new e;videoEl;videoUrl=null;selectedVideo=null;playing=!1;recording=!1;paused=!1;animFrame=0;trackDuration=0;videos=[];currentStep=1;constructor(){this.render(),this.bind(),this.loadVideos()}esc(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}formatTime(e){return`${Math.floor(e/60)}:${Math.floor(e%60).toString().padStart(2,`0`)}`}nowStr(){let e=new Date,t=e=>e.toString().padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())} ${t(e.getHours())}-${t(e.getMinutes())}-${t(e.getSeconds())}`}render(){document.querySelector(`#app`).innerHTML=`
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
    `}bind(){let e=e=>document.querySelector(e);e(`#alert-close`).addEventListener(`click`,()=>this.dismissAlert()),e(`#show-upload-btn`).addEventListener(`click`,()=>{e(`#upload-form`).classList.toggle(`hidden`)}),e(`#upload-file`).addEventListener(`change`,()=>this.onUploadFileChange()),e(`#upload-submit-btn`).addEventListener(`click`,()=>this.uploadVideo()),e(`#back-from-step2-btn`).addEventListener(`click`,()=>this.goToStep(1)),e(`#back-to-library-btn`).addEventListener(`click`,()=>this.goToStep(1)),e(`#start-btn`).addEventListener(`click`,()=>this.start()),e(`#rec-track-volume`).addEventListener(`input`,e=>{let t=parseFloat(e.target.value);this.setVideoVolume(t),document.querySelector(`#rec-track-vol-value`).textContent=`${Math.round(t)}%`}),e(`#rec-monitor-volume`).addEventListener(`input`,e=>{let t=parseFloat(e.target.value);this.audio.setMonitorVolume(t/100),document.querySelector(`#rec-monitor-vol-value`).textContent=`${Math.round(t)}%`}),e(`#monitor-check`).addEventListener(`change`,e=>{this.audio.setMonitoring(e.target.checked)}),e(`#pause-btn`).addEventListener(`click`,()=>this.togglePause()),e(`#stop-btn`).addEventListener(`click`,()=>this.stopRecording()),e(`#track-volume`).addEventListener(`input`,e=>{let t=parseFloat(e.target.value);this.setVideoVolume(t),this.audio._trackVolume=t/100,document.querySelector(`#track-volume-value`).textContent=`${Math.round(t)}%`});let t=document.querySelector(`#mix-progress-bar`);t&&(t.style.cursor=`pointer`,t.addEventListener(`click`,e=>this.onMixProgressClick(e))),e(`#playback-btn`).addEventListener(`click`,()=>this.togglePlayback()),e(`#stop-mix-btn`).addEventListener(`click`,()=>this.stopMixPlayback()),e(`#export-btn`).addEventListener(`click`,()=>this.export()),e(`#restart-btn`).addEventListener(`click`,()=>this.restartRecording()),this.bindSliders()}bindSliders(){let e=[[`vocals-volume`,`vocals-volume-value`,e=>this.audio.setVocalsVolume(e),`pct`],[`eq-low`,`eq-low-value`,e=>this.audio.setEqLow(e),`db`],[`eq-mid`,`eq-mid-value`,e=>this.audio.setEqMid(e),`db`],[`eq-high`,`eq-high-value`,e=>this.audio.setEqHigh(e),`db`],[`delay-time`,`delay-time-value`,e=>this.audio.setDelayTime(e),`s`],[`delay-feedback`,`delay-feedback-value`,e=>this.audio.setDelayFeedback(e),`pct`],[`reverb-mix`,`reverb-mix-value`,e=>this.audio.setReverbMix(e),`pct`]];for(let[t,n,r,i]of e){let e=document.querySelector(`#${t}`),a=document.querySelector(`#${n}`);e.addEventListener(`input`,()=>{let t=parseFloat(e.value);r(t),i===`pct`?a.textContent=`${Math.round(t*100)}%`:i===`db`?a.textContent=`${t} dB`:i===`s`&&(a.textContent=`${t}s`)})}}setVideoVolume(e){this.videoEl&&(this.videoEl.volume=e/100)}showAlert(e,t,n){let r=document.querySelector(`#alert-box`);r.querySelector(`#alert-title`).textContent=e,r.querySelector(`#alert-detail`).textContent=t,r.querySelector(`#alert-help`).textContent=n,r.classList.remove(`hidden`),r.scrollIntoView({behavior:`smooth`,block:`center`})}dismissAlert(){document.querySelector(`#alert-box`).classList.add(`hidden`)}goToStep(e){let t=this.currentStep;this.currentStep=e,document.querySelectorAll(`.step-panel`).forEach(e=>e.classList.add(`hidden`)),document.querySelector(`#step-${e}-section`)?.classList.remove(`hidden`),this.updateStepsNav(),this.scrollToTop(),e===1&&(t===3||t===4)&&(this.audio.stop(),this.audio.releaseMic(),this.playing=!1,this.recording=!1,this.paused=!1,cancelAnimationFrame(this.animFrame),this.videoEl&&this.videoEl.pause()),this.dismissAlert()}updateStepsNav(){for(let e=1;e<=4;e++){let t=document.querySelector(`#step-${e}-circle`),n=document.querySelector(`#step-conn-${e}`);t.className=`step-circle`,e<this.currentStep?(t.classList.add(`done`),t.innerHTML=`&#10003;`,n?.classList.add(`done`)):e===this.currentStep?(t.classList.add(`active`),t.textContent=String(e),n?.classList.remove(`done`)):(t.textContent=String(e),n?.classList.remove(`done`))}}scrollToTop(){window.scrollTo({top:0,behavior:`smooth`})}isNetworkError(e){return e instanceof TypeError}async loadVideos(){let e=document.querySelector(`#video-list`);try{let e=await fetch(`/api/videos`);if(!e.ok)throw Error(`HTTP ${e.status}`);this.videos=await e.json(),this.renderVideoList()}catch(t){e.innerHTML=`
        <div class="server-error">
          <div class="server-error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p class="server-error-title">Servidor no disponible</p>
          <p class="server-error-detail">${this.isNetworkError(t)?`No se puede conectar con el servidor en el puerto 3001.`:`Error al cargar la videoteca.`}</p>
          <p class="server-error-help">Asegúrate de ejecutar <code>npm run server</code> en otra terminal y vuelve a cargar la página.</p>
          <button class="btn btn-secondary btn-sm" id="reload-btn">Reintentar</button>
        </div>
      `,document.querySelector(`#reload-btn`)?.addEventListener(`click`,()=>location.reload())}}renderVideoList(){let e=document.querySelector(`#video-list`);if(this.videos.length===0){e.innerHTML=`<p class="empty-hint">No hay videos en el servidor. Sube uno para empezar.</p>`;return}e.innerHTML=this.videos.map(e=>`
      <div class="video-card" data-filename="${this.esc(e.filename)}">
        <div class="video-card-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <div class="video-card-info">
          <div class="video-card-song">${this.esc(e.song)}</div>
          <div class="video-card-artist">${this.esc(e.artist)}</div>
        </div>
      </div>
    `).join(``),e.querySelectorAll(`.video-card`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-filename`);this.selectVideo(t)})})}selectVideo(e){let t=this.videos.find(t=>t.filename===e);t&&(this.selectedVideo=t,this.videoUrl=`/api/videos/${encodeURIComponent(t.filename)}`,document.querySelectorAll(`.video-card`).forEach(t=>{t.classList.toggle(`active`,t.getAttribute(`data-filename`)===e)}),document.querySelector(`#selected-song`).textContent=t.song,document.querySelector(`#selected-artist`).textContent=t.artist,this.goToStep(2))}onUploadFileChange(){let e=document.querySelector(`#upload-file`),t=document.querySelector(`#upload-file-label`),n=document.querySelector(`#upload-submit-btn`);document.querySelector(`#upload-status`).classList.add(`hidden`),e.files?.length?(t.textContent=e.files[0].name,n.disabled=!1):(t.textContent=`Seleccionar archivo`,n.disabled=!0)}async uploadVideo(){let e=document.querySelector(`#upload-file`),t=document.querySelector(`#upload-artist`),n=document.querySelector(`#upload-song`),r=document.querySelector(`#upload-submit-btn`),i=document.querySelector(`#upload-status`);if(!e.files?.length){this.showAlert(`Ningún archivo seleccionado`,`Debes elegir un archivo de video antes de subir.`,`Haz clic en "Seleccionar archivo" y elige un video de tu computadora.`);return}if(!t.value.trim()||!n.value.trim()){this.showAlert(`Campos incompletos`,`El artista y la canción son obligatorios para identificar el video.`,`Completa los campos "Artista" y "Canción" antes de subir.`);return}r.disabled=!0,r.textContent=`Subiendo...`,i.className=`upload-status info`,i.classList.remove(`hidden`),i.textContent=`Subiendo video...`;let a=new FormData;a.append(`video`,e.files[0]),a.append(`artist`,t.value.trim()),a.append(`song`,n.value.trim());try{let r=await fetch(`/api/videos/upload`,{method:`POST`,body:a}),o=await r.json();if(!r.ok)throw Error(o.error||`Error del servidor (${r.status})`);i.className=`upload-status ok`,i.textContent=`Video subido correctamente`,e.value=``,t.value=``,n.value=``,document.querySelector(`#upload-file-label`).textContent=`Seleccionar archivo`,await this.loadVideos()}catch(e){i.className=`upload-status error`,this.isNetworkError(e)?i.textContent=`Error de conexión: el servidor no responde. Asegúrate de que el servidor esté ejecutándose.`:i.textContent=`Error: ${e instanceof Error?e.message:`desconocido`}`}r.disabled=!1,r.textContent=`Subir`}setTrackStatus(e){let t=document.querySelector(`#track-status`);if(e===null){t.className=`track-status hidden`,t.textContent=``;return}t.className=e?`track-status ok`:`track-status error`,t.innerHTML=e?`Audio de video capturado ✓`:`El video no tiene pista de audio. La mezcla solo contendrá tu voz.`}async start(){if(!this.selectedVideo)return;if(!navigator.mediaDevices?.getUserMedia){this.showAlert(`Navegador no compatible`,`Tu navegador no soporta grabación de audio. Esta aplicación requiere la API getUserMedia.`,`Usa Chrome, Edge, Firefox o Safari en su versión más reciente.`);return}if(typeof MediaRecorder>`u`){this.showAlert(`Grabación no soportada`,`Tu navegador no soporta MediaRecorder, necesario para grabar tu voz.`,`Actualiza tu navegador a la versión más reciente (Chrome, Edge o Firefox).`);return}this.dismissAlert(),this.goToStep(3),await this.audio.init();try{await this.audio.requestMic()}catch(e){let t=e instanceof DOMException?e.name===`NotAllowedError`?`Permiso denegado. El navegador bloqueó el acceso al micrófono.`:e.name===`NotFoundError`?`No se encontró ningún micrófono. Conecta uno e intenta de nuevo.`:`Error del navegador: ${e.message}`:`No se pudo acceder al micrófono.`;this.showAlert(`Micrófono no disponible`,t,`Verifica que el micrófono esté conectado y concedé permiso cuando el navegador lo solicite. Si usas auriculares con micrófono, asegúrate de que estén seleccionados como dispositivo predeterminado.`),this.currentStep=2,document.querySelectorAll(`.step-panel`).forEach(e=>e.classList.add(`hidden`)),document.querySelector(`#step-2-section`)?.classList.remove(`hidden`),this.updateStepsNav(),this.scrollToTop();return}this.videoEl=document.querySelector(`#video-player`);let e=parseFloat(document.querySelector(`#rec-track-volume`)?.value??`70`);this.videoEl.volume=e/100,this.videoEl.src=this.videoUrl;let t=await new Promise(e=>{let t=()=>{r(),e(this.videoEl.duration)},n=()=>{r(),e(NaN)},r=()=>{this.videoEl.removeEventListener(`loadedmetadata`,t),this.videoEl.removeEventListener(`error`,n)};this.videoEl.addEventListener(`loadedmetadata`,t),this.videoEl.addEventListener(`error`,n),this.videoEl.readyState>=1&&(r(),e(this.videoEl.duration))});if(!t||t===1/0||isNaN(t)){let e=this.videoEl.error?`Error ${this.videoEl.error.code}: ${this.videoEl.error.message}`:`El video no tiene información de duración.`;this.showAlert(`Error al cargar el video`,e,`Verifica que el archivo exista en el servidor y sea un formato compatible (MP4, WebM, MKV).`),this.recording=!1,this.playing=!1;return}this.trackDuration=t,document.querySelector(`#rec-total-time`).textContent=this.formatTime(t),document.querySelector(`#mix-total-time`).textContent=this.formatTime(t),document.querySelector(`#rec-timer`).textContent=this.formatTime(0),document.querySelector(`#mix-timer`).textContent=this.formatTime(0),this.recording=!0,this.playing=!0,this.videoEl.currentTime=0;let n=parseFloat(document.querySelector(`#rec-monitor-volume`)?.value??`80`);this.audio.setMonitorVolume(n/100),this.audio.startVideoCapture(this.videoEl),this.audio.startCapture(),this.videoEl.play(),this.tick()}async onTrackEnd(){this.recording&&(this.recording=!1,this.playing=!1,this.paused=!1,cancelAnimationFrame(this.animFrame),await this.audio.stopRecording(),this.afterRecording())}async stopRecording(){this.recording&&(this.recording=!1,this.playing=!1,this.paused=!1,cancelAnimationFrame(this.animFrame),document.querySelector(`#rec-indicator`).classList.add(`hidden`),this.videoEl.pause(),this.audio.stop(),await this.audio.stopRecording(),this.afterRecording())}afterRecording(){this.audio.setMonitoring(!1),document.querySelector(`#rec-indicator`).classList.add(`hidden`),this.setTrackStatus(this.audio.hasVideoAudio());let e=this.audio.hasRecording();e||this.showAlert(`No se grabó tu voz`,`No se detectó audio de tu micrófono durante la grabación. La mezcla solo tendrá la pista del video.`,`Asegúrate de que el micrófono esté funcionando y no esté silenciado. Usa auriculares para evitar que el audio del video se grabe junto con tu voz.`),document.querySelector(`#playback-btn`).disabled=!e,document.querySelector(`#export-btn`).disabled=!1,document.querySelector(`#restart-btn`).classList.remove(`hidden`),document.querySelector(`#restart-btn`).textContent=`Grabar de Nuevo`,this.goToStep(4)}restartRecording(){this.dismissAlert(),this.audio.clearRecording(),this.paused=!1,this.setTrackStatus(null);let e=this.trackDuration;document.querySelector(`#rec-total-time`).textContent=this.formatTime(e),document.querySelector(`#mix-total-time`).textContent=this.formatTime(e),document.querySelector(`#rec-progress`).style.width=`0%`,document.querySelector(`#mix-progress`).style.width=`0%`,document.querySelector(`#rec-current-time`).textContent=`0:00`,document.querySelector(`#mix-current-time`).textContent=`0:00`,document.querySelector(`#rec-timer`).textContent=`0:00`,document.querySelector(`#mix-timer`).textContent=`0:00`,this.audio.stop(),this.audio.resetMicRecorder(),this.goToStep(3);let t=document.querySelector(`#monitor-check`)?.checked??!0;this.audio.setMonitoring(t),this.audio.setMonitorVolume(parseFloat(document.querySelector(`#rec-monitor-volume`)?.value??`80`)/100),document.querySelector(`#rec-indicator`).classList.remove(`hidden`),this.videoEl.currentTime=0,this.recording=!0,this.playing=!0,this.audio.startVideoCapture(this.videoEl),this.audio.startCapture(),this.videoEl.play(),this.tick()}togglePause(){let e=document.querySelector(`#pause-btn`),t=document.querySelector(`#rec-indicator`),n=document.querySelector(`#rec-indicator-text`);this.paused?(this.paused=!1,this.playing=!0,this.videoEl.play(),this.audio.resumeRecording(),t.classList.remove(`hidden`),n.textContent=`Grabando...`,e.textContent=`Pausar`,this.tick()):(this.paused=!0,this.playing=!1,cancelAnimationFrame(this.animFrame),this.videoEl.pause(),this.audio.pauseRecording(),t.classList.add(`hidden`),e.textContent=`Reanudar`)}tick(){if(!this.playing){this.animFrame=0;return}try{let e=this.videoEl.currentTime,t=this.trackDuration,n=Math.min(100,e/t*100);document.querySelector(`#rec-progress`).style.width=`${n}%`,document.querySelector(`#mix-progress`).style.width=`${n}%`;let r=this.formatTime(Math.max(0,e));if(document.querySelector(`#rec-current-time`).textContent=r,document.querySelector(`#mix-current-time`).textContent=r,document.querySelector(`#rec-timer`).textContent=r,document.querySelector(`#mix-timer`).textContent=r,e>=t&&this.recording){this.onTrackEnd();return}}catch{}this.animFrame=requestAnimationFrame(()=>this.tick())}onMixProgressClick(e){if(this.recording||!this.playing)return;let t=document.querySelector(`#mix-progress-bar`);if(!t)return;let n=t.getBoundingClientRect(),r=Math.max(0,Math.min(1,(e.clientX-n.left)/n.width))*this.trackDuration;this.videoEl.currentTime=r,this.audio.stopPlayback(),r<this.audio.getRecordingDuration()&&this.audio.playRecording(void 0,r),this.updateMixProgress(r)}updateMixProgress(e){let t=this.trackDuration,n=Math.min(100,e/t*100);document.querySelector(`#mix-progress`).style.width=`${n}%`;let r=this.formatTime(Math.max(0,e));document.querySelector(`#mix-current-time`).textContent=r,document.querySelector(`#mix-timer`).textContent=r}togglePlayback(){let e=document.querySelector(`#playback-btn`),t=document.querySelector(`#stop-mix-btn`);if(this.playing){this.stopMixPlayback();return}if(!this.audio.hasRecording()){this.showAlert(`No hay grabación para escuchar`,`No se detectó voz grabada. La mezcla no tiene pista vocal para reproducir.`,`Haz clic en "Grabar de Nuevo" para intentar de nuevo, o exporta igual para obtener solo el audio del video.`);return}this.playing=!0,this.videoEl.currentTime=0,this.videoEl.play(),this.audio.playRecording(()=>this.stopMixPlayback()),e.textContent=`Escuchando...`,e.disabled=!0,t.classList.remove(`hidden`),this.tick()}stopMixPlayback(){if(!this.playing&&!this.paused)return;this.playing=!1,this.paused=!1,cancelAnimationFrame(this.animFrame),this.animFrame=0,this.videoEl.pause(),this.audio.stop();let e=document.querySelector(`#playback-btn`),t=document.querySelector(`#stop-mix-btn`);e.textContent=`Escuchar Mezcla`,e.disabled=!1,t.classList.add(`hidden`),document.querySelector(`#mix-progress`).style.width=`0%`,document.querySelector(`#mix-current-time`).textContent=`0:00`,document.querySelector(`#mix-timer`).textContent=`0:00`}async export(){let e=document.querySelector(`#export-btn`);e.disabled=!0,e.textContent=`Exportando...`;try{if(e.textContent=`Procesando mezcla...`,!(this.audio.hasVideoAudio()||this.audio.hasRecording()))throw Error(`No hay ningún audio para exportar. Graba tu voz primero.`);let t=await this.audio.exportMix(),n=`${this.selectedVideo?.artist||`Desconocido`} - ${this.selectedVideo?.song||`grabacion`} - ${this.nowStr()}.wav`,r=(t.size/1024/1024).toFixed(1),i=URL.createObjectURL(t),a=document.createElement(`a`);a.href=i,a.download=n,a.click(),URL.revokeObjectURL(i),this.showAlert(`Exportación completada`,`Archivo: ${n} (${r} MB)`,`La mezcla se descargó automáticamente. Si no aparece, revisa la carpeta de descargas de tu navegador.`)}catch(e){let t=e instanceof Error?e.message:`Error desconocido`;this.showAlert(`Error al exportar la mezcla`,t,`Verifica que hayas grabado tu voz y que el video tenga audio. Si el problema persiste, intenta con otro video.`)}e.disabled=!1,e.textContent=`Exportar WAV`}};