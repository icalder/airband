import { Command, CommandType } from './command'
import { WSClient } from '~/lib/wsclient'

export class PingCommand extends Command {
  constructor() {
    super(CommandType.CMD_PING)
  }

  send(client: WSClient): void {
    this.sendWithArgs(client, new ArrayBuffer(0))
  }
}
