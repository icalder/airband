import { reactive, toRefs } from 'vue'

const state = reactive({
  messages: [] as string[],
  visible: true,
})

export function useDebugConsole() {
  const addMessage = (msg: string) => {
    if (state.messages.length > 2) {
      state.messages.pop()
    }
    state.messages.push(msg)
  }

  return {
    addMessage,
    state: toRefs(state),
  }
}
