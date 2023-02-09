// https://liquidsdr.org/blog/pll-howto/
// https://ccrma.stanford.edu/~jos/fp/Direct_Form_II.html
// v[n] = x[n] - a1.v[n-1] - a2.v[n-2]
// y[n] = b0.v[n] + b1.v[n-1] + b2.v[n-2]

export class DirectForm2BiquadFilter {
  private delayLine = [0, 0]

  // eslint-disable-next-line no-useless-constructor
  constructor(private b: Float32Array, private a: Float32Array) {}

  reset() {
    for (let i = 0; i !== this.delayLine.length; ++i) {
      this.delayLine[i] = 0
    }
  }

  run(x: number): number {
    const v = x - this.a[1] * this.delayLine[0] - this.a[2] * this.delayLine[1]
    const y =
      this.b[0] * v +
      this.b[1] * this.delayLine[0] +
      this.b[2] * this.delayLine[1]
    this.delayLine[1] = this.delayLine[0]
    this.delayLine[0] = v
    return y
  }
}

export class DirectForm2BiquadFilterCmplx {
  private delayLine = [
    [0, 0],
    [0, 0],
  ]

  // eslint-disable-next-line no-useless-constructor
  constructor(private b: Float32Array, private a: Float32Array) {}

  reset() {
    for (let i = 0; i !== this.delayLine.length; ++i) {
      this.delayLine[i][0] = 0
      this.delayLine[i][1] = 0
    }
  }

  run(x: number[]): number[] {
    const vr =
      x[0] - this.a[1] * this.delayLine[0][0] - this.a[2] * this.delayLine[1][0]
    const vi =
      x[1] - this.a[1] * this.delayLine[0][1] - this.a[2] * this.delayLine[1][1]
    const yr =
      this.b[0] * vr +
      this.b[1] * this.delayLine[0][0] +
      this.b[2] * this.delayLine[1][0]
    const yi =
      this.b[0] * vi +
      this.b[1] * this.delayLine[0][1] +
      this.b[2] * this.delayLine[1][1]
    this.delayLine[1] = this.delayLine[0]
    this.delayLine[0] = [yr, yi]
    return [yr, yi]
  }
}
