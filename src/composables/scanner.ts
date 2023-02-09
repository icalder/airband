import { reactive, toRefs } from 'vue'
import { Channel } from './channels'
import { Tuner } from '@/lib/Tuner'

export class Scanner {
  private _state = reactive({
    scanning: false,
    target: undefined as undefined | Channel,
  })

  // eslint-disable-next-line no-useless-constructor
  constructor(private tuner: Tuner) {}

  public async scan(channels: Channel[], bank: number[]) {
    const scanTargets: Channel[] = []
    bank.forEach((channelId) => {
      const channel = channels.find((ch) => ch.id === channelId)
      if (channel) {
        scanTargets.push(channel)
      }
    })
    if (scanTargets.length < 2) {
      return
    }

    let targetIdx = 0
    this._state.scanning = true
    while (this._state.scanning) {
      this._state.target = scanTargets[targetIdx]
      try {
        await this.tuner.tune(this._state.target.frequency)
      } catch (error) {
        this._state.scanning = false
        break
      }
      let signalPresent = this.tuner.signalPresent
      while (signalPresent && this._state.scanning) {
        await this.signalNotPresent(this.tuner)
        await this.dwell()
        // Check if the signal has returned
        signalPresent = this.tuner.signalPresent
      }
      targetIdx = (targetIdx + 1) % scanTargets.length
    }
  }

  private signalNotPresent(tuner: Tuner): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (!tuner.signalPresent) {
          clearInterval(timer)
          resolve()
        }
      }, 1000)
    })
  }

  private dwell(): Promise<void> {
    return new Promise<void>((resolve) => {
      // TODO make dwell time configurable
      setTimeout(resolve, 3000)
    })
  }

  public stop() {
    this._state.scanning = false
  }

  get state() {
    return toRefs(this._state)
  }
}
