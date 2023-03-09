<template>
  <v-row>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          v-model="fftSampleRate"
          label="FFT Sample Rate"
          :items=fftSampleRates
          v-on:update:model-value="setFFTSampleRate"
        ></v-select>
      </v-form>
    </v-col>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          v-model="iqSampleRate"
          label="IQ Sample Rate"
          :items="iqSampleRates"
          v-on:update:model-value="setIQSampleRate"
        ></v-select>
      </v-form>
    </v-col>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          label="Filter"
          :items=filters
          v-model="cutoff"
          v-on:update:model-value="setFilter"
        ></v-select>
      </v-form>
    </v-col>
    <v-col cols="12" sm="3">
      <v-form>
        <v-checkbox
          v-model="fmMode"
          label="FM Mode"
        ></v-checkbox>
      </v-form>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          label="Max gain"
          :items=gainSettings
          v-model="maxGain"
          v-on:update:model-value="setMaxGain"
        ></v-select>
      </v-form>
    </v-col>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          label="Squelch"
          :items=squelchSettings
          v-model="squelch"
        ></v-select>
      </v-form>
    </v-col>
    <v-col cols="12" sm="3">
      <v-form>
        <v-select
          label="Peak detection (DB)"
          :items=peakDetectionThresholdDbSettings
          v-model="peakDetectionThresholdDb"
        ></v-select>
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { computed, Ref, ref } from 'vue'
import { useScanner, useSpyServer, useTuner } from '@/composables'


const spyServer = useSpyServer()
const tuner = useTuner()
const scanner = useScanner()

const { fftSampleRate, iqSampleRate, deviceInfo } = spyServer.state
const { cutoff, fmMode, maxGain, squelch } = tuner.state
const { peakDetectionThresholdDb } = scanner.state

const gainSettings: Ref<number[]> = ref([...Array(deviceInfo.value?.maxGain).keys()])

const filters = [
  0,
  3000,
  3200,
  3300,
  3400,
  3500,
  3750,
  4000,
  8000,
  75000,
  150000,
]

const squelchSettings = [
  0.05,
  0.1,
  0.15,
  0.2,
  0.25,
  0.3,
  0.4,
  0.5
]

const peakDetectionThresholdDbSettings = [1, 2, 3]

const fftSampleRates = computed(() => deviceInfo.value?.availableSampleRates)
const iqSampleRates = computed(() =>
  deviceInfo.value?.availableSampleRates.filter((r) => r < 380000)
)

function setFFTSampleRate (rate: number) {
  spyServer.setFFTSampleRate(rate)
}

function setIQSampleRate (rate: number) {
  tuner.setSampleRate(rate)
}

function setFilter (cutoff: number) {
  if (cutoff === 0) {
    tuner.stopFiltering()
    return
  }
  tuner.startFiltering(cutoff)
}

function setMaxGain(maxGain: number) {
  tuner.setMaxGain(maxGain)
}
</script>
