// https://www.liquidsdr.org/downloads/liquid-dsp-1.0.0.pdf

import { DirectForm2BiquadFilter } from './IIRFilters'
import { PIDController } from './PIDController'

export function l2NormReal(data: Float32Array) {
  return Math.sqrt(data.map((r) => r ** 2).reduce((total, cur) => total + cur))
}

export function l2NormCmplx(idata: Float32Array, qdata: Float32Array) {
  let total = 0
  for (let k = 0; k !== idata.length; ++k) {
    const mag = idata[k] ** 2 + qdata[k] ** 2
    total += mag
  }
  return Math.sqrt(total)
}

export class EnergyEstimator {
  static readonly delta = 0.1
  private ePrev = 0

  estimate(x: number) {
    const result = Math.sqrt(
      EnergyEstimator.delta * x ** 2 +
        (1 - EnergyEstimator.delta) * this.ePrev ** 2
    )
    this.ePrev = result
    return result
  }
}

// https://www.liquidsdr.org/downloads/liquid-dsp-1.0.0.pdf
export class AGC {
  // target energy value = 1 when samplerate = 9375
  static readonly targetEnergyPerSampleRate = 1 / 9375
  private gain = 0
  private controller: PIDController
  private targetEnergy: number

  // eslint-disable-next-line no-useless-constructor
  constructor(
    sampleRate: number,
    private initialGain: number,
    private maxGain: number
  ) {
    this.gain = this.initialGain
    this.targetEnergy = AGC.targetEnergyPerSampleRate * sampleRate
    /*
    one tuning method is to first set I and D values to zero
    and increase P until loop output oscillates —
    then increase I until oscillation stops,
    and increase D until the loop is acceptably quick in reaching its reference
    */
    // Ziegler-Nichols: find critical gain kpc where oscillation starts - 0.03
    // Set kp = 0.5 * kpc, ki = 0.45*kpc, d = 0.6kpc
    this.controller = new PIDController(1, 0.1, 0, 0)
  }

  public reset(gain: number = 0) {
    this.gain = Math.min(this.maxGain, gain || this.initialGain)
    this.controller.reset()
  }

  updateGain(currentEnergy: number): number {
    const deltaGain = this.controller.run(this.targetEnergy, currentEnergy)
    this.gain = Math.max(1, Math.min(this.gain + deltaGain, this.maxGain))
    return this.gain
  }
}

/**
 * https://liquidsdr.org/blog/pll-howto/
 *
 * @param bw the bandwidth of the loop filter
 * @param dampingFactor the loop filter's damping factor, typically 0.707
 * @param k the loop filter's gain (typically large, ~ 1000)
 *
 * @return [b, a]
 */
export function generatePLLFilterCoeffs(
  bw: number,
  dampingFactor: number,
  k: number
): Float32Array[] {
  const t1 = k / bw ** 2
  const t2 = (2 * dampingFactor) / bw
  const b = new Float32Array(3)
  b[0] = ((4 * k) / t1) * (1 + t2 / 2)
  b[1] = (8 * k) / t1
  b[2] = ((4 * k) / t1) * (1 - t2 / 2)
  const a = new Float32Array(3)
  a[0] = 1
  a[1] = -2
  a[2] = 1
  return [b, a]
}

export function oscillator(phi: number) {
  return [Math.cos(phi), Math.sin(phi)]
}

export function addNoise(x: number[], magnitude: number) {
  const ren = (Math.random() - 0.5) * magnitude
  const imn = (Math.random() - 0.5) * magnitude
  return [x[0] + ren, x[1] + imn]
}

export function conj(x: number[]) {
  return [x[0], -x[1]]
}

export function arg(x: number[]) {
  return Math.atan2(x[1], x[0])
}

/* function cmplxAdd(x: number[], y: number[]) {
  return [x[0] + y[0], x[1] + y[1]]
} */

export function cmplxMultiply(x: number[], y: number[]) {
  // (a + bi)(c + di) = (ac - bd) + (bc + ad)i
  const xres = x[0] * y[0] - x[1] * y[1]
  const yres = x[1] * y[0] + x[0] * y[1]
  return [xres, yres]
}

