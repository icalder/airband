import { reactive, toRefs } from 'vue'
import { Channel } from './channels'

// simple event bus implementation
// https://gist.github.com/Mgorunuch/16fcccf4537bf2bcfb33645c62761b3f

class ChannelBank {
  private _state = reactive({
    channels: [] as number[],
  })

  constructor() {
    this.load()
  }

  public add(ch: Channel) {
    if (!this._state.channels.includes(ch.id)) {
      this._state.channels.push(ch.id)
      this.save()
    }
  }

  public remove(ch: number | Channel) {
    if (ch instanceof Channel) {
      ch = ch.id
    }
    const idx = this._state.channels.indexOf(ch)
    if (idx > -1) {
      this._state.channels.splice(idx, 1)
      this.save()
    }
  }

  get state() {
    return toRefs(this._state)
  }

  private load() {
    if (window.localStorage) {
      const savedChannels = window.localStorage.getItem('channelBank')
      if (savedChannels) {
        this._state.channels = JSON.parse(savedChannels)
      }
    }
  }

  private save() {
    if (window.localStorage) {
      window.localStorage.setItem(
        'channelBank',
        JSON.stringify(this._state.channels)
      )
    }
  }
}

const bank = new ChannelBank()

export function useChannelBank() {
  return bank
}
