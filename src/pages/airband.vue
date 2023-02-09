<template>
  <div>
    <v-card elevation="2">
      <v-container v-if="connected">
        <v-tabs v-model="tab">
          <v-tab value="tuning">Tuning</v-tab>
          <v-tab value="settings">Settings</v-tab>
        </v-tabs>
        <v-window class="mt-3" v-model="tab">
          <v-window-item value="tuning">
            <v-row align="center">
              <v-col v-if="!scanning" cols="4">
                  <v-select
                    v-model="selectedChannel"
                    :items="channels"
                    item-title="name"
                    item-value="frequency"
                    :return-object="true"
                    label="Channel"
                    required
                    v-on:update:model-value="tuneChannel"
                  >
                  </v-select>
                </v-col>
                <v-col v-if="!scanning">
                  <v-menu
                    v-model="tuningMenuOpen"
                    offset-y
                    :close-on-click="false"
                    :close-on-content-click="false"
                  >
                    <template v-slot:activator="{ props }">
                      <v-btn class="ml-2" color="primary" v-bind="props">
                        Tune
                      </v-btn>
                    </template>
                    <v-card>
                      <v-form @submit.prevent="tuneFrequency()">
                        <v-card-text>
                          <v-text-field v-model="enteredFreq"></v-text-field>
                          <v-toolbar>
                            <v-btn @click="freqKeypadButtonPressed(1)">1</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(2)">2</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(3)">3</v-btn>
                          </v-toolbar>
                          <v-toolbar>
                            <v-btn @click="freqKeypadButtonPressed(4)">4</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(5)">5</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(6)">6</v-btn>
                          </v-toolbar>
                          <v-toolbar>
                            <v-btn @click="freqKeypadButtonPressed(7)">7</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(8)">8</v-btn>
                            <v-btn @click="freqKeypadButtonPressed(9)">9</v-btn>
                          </v-toolbar>
                          <v-toolbar>
                            <v-btn @click="freqKeypadButtonPressed(0)">0</v-btn>
                            <v-btn @click="freqKeypadButtonPressed('.')"
                              >.</v-btn
                            >
                            <v-btn @click="freqKeypadButtonPressed('DEL')"
                              ><v-icon>
                                {{ `mdi-backspace` }}
                              </v-icon></v-btn
                            >
                          </v-toolbar>
                        </v-card-text>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn
                            color="grey darken-2"
                            dark
                            @click="tuningMenuOpen = false"
                            >CANCEL</v-btn
                          >
                          <v-btn color="primary" @click="tuneFrequency()"
                            >OK</v-btn
                          >
                        </v-card-actions>
                      </v-form>
                    </v-card>
                  </v-menu>
              </v-col>
              <v-col v-else> {{ target?.name }} </v-col>
            </v-row>
            <v-toolbar class="px-0 mx-0 tuner-buttons">
              <v-toolbar-items>
                <v-btn :color="streamingButtonColour" @click="toggleStreaming">
                  <v-icon>
                    {{ `mdi-${streamingButtonIcon}` }}
                  </v-icon>
                </v-btn>
                <v-btn
                  class="ml-md-5 ml-1"
                  :color="audioButtonColour"
                  @click="toggleAudio"
                >
                  <v-icon>
                    {{ `mdi-${audioButtonIcon}` }}
                  </v-icon>
                </v-btn>
                <v-btn
                  class="ml-md-5 ml-1"
                  :color="scanButtonColour"
                  @click="toggleScanning"
                >
                  <v-icon>
                    {{ `mdi-${scanButtonIcon}` }}
                  </v-icon>
                </v-btn>
              </v-toolbar-items>
              <v-toolbar-items>
                <v-btn @click="decreaseVolume">
                  <v-icon>mdi-volume-minus</v-icon>
                </v-btn>
              </v-toolbar-items>
              <v-chip class="rounded-circle">{{ volume }}</v-chip>
              <v-toolbar-items>
                <v-btn @click="increaseVolume">
                  <v-icon>mdi-volume-plus</v-icon>
                </v-btn>
              </v-toolbar-items>
            </v-toolbar>
          </v-window-item>
          <v-window-item value="settings">
            <receive-settings />
          </v-window-item>
        </v-window>
      </v-container>
    </v-card>
    <v-card style="position: relative">
      <v-container class="mt-2">
        <fft-display
          :fft="fft"
          :frequency="displayFrequency"
          :gain="displayGain"
        />
      </v-container>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  Ref,
} from 'vue'

