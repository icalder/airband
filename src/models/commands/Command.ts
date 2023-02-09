import { WSClient } from '~/lib/wsclient'

export enum CommandType {
  CMD_HELLO,
  CMD_GET_SETTING,
  CMD_SET_SETTING,
  CMD_PING,
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays

export abstract class Command {
  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly commandType: CommandType) {}

  abstract send(client: WSClient): void

  protected sendWithArgs(client: WSClient, args: ArrayBuffer) {
    // 4 bytes command type ordinal
    // 4 bytes length of args
    // then the args
    const commandHeader = new Int32Array(2)
    commandHeader[0] = this.commandType.valueOf()
    commandHeader[1] = args.byteLength
    const payload = new Uint8Array(args.byteLength + 8)
    // NB don't try to do:
    // payload.set(commandHeader)
    // as it will copy each int value into a single byte
    // - need to copy the underlying buffer bytes instead with a byte view
    payload.set(new Uint8Array(commandHeader.buffer))
    payload.set(new Uint8Array(args), 8)
    client.send(payload.buffer)
  }
}
