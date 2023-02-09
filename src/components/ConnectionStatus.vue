<template>
  <div>
    <!-- For md and above screens -->
    <v-form class="d-none d-md-flex">
      <v-container>
        <v-row>
          <v-col cols="auto"
            ><v-text-field
              v-model="addr"
              :disabled="connected"
              size="25"
              hide-details="auto"
              :error-messages="errors.messages"
            ></v-text-field
          ></v-col>
          <v-col cols="auto"
            ><v-btn :color="buttonColour" @click.stop="toggleConnect()">{{
              buttonLabel
            }}</v-btn></v-col
          >
        </v-row>
      </v-container>
    </v-form>
    <!-- Disconnect button for xs and sm screens, only shown if connected -->
    <v-form v-if="connected" class="d-xs-flex d-sm-flex d-md-none">
      <v-container>
        <v-row>
          <v-col cols="auto"
            ><v-btn :color="buttonColour" @click.stop="toggleConnect()">{{
              buttonLabel
            }}</v-btn></v-col
          >
        </v-row>
      </v-container>
    </v-form>
    <!-- Menu open button is only displayed for xs and sm screens" -->
    <v-menu
      v-if="!connected"
      v-model="menuOpen"
      offset-y
      :close-on-click="false"
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          :color="buttonColour"
          class="d-xs-flex d-sm-flex d-md-none"
          v-bind="props"
          >{{ buttonLabel }}</v-btn
        >
      </template>
      <v-card>
        <v-form>
          <v-card-text>
            <v-text-field
              v-model="addr"
              label="addr"
              :disabled="connected"
              size="25"
              hide-details="auto"
              :error-messages="errors.messages"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-2" dark @click="menuOpen = false"
              >CANCEL</v-btn
            >
            <v-btn color="primary" @click="toggleConnect()">OK</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  reactive,
  computed,
  watch,
} from 'vue'
import { useScanner, useSpyServer } from '@/composables'

const spyServer = useSpyServer()
const scanner = useScanner()

const addr = ref('ws://pi4:8888/')

const connected = spyServer.connected
const errors = reactive({
  messages: [] as string[],
})
const menuOpen = ref(false)
watch(connected, (val: any) => {
  if (menuOpen.value && val) {
    menuOpen.value = false
  }
})

const buttonColour = computed(() => (connected.value ? 'green' : 'red'))
const buttonLabel = computed(() => (connected.value ? 'Disconnect' : 'Connect'))

spyServer.addErrorHandler((err) => errors.messages.push(err.message))
  
const toggleConnect = () => {
  if (connected.value) {
    scanner.stop()
    spyServer.disconnect()
  } else {
    errors.messages = []
    spyServer.connect(addr.value)
  }
}
   
</script>
