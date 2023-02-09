// https://dsp.stackexchange.com/questions/48989/fm-demodulation-with-arctan
// def discrim(x):
//     X=np.real(x) # X is the real part of the received signal
//     Y=np.imag(x) # Y is the imaginary part of the received signal
//     b=np.array([1, -1]) # filter coefficients for discrete derivative
//     a=np.array([1, 0]) # filter coefficients for discrete derivative
//     derY=signal.lfilter(b,a,Y) # derivative of Y,
//     derX=signal.lfilter(b,a,X) # " X,
//     disdata=(X*derY-Y*derX)/(X**2+Y**2)
//     return disdata

// https://dsp.stackexchange.com/questions/14267/ways-to-compute-the-n-the-derivative-of-a-discrete-signal/14268

// https://www.embedded.com/dsp-tricks-frequency-demodulation-algorithms/
// Implements fig. 13-61 b
class DerivativeFilter {
  private taps = [0, 0, 0]

  filter(x: number): number {
    this.taps[2] = this.taps[1]
    this.taps[1] = this.taps[0]
    this.taps[0] = x
    return x - this.taps[2]
  }

  get delayed() {
    return this.taps[1]
  }
}

export class Discriminator {
  private idf = new DerivativeFilter()
  private qdf = new DerivativeFilter()

  demodulate(i: number, q: number) {
    const di = this.idf.filter(i)
    const dq = this.qdf.filter(q)
    return (this.idf.delayed * dq - this.qdf.delayed * di) / (i ** 2 + q ** 2)
  }
}
