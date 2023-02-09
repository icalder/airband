export class AudioBuffers {
  static buffersPerSecond = 4

  private buffers: AudioBuffer[] = []
  private sources: AudioBufferSourceNode[] = []
  private activeBuffer?: AudioBuffer
  private bufferCount = 0
  private bufferOverlapPercentage = 5
  private lastPlayTimestamp = 0
  private sourceStartDelay = 0
  private maxBuffers = 20
  private bufferPos = 0
  private bufferPlayTime = 0

  // eslint-disable-next-line no-useless-constructor
  constructor(private context: AudioContext, private sampleRate: number) {
    // nominally <buffer length> ms of audio per buffer, less the overlap
    this.sourceStartDelay =
      (1 - this.bufferOverlapPercentage / 100) *
      (1 / AudioBuffers.buffersPerSecond)
  }

  private getOrCreateBuffer(): AudioBuffer | undefined {
    if (this.buffers.length > 0) {
      return this.buffers.pop()
    }
    if (this.bufferCount === this.maxBuffers) {
      return undefined
    }
    const result = this.context.createBuffer(
      1,
      this.sampleRate / AudioBuffers.buffersPerSecond,
      this.sampleRate
    )
    this.bufferCount++
    // console.log(`Created buffer ${this.bufferCount}`)
    return result
  }

  private createBufferSource(buffer: AudioBuffer): AudioBufferSourceNode {
    const result = this.context.createBufferSource()
    result.buffer = buffer
    result.connect(this.context.destination)
    return result
  }

  public reset() {
    this.sources.forEach((src) => src.stop())
    this.bufferPos = 0
  }

  public clearUnplayedSamples() {
    this.bufferPos = 0
  }

  public addSamples(samples: Float32Array): void {
    if (!this.activeBuffer) {
      this.activeBuffer = this.getOrCreateBuffer()
    }
    if (!this.activeBuffer) {
      // We've reached maximum buffer count, have to discard these samples
      return
    }
    const activeBuffer = this.activeBuffer
    // see how much space there is left in the buffer
    const remaining = activeBuffer.length - this.bufferPos
    if (remaining > samples.length) {
      activeBuffer.copyToChannel(samples, 0, this.bufferPos)
      this.bufferPos += samples.length
      return
    }
    // We're about to fill the current buffer ready for for playback
    const slice1 = new Float32Array(samples, 0, remaining)
    const slice2 = new Float32Array(samples, remaining)
    this.activeBuffer.copyToChannel(slice1, 0, this.bufferPos)

    // Put the rest of the samples into a new buffer
    this.activeBuffer = undefined
    this.bufferPos = 0
    const nextBuffer = this.getOrCreateBuffer()
    // Duplicate the last x% from the active buffer into the next buffer
    if (nextBuffer) {
      this.bufferPos = AudioBuffers.copyOverlap(
        activeBuffer,
        nextBuffer,
        this.bufferOverlapPercentage
      )
    }

    // Now taper the first buffer and play it before finishing the copy of
    // the remaining samples
    AudioBuffers.taperStart(activeBuffer, this.bufferOverlapPercentage)
    AudioBuffers.taperEnd(activeBuffer, this.bufferOverlapPercentage)
    this.play(activeBuffer)

    if (nextBuffer) {
      nextBuffer.copyToChannel(slice2, 0, this.bufferPos)
      this.bufferPos += slice2.length
      this.activeBuffer = nextBuffer
    }
  }

  private play(buffer: AudioBuffer) {
    this.updateSourceStartDelay()
    const source = this.createBufferSource(buffer)
    this.sources.push(source)
    source.onended = () => {
      // Return the audio samples buffer for reuse
      this.buffers.push(buffer)
      this.sources = this.sources.filter((s) => s !== source)
    }
    if (this.bufferPlayTime === 0) {
      this.bufferPlayTime = this.context.currentTime + this.sourceStartDelay
    } else {
      this.bufferPlayTime += this.sourceStartDelay
    }
    source.start(this.bufferPlayTime)
  }

  private updateSourceStartDelay() {
    const now = this.context.currentTime
    if (this.lastPlayTimestamp === 0) {
      this.lastPlayTimestamp = now
      return
    }
    const newDelay = now - this.lastPlayTimestamp
    this.lastPlayTimestamp = now
    if (Math.abs(this.sourceStartDelay - newDelay) > 0.2) {
      // Ignore outliers, e.g. if streaming is paused for a bit
      this.bufferPlayTime = 0
      return
    }
    this.sourceStartDelay = 0.01 * newDelay + 0.99 * this.sourceStartDelay
  }

  // returns new dest buffer position
  private static copyOverlap(
    source: AudioBuffer,
    dest: AudioBuffer,
    percent: number = 5
  ): number {
    const l = Math.floor(0.01 * percent * source.length)
    const input = source.getChannelData(0)
    const output = dest.getChannelData(0)
    let n = 0
    for (let i = input.length - l - 1; i !== input.length; ++i) {
      output[n++] = input[i]
    }
    return n
  }

  private static taperEnd(buffer: AudioBuffer, percent: number = 5) {
    const l = Math.floor(0.01 * percent * buffer.length)
    const data = buffer.getChannelData(0)
    let scale = 1.0
    const scaleDelta = 1 / l
    for (let i = data.length - l - 1; i !== data.length; ++i) {
      data[i] = scale * data[i]
      scale -= scaleDelta
    }
  }

  private static taperStart(buffer: AudioBuffer, percent: number = 5) {
    const l = Math.floor(0.01 * percent * buffer.length)
    const data = buffer.getChannelData(0)
    let scale = 0.0
    const scaleDelta = 1 / l
    for (let i = 0; i !== l; ++i) {
      data[i] = scale * data[i]
      scale += scaleDelta
    }
  }
}
