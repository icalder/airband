import { cmplxMultiply, conj, arg } from './dsp'

export class QuadratureDemod {
  y = [0, 0]

  demodulate(i: number, q: number) {
    const x = [i, q]
    const argInput = cmplxMultiply(x, conj(this.y))
    this.y = x
    return arg(argInput) * 2
  }
}
