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
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useSpyServer, useTuner } from '@/composables'


const spyServer = useSpyServer()
const tuner = useTuner()

const { fftSampleRate, iqSampleRate, deviceInfo } = spyServer.state
const { cutoff, fmMode } = tuner.state
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

function setFMMode (selected: boolean) {
  tuner.fmMode = selected
}

</script>
