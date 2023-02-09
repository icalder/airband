<template>
  <v-row v-if="connected && deviceInfo" no-gutters>
    <v-col cols="3" lg="2">
      <v-card outlined tile> Device: {{ deviceType }}</v-card>
    </v-col>
    <v-col cols="3" lg="2">
      <v-card outlined tile> Min freq: {{ minFreqMHz }}</v-card>
    </v-col>
    <v-col cols="3" lg="2">
      <v-card outlined tile> Max freq: {{ maxFreqMHz }}</v-card>
    </v-col>
    <v-col cols="3" lg="2">
      <v-card outlined tile> Max gain: {{ deviceInfo.maxGain }}</v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
// https://medium.com/@claus.straube/responsive-web-apps-with-vuetify-80bd3959165f

import { useSpyServer } from '@/composables'
import { DeviceType } from '@/models/protocol/DeviceInfo'
import { computed } from 'vue';

const spyServer = useSpyServer()
const connected = spyServer.connected
const { deviceInfo } = spyServer.state
const minFreqMHz = computed(() => `${deviceInfo.value!.minFrequency / 1e6}MHz`)
const maxFreqMHz = computed(() => `${deviceInfo.value!.maxFrequency / 1e6}MHz`)
const deviceType = computed(() => {
  const deviceTypeId = deviceInfo.value?.deviceType
  return deviceTypeId
    ? DeviceType[deviceTypeId]
    : DeviceType[DeviceType.INVALID]
})

</script>
