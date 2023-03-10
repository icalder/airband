import { reactive, toRefs } from 'vue'
import { SampleRateChangedCallback, SpyServer } from './spyserver'
import {
  Tuner,
  DemodulatedSignalHandler,
  SignalDetectedHandler,
} from '@/lib/Tuner'
import { AGC, l2NormCmplx, PLL, SimplePLL } from '@/lib/dsp'
import {
  FIRFilter,
  generateLPFCoefficients,
  TWindowType,
} from '@/lib/FIRFilter'
import { Discriminator } from '@/lib/Discriminator'

export class SpyServerTuner implements Tuner {
  private iFilter?: FIRFilter
  private qFilter?: FIRFilter
  private agc?: AGC
  //private pll = new PLL(0.005, 0.707, 1000)
  private pll = new SimplePLL(0.04)
  private fmDemod = new Discriminator()
  private desiredGain = 0
  private sampleRateChangedCallbacks: SampleRateChangedCallback[] = []
  private demodulatedSignalHandlers: DemodulatedSignalHandler[] = []
  private signalDetectedHandlers: SignalDetectedHandler[] = []
  private sampleRate = 0

  private _state = reactive({
    fmMode: false,
    cutoff: 0,
    maxGain: 0,
    squelch: 0.15,
    signalLock: this.pll.locked
  })

  // eslint-disable-next-line no-useless-constructor
  constructor(private server: SpyServer) {
    server.addDeviceInfoCallback((deviceInfo) => {
      this.setMaxGain(Math.ceil(deviceInfo.maxGain / 2))
    })
    server.addSampleRateChangedCallback((sampleRate) =>
      this.sampleRateChanged(sampleRate)
    )
    server.addIQSamplesHandler((data) => this.handleIQData(data))
  }

  public addSampleRateChangedCallback(callback: SampleRateChangedCallback) {
    this.sampleRateChangedCallbacks.push(callback)
  }

  public addDemodulatedSignalHandler(callback: DemodulatedSignalHandler) {
    this.demodulatedSignalHandlers.push(callback)
  }

  public addSignalDetectedHandler(callback: SignalDetectedHandler) {
    this.signalDetectedHandlers.push(callback)
  }

  public setSampleRate(sampleRate: number) {
    this.server.setIQSampleRate(sampleRate)
    this.sampleRateChanged(sampleRate)
  }

  public setMaxGain(maxGain: number) {
    this._state.maxGain = maxGain
    if (this.sampleRate > 0) {
      this.agc = new AGC(this.sampleRate, maxGain, maxGain)
    }
  }

  protected sampleRateChanged(sampleRate: number) {
    this.sampleRate = sampleRate
    if (this._state.maxGain > 0) {
      this.agc = new AGC(this.sampleRate, this._state.maxGain, this._state.maxGain)
    }
    this.stopFiltering()
    if (!this.fmMode) {
      this.startFiltering(4000)
    }
    this.sampleRateChangedCallbacks.forEach((cb) => cb(sampleRate))
  }

  tune(frequency: number): Promise<void> {
    this.server.setCentreFrequency(frequency)
    // Ideally we would use the client sync callback from spyserver
    // to determine when the tuning has completed.  Instead, we'll just
    // wait for an aritrary delay...

    // Wait 150ms to settle on new freq
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 150)
    })
  }

  get signalPresent(): boolean {
    this._state.signalLock = this.pll.locked
    return this.pll.locked < this.state.squelch.value
  }

  public startFiltering(cutoff: number) {
    const omegaC = (2 * cutoff) / this.sampleRate
    const coeffs = new Float32Array(32)
    generateLPFCoefficients(coeffs, omegaC, TWindowType.wtBLACKMAN_HARRIS, 0)
    this.iFilter = new FIRFilter(coeffs)
    this.qFilter = new FIRFilter(coeffs)
    this._state.cutoff = cutoff
  }

  public stopFiltering() {
    this.iFilter = undefined
    this.qFilter = undefined
    this._state.cutoff = 0
  }

  public resetAGCGain(gain: number) {
    gain = Math.min(this._state.maxGain, gain)
    this.agc?.reset(gain)
    this.setDesiredGain(gain)
  }

  public get fmMode() {
    return this._state.fmMode
  }

  public set fmMode(val: boolean) {
    this._state.fmMode = val
  }

  public get state() {
    return toRefs(this._state)
  }

  private setDesiredGain(gain: number) {
    this.desiredGain = gain
    this.server.setGain(gain)
  }

  private handleIQData(data: Uint8Array) {
    const [idata, qdata] = this.filterData(data)
    const am = new Float32Array(idata.length)
    const energy = l2NormCmplx(idata, qdata)
    if (this.agc) {
      const gain = this.agc.updateGain(energy)
      // If requested gain has changed by more than 0.5 unit update it
      if (Math.abs(gain - this.desiredGain) > 0.5) {
        this.setDesiredGain(gain)
      }
    }

    for (let i = 0; i !== idata.length; ++i) {
      this.pll.run([idata[i], qdata[i]])
      am[i] = this.pll.am
    }

    this.signalDetectedHandlers.forEach((h) => h(this.signalPresent))

    // Use the locked signal from the PLL as squelch
    if (!this.fmMode && !this.signalPresent) {
      return
    }

    const signal = this.fmMode ? this.demodulateFMIQData(idata, qdata) : am
    this.demodulatedSignalHandlers.forEach((h) => h(signal))
  }

  private filterData(data: Uint8Array): Float32Array[] {
    const iraw = new Float32Array(data.byteLength / 2)
    const qraw = new Float32Array(data.byteLength / 2)
    let n = 0
    for (let j = 0; j !== data.byteLength; j += 2) {
      iraw[n] = 2 * (data[j] / 255 - 0.5)
      qraw[n++] = 2 * (data[j + 1] / 255 - 0.5)
    }
    if (this.iFilter && this.qFilter) {
      // Arrays to hold the filtered result
      const i = new Float32Array(iraw.length)
      const q = new Float32Array(qraw.length)
      this.iFilter.run(iraw, i)
      this.qFilter.run(qraw, q)
      return [i, q]
    }
    return [iraw, qraw]
  }

  private demodulateFMIQData(
    idata: Float32Array,
    qdata: Float32Array
  ): Float32Array {
    const result = new Float32Array(idata.length)
    for (let k = 0; k !== idata.length; ++k) {
      result[k] = this.fmDemod.demodulate(idata[k], qdata[k]) * 0.1
    }
    return result
  }
}
