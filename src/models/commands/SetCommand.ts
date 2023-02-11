import { Command, CommandType } from './Command'
import { WSClient } from '@/lib/wsclient'

// https://github.com/miweber67/spyserver_client/blob/master/spyserver_protocol.h

export enum SettingType {
  STREAMING_MODE = 0,
  STREAMING_ENABLED = 1,
  GAIN = 2,
  IQ_FORMAT = 100,
  IQ_FREQUENCY = 101,
  IQ_DECIMATION = 102,
  IQ_DIGITAL_GAIN = 103,
  FFT_FORMAT = 200,
  FFT_FREQUENCY = 201,
  FFT_DECIMATION = 202,
  FFT_DB_OFFSET = 203,
  FFT_DB_RANGE = 204,
  FFT_DISPLAY_PIXELS = 205,
}

export enum StreamFormat {
  STREAM_FORMAT_INVALID = 0,
  STREAM_FORMAT_UINT8 = 1,
  STREAM_FORMAT_INT16 = 2,
  STREAM_FORMAT_INT24 = 3,
  STREAM_FORMAT_FLOAT = 4,
  STREAM_FORMAT_DINT4 = 5,
}

export enum StreamType {
  STREAM_TYPE_STATUS = 0,
  STREAM_TYPE_IQ = 1,
  STREAM_TYPE_AF = 2,
  STREAM_TYPE_FFT = 4,
}

export class SetCommand extends Command {
  constructor(private settingType: SettingType, private value: number) {
    super(CommandType.CMD_SET_SETTING)
  }

  send(client: WSClient): void {
    const buf = new Uint32Array(2)
    buf[0] = this.settingType.valueOf()
    buf[1] = this.value
    this.sendWithArgs(client, buf.buffer)
  }
}
