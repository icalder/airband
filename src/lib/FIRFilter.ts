/* eslint-disable camelcase */
/**
 * See https://www.recordingblogs.com/wiki/low-pass-filter
 * @param {number} fs - sampling frequency
 * @param {number} fc - cutoff frequency
 * @param {number} n - filter length (e.g. 201)
 */
export function generateFIRCoeffs(
  fs: number,
  fc: number,
  n: number
): Float32Array {
  const result = new Float32Array(n)
  for (let k = 0; k !== n; ++k) {
    if (k === (n - 1) / 2) {
      result[k] = (2 * fc) / fs
    } else {
      const num = Math.sin((2 * Math.PI * fc * (k - (n - 1) / 2)) / fs)
      const denom = Math.PI * (k - (n - 1) / 2)
      result[k] = num / denom
    }
  }
  return result
}

// Online Parks-McClellan generator:
// http://t-filter.engineerjs.com/

const MAX_TAPS = 256

// https://ptolemy.berkeley.edu/eecs20/week12/implementation.html
// y[n] = b0.x[n] + b1.x[n-1] + b2.x[n-2]
export class FIRFilter {
  private numTaps: number
  private delayLine: Float32Array
  private ptr = 0

  constructor(private b: Float32Array) {
    this.numTaps = b.length
    if (this.numTaps > MAX_TAPS) {
      throw new Error(`Maximum taps = ${MAX_TAPS}`)
    }
    this.delayLine = new Float32Array(this.numTaps)
  }

  reset() {
    for (let i = 0; i !== this.numTaps; ++i) {
      this.delayLine[i] = 0
    }
  }

  run(signal: Float32Array, filteredSignal: Float32Array) {
    for (let j = 0; j < signal.length; ++j) {
      this.delayLine[this.ptr] = signal[j]
      let y = 0
      let index = this.ptr
      for (let i = 0; i < this.numTaps; ++i) {
        y += this.b[i] * this.delayLine[index--]
        if (index < 0) index = this.numTaps - 1
      }
      filteredSignal[j] = y
      if (++this.ptr >= this.numTaps) {
        this.ptr = 0
      }
    }
  }
}

// All code below taken from:
// http://iowahills.com/Example%20Code/WindowedFIRFilterWebCode.txt

const M_2PI = 2 * Math.PI

export enum TPassTypeName {
  LPF,
  HPF,
  BPF,
  NOTCH,
}

export enum TWindowType {
  wtNONE,
  wtKAISER,
  wtSINC,
  wtHANNING,
  wtHAMMING,
  wtBLACKMAN,
  wtFLATTOP,
  wtBLACKMAN_HARRIS,
  wtBLACKMAN_NUTTALL,
  wtNUTTALL,
  wtKAISER_BESSEL,
  wtTRAPEZOID,
  wtGAUSS,
  wtSINE,
  wtTEST,
}

export function generateLPFCoefficients(
  FirCoeff: Float32Array,
  OmegaC: number,
  WindowType: TWindowType,
  WinBeta: number
) {
  BasicFIR(
    FirCoeff,
    FirCoeff.length,
    TPassTypeName.LPF,
    OmegaC,
    0,
    WindowType,
    WinBeta
  )
}

// This gets used with the Kaiser window.
function Bessel(x: number) {
  let Sum = 0.0
  for (let i = 1; i < 10; i++) {
    const XtoIpower = Math.pow(x / 2.0, i)
    let Factorial = 1
    for (let j = 1; j <= i; j++) Factorial *= j
    Sum += Math.pow(XtoIpower / Factorial, 2.0)
  }
  return 1.0 + Sum
}

function Sinc(x: number) {
  if (x > -1.0e-5 && x < 1.0e-5) return 1.0
  return Math.sin(x) / x
}

