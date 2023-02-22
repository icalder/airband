import { SampleRateChangedCallback } from '@/composables/spyserver'

export type DemodulatedSignalHandler = (signal: Float32Array) => void
export type SignalDetectedHandler = (signalDetected: boolean) => void

export interface Tuner {
  addSampleRateChangedCallback(callback: SampleRateChangedCallback): void
  addDemodulatedSignalHandler(callback: DemodulatedSignalHandler): void
  addSignalDetectedHandler(callback: SignalDetectedHandler): void
  setMaxGain(maxGain: number): void
  tune(frequency: number): Promise<void>
  signalPresent: boolean
}
