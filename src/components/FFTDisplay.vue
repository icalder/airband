<template>
  <canvas
    id="fft"
    width="1000"
    height="200"
    style="width: 100%; height: 100%"
  ></canvas>
</template>

<script lang="ts">
  export default {
    name: "FftDisplay"
  }
</script>

<script lang="ts" setup>
import {
  onMounted,
  watch,
  toRefs,
} from 'vue'

const WIDTH = 1000
const HEIGHT = 200

const props = defineProps<{
  fft: Uint8Array,
  frequency?: String | Number,
  gain?: String | Number,
  signalLock?: Number
}>()

const { fft, frequency, gain, signalLock } = toRefs(props)
let fftCanvas: HTMLCanvasElement
let canvasCtx: CanvasRenderingContext2D

function draw() {
  // const drawVisual = requestAnimationFrame(draw)
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)
  canvasCtx.beginPath()
  const bufferLength = props.fft.length
  const sliceWidth = (WIDTH * 1.0) / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {
    const v = props.fft[i] / 256
    const y = HEIGHT - (v * HEIGHT) / 2

    if (i === 0) {
      canvasCtx.moveTo(x, y)
    } else {
      canvasCtx.lineTo(x, y)
    }

    x += sliceWidth
  }
  canvasCtx.stroke()
  drawCentreLine()
  drawFrequency()
  drawGain()
  drawSignalLock()
}

function drawCentreLine() {
  const { lineWidth, strokeStyle } = canvasCtx
  const lineDash = canvasCtx.getLineDash()
  canvasCtx.setLineDash([5, 10])
  canvasCtx.lineWidth = 1
  canvasCtx.strokeStyle = 'lime'
  canvasCtx.moveTo(WIDTH / 2, 0)
  canvasCtx.lineTo(WIDTH / 2, HEIGHT)
  canvasCtx.stroke()
  // Restore previous settings
  canvasCtx.setLineDash(lineDash)
  canvasCtx.lineWidth = lineWidth
  canvasCtx.strokeStyle = strokeStyle
}

function drawFrequency() {
  if (frequency?.value) {
    drawText(
      frequency.value.toString(),
      (width: number) => WIDTH / 2 - width / 2
    )
  }
}

function drawGain() {
  if (gain?.value) {
    const txt = `G: ${gain.value}`
    drawText(txt, (width: number) => WIDTH - width)
  }
}

function drawSignalLock() {
  if (signalLock?.value) {
    const txt = `L: ${signalLock.value.toFixed(2)}`
    drawText(txt, (width: number) => 0)
  }
}

function drawText(txt: string, xpos: (width: number) => number) {
  const measurements = canvasCtx.measureText(txt)
  const x = xpos(measurements.width)
  const saveStyle = canvasCtx.fillStyle
  canvasCtx.fillStyle = 'white'
  canvasCtx.fillText(txt, x, 0)
  canvasCtx.fillStyle = saveStyle
}

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
// https://www.chartjs.org/docs/master/developers/charts/
onMounted(() => {
  fftCanvas = document.getElementById('fft') as HTMLCanvasElement
  const ctx2d = fftCanvas.getContext('2d')
  if (!ctx2d) {
    return
  }
  canvasCtx = ctx2d
  canvasCtx.font = '28px serif'
  canvasCtx.textBaseline = 'top'
  canvasCtx.fillStyle = 'rgb(0, 0, 0)'
  canvasCtx.lineWidth = 2
  canvasCtx.strokeStyle = 'rgb(200, 200, 200)'
  drawFrequency()
  drawGain()
})

watch(fft, () => {
  if (document.visibilityState === 'visible') {
    draw()
  }
})

</script>
