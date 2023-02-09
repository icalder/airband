<template>
<v-card>
  <v-card-title>Channels</v-card-title>
  <v-card-text>
    <v-form ref="form" v-model="valid" @submit.prevent="createChannel">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="newChannel.name"
            :rules="nameRules"
            :counter="30"
            label="Name"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="newChannel.frequency"
            :rules="frequencyRules"
            :counter="9"
            label="Frequency"
            type="number"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="1">
          <v-text-field
            v-model="newChannel.gain"
            label="Gain"
            type="number"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="newChannel.tags" label="Tags"></v-text-field>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn type="submit" :disabled="!valid"> Add Channel </v-btn>
        </v-col>
      </v-row>
    </v-form>
    <draggable
      tag="v-list"
      v-model="channels"
      item-key="id"
      delay="100"
      delay-on-touch-only="true"
    >
      <template #item="{ element }">
        <v-list-item>
          <v-list-item-title>
            {{ element.name }} {{ element.frequency }} /
            {{ element.gain }}</v-list-item-title
          >
          <template v-slot:append>
            <v-list-item-action>
              <v-menu
                ref="menu"
                v-model="editState[element.id]"
                :close-on-content-click="false"
                :close-on-click="false"
              >
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <v-card>
                  <v-form>
                    <v-card-text>
                      <v-text-field
                        v-model="element.name"
                        :rules="nameRules"
                        :counter="30"
                        label="Name"
                        required
                      ></v-text-field>
                      <v-text-field
                        v-model="element.frequency"
                        :rules="frequencyRules"
                        :counter="9"
                        label="Frequency"
                        type="number"
                        required
                      ></v-text-field>
                      <v-text-field
                        v-model="element.gain"
                        label="Gain"
                        type="number"
                      ></v-text-field>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="grey darken-2"
                        dark
                        @click="editState[element.id] = false"
                        >CANCEL</v-btn
                      >
                      <v-btn color="primary" @click="editChannel(element)"
                        >OK</v-btn
                      >
                    </v-card-actions>
                  </v-form>
                </v-card>
              </v-menu>
            </v-list-item-action>
            <v-list-item-action>
              <v-btn icon @click.stop="deleteChannel(element.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </template>
    </draggable>
  </v-card-text>
</v-card>
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { ref, reactive, computed, Ref } from 'vue'

import { useChannelStore, Channel } from '@/composables/channels'
import { useChannelBank } from '@/composables/channelbank'

interface EditState {
  [key: number]: boolean
}

const channelStore = useChannelStore()
const channelBank = useChannelBank()

const { channels: _channels } = channelStore.state

const newChannel = reactive({
  name: '',
  frequency: 0,
  gain: 20,
  tags: '',
})
const valid = ref(false)
const editState: Ref<EditState> = ref({})

const channels = computed({
  get: () => _channels.value,
  set: (newChannels) => channelStore.replace(newChannels as Channel[]),
})

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) =>
    (v && v.length <= 30) || 'Name must be less than 30 characters',
]

const frequencyRules = [
  (v: string) => !!v || 'Frequency is required',
  (v: string) =>
    (v && v.length <= 9) || 'Frequency must be less than 9 characters',
  (v: string) => !isNaN(parseFloat(v)) || 'Frequency must be a number',
]

const createChannel = () => {
  const { name, frequency, gain, tags } = newChannel
  const channel = new Channel(name, frequency, gain)
  if (tags) {
    const tagArray = tags.split(',').map((t) => t.trim())
    channel.tags = tagArray
  }
  channelStore.add(channel)
}

const editChannel= (channel: Channel) => {
  channelStore.edit(channel)
  editState.value[channel.id] = false
}

const deleteChannel = (id: number) => {
  channelStore.delete(id)
  channelBank.remove(id)
}

</script>