// https://liquidsdr.org/blog/pll-howto/
export class PLL {
  private filter: DirectForm2BiquadFilter
  private phiHat = 0
  private _deltaPhi = 0
  private _lock = 0.5
  private _deltaPhiHat = 0
  private _am = 0
  private _fm = 0

  constructor(bw: number, dampingFactor: number, k: number) {
    const coefs = generatePLLFilterCoeffs(bw, dampingFactor, k)
    this.filter = new DirectForm2BiquadFilter(coefs[0], coefs[1])
  }

  run(x: number[]): number[] {
    const y = oscillator(this.phiHat)
    const argInput = cmplxMultiply(x, conj(y))
    this._deltaPhi = arg(argInput)
    this._lock = 0.005 * this._deltaPhi ** 2 + 0.995 * this._lock
    const ph = this.filter.run(this.deltaPhi)
    this._deltaPhiHat = ph - this.phiHat
    this.phiHat = ph
    // Ae^ip x e^-ip = Ae^i(p-p) = A
    // this._am = cmplxMultiply(x, conj(oscillator(this.phiHat)))[0]
    this._am = argInput[0]
    return y
  }

  reset() {
    this._deltaPhi = 0
    this._lock = 0.5
    this.phiHat = 0
    this.filter.reset()
  }

  get deltaPhi() {
    return this._deltaPhi
  }

  // If locked < ~0.5 that indicates lock
  get locked() {
    return this._lock
  }

  get am() {
    return this._am
  }

  get fm() {
    return this._deltaPhi
  }

  refFreq(sampleRate: number) {
    return this._deltaPhiHat / ((2 * Math.PI * 1) / sampleRate)
  }
}

// https://liquidsdr.org/blog/pll-simple-howto/
export class SimplePLL {
  private beta: number
  private phase_error = 0
  private phase_out = 0
  private frequency_out = 0
  private _lock = 0.5
  private _am = 0

  constructor(private alpha: number) {
    this.beta = 0.5 * alpha * alpha
  }

  reset() {
    this.phase_error = 0
    this.phase_out = 0
    this.frequency_out = 0
    this._am = 0
  }

  get deltaPhi() {
    return this.phase_error
  }

  // If locked < ~0.5 that indicates lock
  get locked() {
    return this._lock
  }

  get am() {
    return this._am
  }

  get fm() {
    return this.phase_error
  }

  run(x: number[]): number[] {
    const y = oscillator(this.phase_out)
    const argInput = cmplxMultiply(x, conj(y))
    this.phase_error = arg(argInput)
    this._lock = 0.005 * this.phase_error ** 2 + 0.995 * this._lock
    this.phase_out += this.alpha * this.phase_error
    this.frequency_out += this.beta * this.phase_error
    this.phase_out += this.frequency_out
    this._am = argInput[0]
    return y
  }
}

export class SpectralPeakDetector {
  private bins = new Uint8Array()
  private count = 0

  reset() {
    for (let i = 0; i != this.bins.length; ++i) {
      this.bins[i] = 0
    }
    this.count = 1
  }

  addSamples(samples: Uint8Array) {
    if ((this.bins.length != samples.length)) {
      this.bins = new Uint8Array(samples.length)
      this.count = 1
    }
    for (let i = 0; i != this.bins.length; ++i) {
      this.bins[i] = (this.bins[i] * (this.count - 1) + samples[i]) / this.count
    }
    ++this.count
  }

  peakPresent(minPeakHeightDB: number): boolean {
    let N = this.bins.length
    if (this.bins.length > 3) {
      // We drop the 3 highest values to reduce bias on the mean
      this.bins.sort()
      N -= 3
    }
    // Calculate the mean of the first N samples to determine noise floor
    const mean = this.bins.filter((_, idx) => idx < N).reduce((a, b) => a + b) / N
    // Take log of mean
    const meanDB = 20 * Math.log10(mean)
    return this.bins.some(v => 20 * Math.log10(v) - meanDB > minPeakHeightDB)
  }
}