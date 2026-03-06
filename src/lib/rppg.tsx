/**
 * CL-BEDS rPPG (Remote PhotoPlethysmoGraphy) Camera Module
 *
 * Extracts heart rate from the front-facing camera by analysing subtle
 * colour changes in the forehead/cheek region caused by blood flow.
 *
 * Algorithm:
 *   1. Capture video frames from getUserMedia (front camera on mobile)
 *   2. Sample a region of interest (ROI) from the center of the frame
 *   3. Extract the green channel average (most sensitive to blood volume)
 *   4. Apply a bandpass filter (0.7–3.5 Hz → 42–210 BPM)
 *   5. Detect peaks in the filtered signal → instantaneous HR
 *   6. Compute SDNN (HRV) from RR intervals
 *   7. Emit RPPGMetric objects at ~5 second intervals
 *
 * Works on:
 *   - Chrome / Edge (desktop + Android)
 *   - Safari 14.1+ (iOS 14.5+)
 *   - Android Studio WebView with camera permission
 *
 * No external dependencies. Pure Web APIs only.
 */

import type { RPPGMetric } from './websocket'

// ─── Constants ────────────────────────────────────────────────────────────

const SAMPLE_RATE_HZ     = 30          // target frame rate
const BUFFER_SECONDS     = 10          // seconds of signal to keep
const BUFFER_SIZE        = SAMPLE_RATE_HZ * BUFFER_SECONDS  // 300 samples
const ROI_FRACTION       = 0.25        // center 25% of frame as ROI
const LOW_CUTOFF_HZ      = 0.7         // 42 BPM minimum
const HIGH_CUTOFF_HZ     = 3.5         // 210 BPM maximum
const EMIT_INTERVAL_MS   = 5_000       // emit a metric every 5 seconds
const MIN_SIGNAL_SAMPLES = 60          // need at least 2 seconds before estimating

// ─── Types ────────────────────────────────────────────────────────────────

export type RPPGStatus =
  | 'idle'
  | 'requesting_permission'
  | 'active'
  | 'error'
  | 'unsupported'

export interface RPPGReading {
  bpm: number
  hrv_sdnn: number
  hrv_rmssd: number
  signal_quality: number   // 0–1
  raw_signal: number[]     // last N green channel values (for debug)
}

type RPPGCallback = (metric: RPPGMetric) => void
type StatusCallback = (status: RPPGStatus, message?: string) => void

// ─── Butterworth bandpass filter (2nd order, IIR) ─────────────────────────

/**
 * Design a simple 2nd-order IIR bandpass filter using bilinear transform.
 * Returns { b, a } coefficients for difference equation:
 *   y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 */
function designBandpass(lowHz: number, highHz: number, fsHz: number) {
  const nyq  = fsHz / 2
  const low  = lowHz  / nyq
  const high = highHz / nyq

  // Warped frequencies for bilinear transform
  const wl = Math.tan(Math.PI * low)
  const wh = Math.tan(Math.PI * high)
  const bw = wh - wl
  const wn = Math.sqrt(wl * wh)

  // Normalised bandpass → 2nd order
  const q  = wn / bw
  const k  = 1 / (1 + wn / q + wn * wn)

  const b0 =  k * wn / q
  const b1 =  0
  const b2 = -k * wn / q
  const a1 = k * 2 * (wn * wn - 1)
  const a2 = k * (1 - wn / q + wn * wn)

  return { b: [b0, b1, b2], a: [1, a1, a2] }
}

function applyIIR(
  signal: number[],
  b: number[],
  a: number[],
): number[] {
  const y = new Array(signal.length).fill(0)
  for (let n = 0; n < signal.length; n++) {
    y[n] =
      b[0] * signal[n] +
      (n >= 1 ? b[1] * signal[n - 1] - a[1] * y[n - 1] : 0) +
      (n >= 2 ? b[2] * signal[n - 2] - a[2] * y[n - 2] : 0)
  }
  return y
}

// ─── Peak detection ───────────────────────────────────────────────────────

function detectPeaks(signal: number[], minDistanceSamples = 15): number[] {
  const peaks: number[] = []
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistanceSamples) {
        peaks.push(i)
      }
    }
  }
  return peaks
}

// ─── HRV computation ─────────────────────────────────────────────────────

