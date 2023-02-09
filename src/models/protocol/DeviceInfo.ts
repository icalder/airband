export enum DeviceType {
  INVALID = 0,
  AIRSPY_ONE = 1,
  AIRSPY_HF = 2,
  RTLSDR = 3,
}

export class DeviceInfo {
  deviceType: DeviceType = DeviceType.INVALID
  serial = 0
  maxSampleRate = 0
  maxBandwidth = 0
  decimationStages = 0
  gainStages = 0
  maxGain = 0
  minFrequency = 0
  maxFrequency = 0
  adcBits = 0
  minIQDecimation = 0
  forcedIQFormat = false

  constructor(buf: ArrayBuffer) {
    const data = new Uint32Array(buf)
    this.deviceType = data[0]
    this.serial = data[1]
    this.maxSampleRate = data[2]
    this.maxBandwidth = data[3]
    this.decimationStages = data[4]
    this.gainStages = data[5]
    this.maxGain = data[6]
    this.minFrequency = data[7]
    this.maxFrequency = data[8]
    this.adcBits = data[9]
    this.minIQDecimation = data[10]
    this.forcedIQFormat = data[11] > 0
  }

  get availableSampleRates(): number[] {
    const result = []
    for (let i = 0; i !== this.decimationStages; ++i) {
      const decim = 1 << i
      result.push(this.maxSampleRate / decim)
    }
    return result
  }
}
