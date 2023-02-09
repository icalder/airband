<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-btn icon @click.stop="fixed = !fixed">
        <v-icon>mdi-minus</v-icon>
      </v-btn>
      <v-toolbar-title>
        <router-link to="/" custom v-slot="{ navigate }">
          <span class="pointer" @click="navigate" role="link">Airband</span>
        </router-link>
      </v-toolbar-title>
      <v-spacer />
      <connection-status />
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" app>
      <v-list nav>
        <v-list-item
          v-for="item in items"
          :key="item.route"
          router
          :to="item.route"
        >
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    <v-footer :absolute="!fixed" app>
      <device-info />
    </v-footer>
  </v-app>
</template>

<script lang="ts" setup>

import { ref } from 'vue'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import DeviceInfo from '@/components/DeviceInfo.vue'

const drawer = ref(false)
const fixed = ref(false)
const items = [
  { icon: 'mdi-clipboard-list', title: 'Channels', route: '/channels' },
  { icon: 'mdi-refresh', title: 'Scanning', route: '/scanning' },
]

</script>

<style lang="scss" scoped>
.pointer {
  cursor: pointer;
}
</style>