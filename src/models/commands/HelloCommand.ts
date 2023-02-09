import { Command, CommandType } from './command'
import { WSClient } from '@/lib/wsclient'

const SPYSERVER_PROTOCOL_VERSION = (2 << 24) | (0 << 16) | 1700

export class HelloCommand extends Command {
  constructor(private clientId: string) {
    super(CommandType.CMD_HELLO)
  }

  send(client: WSClient): void {
    // Get client ID bytes first, so we can allocate correctly sized args buffer
    const enc = new TextEncoder()
    const clientIdBytes = enc.encode(this.clientId)
    const buf = new ArrayBuffer(clientIdBytes.length + 4)
    // We can't create a Int32Array view here because the length of buf
    // may not be a multiple of 4, so use a DataView instead
    const protocolArg = new DataView(buf)
    protocolArg.setInt32(0, SPYSERVER_PROTOCOL_VERSION, true)
    const clientIdArg = new Uint8Array(buf, 4)
    clientIdArg.set(clientIdBytes)
    this.sendWithArgs(client, buf)
  }
}