function computeHRV(rrIntervalsMs: number[]): { sdnn: number; rmssd: number } {
  if (rrIntervalsMs.length < 2) return { sdnn: 0, rmssd: 0 }

  const mean = rrIntervalsMs.reduce((a, b) => a + b, 0) / rrIntervalsMs.length
  const variance = rrIntervalsMs.reduce((acc, v) => acc + (v - mean) ** 2, 0) / rrIntervalsMs.length
  const sdnn = Math.sqrt(variance)

  const succDiffs = rrIntervalsMs.slice(1).map((v, i) => (v - rrIntervalsMs[i]) ** 2)
  const rmssd = Math.sqrt(succDiffs.reduce((a, b) => a + b, 0) / succDiffs.length)

  return { sdnn: Math.round(sdnn * 10) / 10, rmssd: Math.round(rmssd * 10) / 10 }
}

// ─── Signal quality estimator ─────────────────────────────────────────────

function estimateSignalQuality(signal: number[]): number {
  if (signal.length < 10) return 0
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length
  const variance = signal.reduce((acc, v) => acc + (v - mean) ** 2, 0) / signal.length
  const snr = mean / (Math.sqrt(variance) + 1e-6)
  // Good rPPG signals: mean ≈ 100–200 (8-bit green channel), moderate variance
  const normalised = Math.min(snr / 50, 1.0)
  return Math.round(normalised * 100) / 100
}

// ─── Main rPPG Processor class ────────────────────────────────────────────

export class RPPGProcessor {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private stream: MediaStream | null = null
  private animFrameId: number | null = null
  private emitTimer: ReturnType<typeof setInterval> | null = null

  private greenBuffer: number[] = []
  private frameTimestamps: number[] = []
  private lastFrameTime = 0

  private onMetric: RPPGCallback
  private onStatus: StatusCallback

  private _status: RPPGStatus = 'idle'
  private filter = designBandpass(LOW_CUTOFF_HZ, HIGH_CUTOFF_HZ, SAMPLE_RATE_HZ)

  constructor(onMetric: RPPGCallback, onStatus: StatusCallback) {
    this.onMetric = onMetric
    this.onStatus = onStatus
  }

  // ── Public API ──────────────────────────────────────────────────────────