import {
  useScanner,
  useSpyServer,
  useStreamPlayer,
  useTuner,
} from '@/composables'
import { Channel, useChannelStore } from '@/composables/channels'
import { useChannelBank } from '@/composables/channelbank'
import ReceiveSettings from '@/components/ReceiveSettings.vue'
import FftDisplay from '@/components/FFTDisplay.vue'

const channelStore = useChannelStore()
const { channels } = channelStore.state

const scanList = useChannelBank()

const spyServer = useSpyServer()
const {
  frequency: tunedFreq,
  clientSync,
  streaming,
  // gainSettings,
} = spyServer.state
const { fft } = spyServer.samples

const tuner = useTuner()

const player = useStreamPlayer()
const { playing, volume } = player.state

const scanner = useScanner()
const { scanning, target } = scanner.state

const selectedChannel: Ref<undefined | Channel> = ref(undefined)

const enteredFreq = ref('')
const tuningMenuOpen = ref(false)

const tab = ref(null)
const connected = spyServer.connected

const streamingButtonIcon = computed(() => streaming.value ? 'stop' : 'play')
const streamingButtonColour = computed(() =>streaming.value ? 'green' : 'red')
const audioButtonIcon = computed(() => playing.value ? 'volume-off' : 'volume-high')
const audioButtonColour = computed(() => playing.value ? 'green' : 'red')
const scanButtonIcon = computed(() => scanning.value ? 'close-octagon' : 'refresh')
const scanButtonColour = computed(() => scanning.value ? 'green' : 'red')
const displayFrequency = computed(() => tunedFreq.value.toString())
const displayGain = computed(() => clientSync.value?.gain || 0)

async function tuneChannel(ch: Channel) {
  console.log(`tuneChannel ${ch.name}`)
  await tuner.tune(ch.frequency)
  tuner.resetAGCGain(ch.gain)
}

async function tuneFrequency () {
  await tuner.tune(parseFloat(enteredFreq.value))
  // TODO hard coding!!!
  tuner.resetAGCGain(15)
  tuningMenuOpen.value = false
  selectedChannel.value = undefined
}

function toggleStreaming() {
  if (streaming.value) {
    spyServer.stopStreaming()
    scanner.stop()
    player.stop()
  } else {
    spyServer.startStreaming()
  }
}

function toggleAudio () {
  if (playing.value) {
    player.stop()
  } else {
    player.start()
  }
}

function toggleScanning () {
  if (scanning.value) {
    scanner.stop()
    if (target) {
      selectedChannel.value = target.value as Channel
    }
  } else {
    scanner.scan(
      channels.value as Channel[],
      scanList.state.channels.value
    )
  }
}

function increaseVolume () {
  volume.value += 1
}

function decreaseVolume () {
  volume.value -= 1
}

function freqKeypadButtonPressed(btn: string | number) {
  if (typeof btn === 'number') {
    enteredFreq.value += btn.toString()
    return
  }
  switch (btn) {
    case '.':
      if (enteredFreq.value !== '' && !enteredFreq.value.endsWith('.')) {
        enteredFreq.value += '.'
      }
      break
    case 'CLR':
      enteredFreq.value = ''
      break
    case 'DEL':
      enteredFreq.value = enteredFreq.value.slice(0, -1)
  }
}

</script>
<style>
.tuner-buttons .v-toolbar__content {
  padding-left: 0px;
}
</style>
