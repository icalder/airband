export class ClientSync {
  canControl = false
  gain = 0
  deviceCentreFreq = 0
  iqCentreFreq = 0
  fftCentreFreq = 0
  minIQCentreFreq = 0
  maxIQCentreFreq = 0
  minFFTCentreFreq = 0
  maxFFTCentreFreq = 0

  constructor(buf: ArrayBuffer) {
    const data = new Uint32Array(buf)
    this.canControl = data[0] > 0
    this.gain = data[1]
    this.deviceCentreFreq = data[2]
    this.iqCentreFreq = data[3]
    this.fftCentreFreq = data[4]
    this.minIQCentreFreq = data[5]
    this.maxIQCentreFreq = data[6]
    this.minFFTCentreFreq = data[7]
    this.maxFFTCentreFreq = data[8]
  }
}
