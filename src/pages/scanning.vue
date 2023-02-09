<template>
  <v-card>
    <v-card-title>Scanning</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <v-list>
            <v-list-subheader>All channels</v-list-subheader>
            <v-list-item v-for="channel in channels" :key="channel.id">
              <v-list-item-title>{{ channel.name }}</v-list-item-title>
              <template v-slot:append>
                <v-list-item-action>
                  <v-btn icon @click.stop="scanChannel(channel)">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col cols="12" sm="6">
          <v-list>
            <v-list-subheader>Scan channels</v-list-subheader>
            <v-list-item v-for="channel in channelsToScan" :key="channel.id">
              <v-list-item-title>{{ channel.name }}</v-list-item-title>
              <template v-slot:append>
                <v-list-item-action>
                  <v-btn icon @click.stop="removeChannelFromScan(channel)">
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Channel, useChannelStore } from '@/composables/channels'
import { useChannelBank } from '@/composables/channelbank'

const channelStore = useChannelStore()
const scanList = useChannelBank()

const { channels } = channelStore.state
const { channels: channelIdsToScan } = scanList.state

const channelsToScan = computed(() =>
  channelIdsToScan.value.filter(id => channels.value.find(ch => ch.id === id))
  .map(id => channels.value.find(ch => ch.id === id)!!)
)

function scanChannel (channel: Channel) {
  scanList.add(channel)
}

function removeChannelFromScan (channel: Channel) {
  scanList.remove(channel)
}
</script>