function BasicFIR(
  FirCoeff: Float32Array,
  NumTaps: number,
  PassType: TPassTypeName,
  OmegaC: number,
  BW: number,
  WindowType: TWindowType,
  WinBeta: number
) {
  let OmegaLow = 0
  let OmegaHigh = 0

  switch (PassType) {
    case TPassTypeName.LPF:
      for (let j = 0; j < NumTaps; j++) {
        const Arg = j - (NumTaps - 1) / 2.0
        FirCoeff[j] = OmegaC * Sinc(OmegaC * Arg * Math.PI)
      }
      break

    case TPassTypeName.HPF:
      if (NumTaps % 2 === 1) {
        // Odd tap counts
        for (let j = 0; j < NumTaps; j++) {
          const Arg = j - (NumTaps - 1) / 2.0
          FirCoeff[j] =
            Sinc(Arg * Math.PI) - OmegaC * Sinc(OmegaC * Arg * Math.PI)
        }
      } // Even tap counts
      else {
        for (let j = 0; j < NumTaps; j++) {
          const Arg = j - (NumTaps - 1) / 2.0
          if (Arg === 0.0) FirCoeff[j] = 0.0
          else
            FirCoeff[j] =
              Math.cos(OmegaC * Arg * Math.PI) / Math.PI / Arg +
              Math.cos(Arg * Math.PI)
        }
      }
      break

    case TPassTypeName.BPF:
      OmegaLow = OmegaC - BW / 2.0
      OmegaHigh = OmegaC + BW / 2.0
      for (let j = 0; j < NumTaps; j++) {
        const Arg = j - (NumTaps - 1) / 2.0
        if (Arg === 0.0) FirCoeff[j] = 0.0
        else
          FirCoeff[j] =
            (Math.cos(OmegaLow * Arg * Math.PI) -
              Math.cos(OmegaHigh * Arg * Math.PI)) /
            Math.PI /
            Arg
      }
      break

    case TPassTypeName.NOTCH: // If NumTaps is even for Notch filters, the response at Pi is attenuated.
      OmegaLow = OmegaC - BW / 2.0
      OmegaHigh = OmegaC + BW / 2.0
      for (let j = 0; j < NumTaps; j++) {
        const Arg = j - (NumTaps - 1) / 2.0
        FirCoeff[j] =
          Sinc(Arg * Math.PI) -
          OmegaHigh * Sinc(OmegaHigh * Arg * Math.PI) -
          OmegaLow * Sinc(OmegaLow * Arg * Math.PI)
      }
      break
  }

  // WindowData can be used to window data before an FFT. When used for FIR filters we set
  // Alpha = 0.0 to prevent a flat top on the window and
  // set UnityGain = false to prevent the window gain from getting set to unity.
  WindowData(FirCoeff, NumTaps, WindowType, 0.0, WinBeta, false)
}

