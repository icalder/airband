import { reactive, toRefs } from 'vue'
import { Channel } from './channels'
import { Tuner } from '@/lib/Tuner'
import { SpyServer } from './spyserver'
import { SpectralPeakDetector } from '@/lib/dsp'

export class Scanner {
  private _state = reactive({
    scanning: false,
    target: undefined as undefined | Channel,
    peakDetectionThresholdDb: 2
  })

  private peakDetector: SpectralPeakDetector
  private measuringPeaks = false

  // eslint-disable-next-line no-useless-constructor
  constructor(private tuner: Tuner, spyServer: SpyServer) {
    this.peakDetector = new SpectralPeakDetector()
    spyServer.addFFTSamplesHandler(samples => {
      if (this.measuringPeaks) {
        this.peakDetector.addSamples(samples)
      }
    })
  }

  public async scan(channels: Channel[], bank: number[]) {
    const scanTargets: Channel[] = []
    bank.forEach((channelId) => {
      const channel = channels.find((ch) => ch.id === channelId)
      if (channel) {
        scanTargets.push(channel)
      }
    })
    if (scanTargets.length < 2) {
      return
    }

    let targetIdx = 0
    this._state.scanning = true
    while (this._state.scanning) {
      this._state.target = scanTargets[targetIdx]
      try {
        await this.tuner.tune(this._state.target.frequency)
      } catch (error) {
        this._state.scanning = false
        break
      }

      // Tuner has changed frequency - spend 150ms doing FFT peak detection
      this.peakDetector.reset()
      this.measuringPeaks = true
      await new Promise(resolve => setTimeout(resolve, 150))
      this.measuringPeaks = false
      let signalPresent = this.peakDetector.peakPresent(this._state.peakDetectionThresholdDb)

      while (signalPresent && this._state.scanning) {
        await this.signalNotPresent(this.tuner)
        await this.dwell()
        // Check if the signal has returned
        signalPresent = this.tuner.signalPresent
      }
      targetIdx = (targetIdx + 1) % scanTargets.length
    }
  }

  private signalNotPresent(tuner: Tuner): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!tuner.signalPresent) {
          clearInterval(timer)
          resolve()
        }
      }, 1000)
    })
  }

  private dwell(): Promise<void> {
    return new Promise<void>((resolve) => {
      // TODO make dwell time configurable
      setTimeout(resolve, 3000)
    })
  }

  public stop() {
    this._state.scanning = false
  }

  get state() {
    return toRefs(this._state)
  }
}
