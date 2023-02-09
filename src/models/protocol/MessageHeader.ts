export enum MessageType {
  DEVICE_INFO = 0,
  CLIENT_SYNC = 1,
  PONG = 2,
  READ_SETTING = 3,
  UINT8_IQ = 100,
  INT16_IQ = 101,
  INT24_IQ = 102,
  FLOAT_IQ = 103,
  UINT8_AF = 200,
  INT16_AF = 201,
  INT24_AF = 202,
  FLOAT_AF = 203,
  DINT4_FFT = 300,
  UINT8_FFT = 301,
}

export const enum StreamType {
  STATUS = 0,
  IQ = 1,
  AF = 2,
  FFT = 4,
}

export class MessageHeader {
  static size = 20

  protocolVersion = ''
  messageType?: MessageType
  streamType?: StreamType
  sequence = 0
  length = 0

  constructor(buf: ArrayBuffer) {
    const data = new Uint32Array(buf)
    this.protocolVersion = this.parseProtocolVersion(data[0])
    this.messageType = data[1]
    this.streamType = data[2]
    this.sequence = data[3]
    this.length = data[4]
  }

  private parseProtocolVersion(protocol: number) {
    const major = protocol >> 24
    const minor = (protocol >> 16) & 0xFF
    const patch = protocol & 0xFFFF
    return `${major}.${minor}.${patch}`
  }
}
