import { SpyServer } from './spyserver'
import { SpyServerTuner } from './tuner'
import { Scanner } from './scanner'
import { PCMStreamPlayer } from '@/lib/PCMStreamPlayer'

const spyServer = new SpyServer()
const tuner = new SpyServerTuner(spyServer)
const player = new PCMStreamPlayer(tuner)
const scanner = new Scanner(tuner, spyServer)

export function useSpyServer() {
  return spyServer
}

export function useTuner() {
  return tuner
}

export function useStreamPlayer() {
  return player
}

export function useScanner() {
  return scanner
}
