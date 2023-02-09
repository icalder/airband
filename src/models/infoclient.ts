// This is just an example 'service' which is to be globally available in the nuxt/Vue context
export class InfoClient {
  get version() {
    return process.env.INFOCLIENT_VERSION ?? 'InfoClient version unknown!'
  }
}
