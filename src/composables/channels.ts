import { reactive, toRefs } from 'vue'

export class Channel {
  // private fields don't play well with reactive/proxy
  _id: number = 0
  tags: string[] = []

  static nextId: number = 0

  // eslint-disable-next-line no-useless-constructor
  constructor(
    public name: string,
    public frequency: number,
    public gain: number
  ) {
    this._id = Channel.nextId++
  }

  get id() {
    return this._id
  }
}

// TODO this shouldn't be embedded here?
// http://www.nats-uk.ead-it.com/aip/vfrcharts/Freqref/SEngland_FRC_whole.pdf
const defaultChannels = [
  new Channel('Birmingham Radar', 123.975, 25),
  new Channel('London 133.6', 133.6, 25),
  new Channel('Gloster Approach', 128.55, 25),
  new Channel('Bristol Radar', 125.65, 25),
  new Channel('London FIS', 124.75, 25),
  new Channel('Gloucester ATIS', 127.475, 25),
  new Channel('Gloster Tower', 122.902, 25),
  new Channel('Cardiff Radar', 125.85, 25),
  new Channel('Cardiff LARS', 119.15, 25),
  new Channel('Brize LARS', 124.275, 25),
  new Channel('EGTL_NW_CTR', 130.925, 25),
  new Channel('East Mids Radar', 126.175, 25),
  new Channel('Scottish STAFA', 134.425, 25),
  new Channel('Berry Hd Standby', 135.25, 25),
  new Channel('Brize Approach', 127.25, 25),
  new Channel('London 134.125', 134.125, 25),
  new Channel('GUARD', 121.5, 25),
  new Channel('Daventry', 127.1, 25),
  new Channel('Scottish 128.05', 128.05, 25),
  new Channel('London 135.575', 135.575, 25),
  new Channel('London Lakes', 133.705, 25),
  new Channel('Scottish Mids', 118.775, 25),
  new Channel('Berry Hd / Cotswold', 134.75, 25),
  new Channel('Radio 4 FM', 93.4, 5),
  new Channel('Heart FM', 102.4, 1),
]

class ChannelStore {
  private _state = reactive<{ channels: Channel[] }>({
    channels: []
  })

  constructor() {
    this.load()
    if (this._state.channels.length === 0) {
      defaultChannels.forEach((ch) => this.add(ch))
    }
  }

  // Can also be used to edit an existing channel
  public add(channel: Channel) {
    const existing = this._state.channels.find((ch) => ch.id === channel.id)
    if (existing) {
      this.delete(channel.id)
    }
    this._state.channels.push(channel)
    this.save()
  }

  public edit(channel: Channel) {
    const pos = this._state.channels.findIndex((ch) => ch.id === channel.id)
    this._state.channels[pos] = channel
    this.save()
  }

  public delete(id: number) {
    this._state.channels = this._state.channels.filter((ch) => ch.id !== id)
    this.save()
  }

  public replace(channels: Channel[]) {
    this._state.channels = channels
    this.save()
  }

  private load() {
    if (window.localStorage) {
      const savedChannels = window.localStorage.getItem('channels')
      if (savedChannels) {
        const jsonObjs = JSON.parse(savedChannels) as any[]
        jsonObjs.forEach((obj) => {
          Object.setPrototypeOf(obj, Channel.prototype)
          this._state.channels.push(obj)
        })
        if (this._state.channels.length > 0) {
          const maxIdChannel = this._state.channels.reduce((ch1, ch2) =>
            ch1.id > ch2.id ? ch1 : ch2
          )
          Channel.nextId = maxIdChannel.id + 1
        }
      }
    }
  }

  private save() {
    if (window.localStorage) {
      window.localStorage.setItem(
        'channels',
        JSON.stringify(this._state.channels)
      )
    }
  }

  get state() {
    return toRefs(this._state)
  }
}

const store = new ChannelStore()

export function useChannelStore() {
  return store
}