  get status(): RPPGStatus { return this._status }

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this._setStatus('unsupported', 'Camera API not available in this browser')
      return
    }

    this._setStatus('requesting_permission')

    try {
      // Prefer front camera on mobile, fall back to any camera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',       // front camera
          width:  { ideal: 320 },   // low res is fine – we only need colour
          height: { ideal: 240 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        this._setStatus('error', 'Camera permission denied. Please allow camera access.')
      } else if (msg.includes('NotFoundError')) {
        this._setStatus('error', 'No camera found on this device.')
      } else {
        this._setStatus('error', `Camera error: ${msg}`)
      }
      return
    }

    // Set up hidden video element
    this.video = document.createElement('video')
    this.video.srcObject = this.stream
    this.video.playsInline = true
    this.video.muted = true
    this.video.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;'
    document.body.appendChild(this.video)
    await this.video.play()

    // Off-screen canvas for pixel sampling
    this.canvas = document.createElement('canvas')
    this.canvas.width  = 64   // we only need a small ROI
    this.canvas.height = 64
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!

    this._setStatus('active')
    this._startCapture()
    this._startEmitTimer()
  }

  stop(): void {
    // Stop animation frame
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }

    // Stop emit timer
    if (this.emitTimer !== null) {
      clearInterval(this.emitTimer)
      this.emitTimer = null
    }

    // Stop camera stream
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null

    // Remove hidden video
    if (this.video && document.body.contains(this.video)) {
      document.body.removeChild(this.video)
    }
    this.video = null

    this.greenBuffer = []
    this.frameTimestamps = []
    this._setStatus('idle')
  }

  // ── Internal capture loop ────────────────────────────────────────────────

  private _startCapture(): void {
    const capture = (now: number) => {
      if (this._status !== 'active') return

      // Throttle to ~30 fps
      if (now - this.lastFrameTime >= 1000 / SAMPLE_RATE_HZ) {
        this.lastFrameTime = now
        this._sampleFrame()
      }

      this.animFrameId = requestAnimationFrame(capture)
    }
    this.animFrameId = requestAnimationFrame(capture)
  }

  private _sampleFrame(): void {
    if (!this.video || !this.ctx || !this.canvas) return
    if (this.video.readyState < 2) return   // video not ready yet

    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    if (vw === 0 || vh === 0) return

    // Sample the center ROI
    const roiW = Math.floor(vw * ROI_FRACTION)
    const roiH = Math.floor(vh * ROI_FRACTION)
    const roiX = Math.floor((vw - roiW) / 2)
    const roiY = Math.floor((vh - roiH) / 2)

    // Draw ROI to tiny canvas
    this.ctx.drawImage(
      this.video,
      roiX, roiY, roiW, roiH,   // source
      0, 0, 64, 64,              // dest
    )

    // Extract pixel data and compute mean green channel
    const imageData = this.ctx.getImageData(0, 0, 64, 64)
    const data = imageData.data   // RGBA flat array
    let greenSum = 0
    const pixelCount = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      greenSum += data[i + 1]   // index 1 = green channel
    }
    const greenMean = greenSum / pixelCount

    // Push to rolling buffer
    this.greenBuffer.push(greenMean)
    this.frameTimestamps.push(Date.now())

    if (this.greenBuffer.length > BUFFER_SIZE) {
      this.greenBuffer.shift()
      this.frameTimestamps.shift()
    }
  }

  // ── Emit timer: compute and dispatch BPM every 5 seconds ─────────────────

  private _startEmitTimer(): void {
    this.emitTimer = setInterval(() => {
      const metric = this._computeMetric()
      if (metric) this.onMetric(metric)
    }, EMIT_INTERVAL_MS)
  }

  private _computeMetric(): RPPGMetric | null {
    if (this.greenBuffer.length < MIN_SIGNAL_SAMPLES) return null

    // Detrend: subtract moving average to remove slow drift
    const windowSize = 30
    const detrended = this.greenBuffer.map((v, i) => {
      const start = Math.max(0, i - windowSize)
      const slice = this.greenBuffer.slice(start, i + 1)
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length
      return v - avg
    })

    // Apply bandpass filter
    const filtered = applyIIR(detrended, this.filter.b, this.filter.a)

    // Detect peaks
    const minPeakDistance = Math.floor(SAMPLE_RATE_HZ * 0.4)  // min 0.4s between beats
    const peaks = detectPeaks(filtered, minPeakDistance)

    if (peaks.length < 3) return null

    // Compute BPM from peak intervals
    const intervals: number[] = []
    for (let i = 1; i < peaks.length; i++) {
      const dtSamples = peaks[i] - peaks[i - 1]
      const dtMs = (dtSamples / SAMPLE_RATE_HZ) * 1000
      if (dtMs > 300 && dtMs < 1500) {   // valid RR: 40–200 BPM
        intervals.push(dtMs)
      }
    }

    if (intervals.length < 2) return null

    const meanRR = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const bpm = Math.round(60_000 / meanRR)

    if (bpm < 40 || bpm > 200) return null   // sanity check

    const { sdnn, rmssd } = computeHRV(intervals)
    const quality = estimateSignalQuality(this.greenBuffer.slice(-60))

    return {
      timestamp:     Date.now(),
      bpm,
      hrv_sdnn:      sdnn,
      hrv_rmssd:     rmssd,
      signal_quality: quality,
    }
  }

  // ── Helper ───────────────────────────────────────────────────────────────

  private _setStatus(s: RPPGStatus, message?: string): void {
    this._status = s
    this.onStatus(s, message)
  }
}

// ─── React hook ───────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseRPPGOptions {
  enabled: boolean
  onMetric: RPPGCallback
}

export function useRPPG({ enabled, onMetric }: UseRPPGOptions) {
  const processorRef = useRef<RPPGProcessor | null>(null)
  const [status, setStatus]     = useState<RPPGStatus>('idle')
  const [statusMsg, setStatusMsg] = useState<string>('')
  const [latestBPM, setLatestBPM] = useState<number | null>(null)
  const [signalQuality, setSignalQuality] = useState<number>(0)

  const handleMetric = useCallback((metric: RPPGMetric) => {
    setLatestBPM(metric.bpm)
    setSignalQuality(metric.signal_quality ?? 0)
    onMetric(metric)
  }, [onMetric])

  const handleStatus = useCallback((s: RPPGStatus, msg?: string) => {
    setStatus(s)
    setStatusMsg(msg ?? '')
  }, [])

  useEffect(() => {
    if (enabled) {
      const proc = new RPPGProcessor(handleMetric, handleStatus)
      processorRef.current = proc
      proc.start()
    } else {
      processorRef.current?.stop()
      processorRef.current = null
      setStatus('idle')
      setLatestBPM(null)
    }

    return () => {
      processorRef.current?.stop()
      processorRef.current = null
    }
  }, [enabled, handleMetric, handleStatus])

  return { status, statusMsg, latestBPM, signalQuality }
}