function WindowData(
  Data: Float32Array,
  N: number,
  WindowType: TWindowType,
  Alpha: number,
  Beta: number,
  UnityGain: boolean
) {
  if (WindowType === TWindowType.wtNONE) return

  // int j, M, TopWidth;
  // double dM, *WinCoeff;

  if (
    WindowType === TWindowType.wtKAISER ||
    WindowType === TWindowType.wtFLATTOP
  )
    Alpha = 0.0

  if (Alpha < 0.0) Alpha = 0.0
  if (Alpha > 1.0) Alpha = 1.0

  if (Beta < 0.0) Beta = 0.0
  if (Beta > 10.0) Beta = 10.0

  const WinCoeff = new Float32Array(N + 2)

  let TopWidth = Alpha * N
  if (TopWidth % 2 !== 0) TopWidth++
  if (TopWidth > N) TopWidth = N
  const M = N - TopWidth
  const dM = M + 1

  // Calculate the window for N/2 points, then fold the window over (at the bottom).
  // TopWidth points will be set to 1.
  if (WindowType === TWindowType.wtKAISER) {
    for (let j = 0; j < M; j++) {
      const Arg = Beta * Math.sqrt(1.0 - Math.pow((2 * j + 2 - dM) / dM, 2.0))
      WinCoeff[j] = Bessel(Arg) / Bessel(Beta)
    }
  } else if (WindowType === TWindowType.wtSINC) {
    // Lanczos
    for (let j = 0; j < M; j++)
      WinCoeff[j] = Sinc(((2 * j + 1 - M) / dM) * Math.PI)
    for (let j = 0; j < M; j++) WinCoeff[j] = Math.pow(WinCoeff[j], Beta)
  } else if (WindowType === TWindowType.wtSINE) {
    // Hanning if Beta = 2
    for (let j = 0; j < M / 2; j++)
      WinCoeff[j] = Math.sin(((j + 1) * Math.PI) / dM)
    for (let j = 0; j < M / 2; j++) WinCoeff[j] = Math.pow(WinCoeff[j], Beta)
  } else if (WindowType === TWindowType.wtHANNING) {
    for (let j = 0; j < M / 2; j++)
      WinCoeff[j] = 0.5 - 0.5 * Math.cos(((j + 1) * M_2PI) / dM)
  } else if (WindowType === TWindowType.wtHAMMING) {
    for (let j = 0; j < M / 2; j++)
      WinCoeff[j] = 0.54 - 0.46 * Math.cos(((j + 1) * M_2PI) / dM)
  } else if (WindowType === TWindowType.wtBLACKMAN) {
    for (let j = 0; j < M / 2; j++) {
      WinCoeff[j] =
        0.42 -
        0.5 * Math.cos(((j + 1) * M_2PI) / dM) +
        0.08 * Math.cos(((j + 1) * M_2PI * 2.0) / dM)
    }
  }

  // See: http://www.bth.se/fou/forskinfo.nsf/0/130c0940c5e7ffcdc1256f7f0065ac60/$file/ICOTA_2004_ttr_icl_mdh.pdf
  else if (WindowType === TWindowType.wtFLATTOP) {
    for (let j = 0; j <= M / 2; j++) {
      WinCoeff[j] =
        1.0 -
        1.93293488969227 * Math.cos(((j + 1) * M_2PI) / dM) +
        1.28349769674027 * Math.cos(((j + 1) * M_2PI * 2.0) / dM) -
        0.38130801681619 * Math.cos(((j + 1) * M_2PI * 3.0) / dM) +
        0.02929730258511 * Math.cos(((j + 1) * M_2PI * 4.0) / dM)
    }
  } else if (WindowType === TWindowType.wtBLACKMAN_HARRIS) {
    for (let j = 0; j < M / 2; j++) {
      WinCoeff[j] =
        0.35875 -
        0.48829 * Math.cos(((j + 1) * M_2PI) / dM) +
        0.14128 * Math.cos(((j + 1) * M_2PI * 2.0) / dM) -
        0.01168 * Math.cos(((j + 1) * M_2PI * 3.0) / dM)
    }
  } else if (WindowType === TWindowType.wtBLACKMAN_NUTTALL) {
    for (let j = 0; j < M / 2; j++) {
      WinCoeff[j] =
        0.3535819 -
        0.4891775 * Math.cos(((j + 1) * M_2PI) / dM) +
        0.1365995 * Math.cos(((j + 1) * M_2PI * 2.0) / dM) -
        0.0106411 * Math.cos(((j + 1) * M_2PI * 3.0) / dM)
    }
  } else if (WindowType === TWindowType.wtNUTTALL) {
    for (let j = 0; j < M / 2; j++) {
      WinCoeff[j] =
        0.355768 -
        0.487396 * Math.cos(((j + 1) * M_2PI) / dM) +
        0.144232 * Math.cos(((j + 1) * M_2PI * 2.0) / dM) -
        0.012604 * Math.cos(((j + 1) * M_2PI * 3.0) / dM)
    }
  } else if (WindowType === TWindowType.wtKAISER_BESSEL) {
    for (let j = 0; j <= M / 2; j++) {
      WinCoeff[j] =
        0.402 -
        0.498 * Math.cos((M_2PI * (j + 1)) / dM) +
        0.098 * Math.cos((2.0 * M_2PI * (j + 1)) / dM) +
        0.001 * Math.cos((3.0 * M_2PI * (j + 1)) / dM)
    }
  } else if (WindowType === TWindowType.wtTRAPEZOID) {
    // Rectangle for Alpha = 1  Triangle for Alpha = 0
    let K = M / 2
    if (M % 2) K++
    for (let j = 0; j < K; j++) WinCoeff[j] = (j + 1) / K
  }

  // This definition is from http://en.wikipedia.org/wiki/Window_function (Gauss Generalized normal window)
  // We set their p = 2, and use Alpha in the numerator, instead of Sigma in the denominator, as most others do.
  // Alpha = 2.718 puts the Gauss window response midway between the Hanning and the Flattop (basically what we want).
  // It also gives the same BW as the Gauss window used in the HP 89410A Vector Signal Analyzer.
  // Alpha = 1.8 puts it quite close to the Hanning.
  else if (WindowType === TWindowType.wtGAUSS) {
    for (let j = 0; j < M / 2; j++) {
      WinCoeff[j] = ((j + 1 - dM / 2.0) / (dM / 2.0)) * 2.7183
      WinCoeff[j] *= WinCoeff[j]
      WinCoeff[j] = Math.exp(-WinCoeff[j])
    }
  } // Error.
  else {
    throw new Error('Incorrect window type in WindowFFTData')
  }

  // Fold the coefficients over.
  for (let j = 0; j < M / 2; j++) WinCoeff[N - j - 1] = WinCoeff[j]

  // This is the flat top if Alpha > 0. Cannot be applied to a Kaiser or Flat Top.
  if (
    WindowType !== TWindowType.wtKAISER &&
    WindowType !== TWindowType.wtFLATTOP
  ) {
    for (let j = M / 2; j < N - M / 2; j++) WinCoeff[j] = 1.0
  }

  // This will set the gain of the window to 1. Only the Flattop window has unity gain by design.
  if (UnityGain) {
    let Sum = 0.0
    for (let j = 0; j < N; j++) Sum += WinCoeff[j]
    Sum /= N
    if (Sum !== 0.0) for (let j = 0; j < N; j++) WinCoeff[j] /= Sum
  }

  // Apply the window to the data.
  for (let j = 0; j < N; j++) Data[j] *= WinCoeff[j]
}
