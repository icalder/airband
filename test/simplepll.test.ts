import { assert, expect, test } from 'vitest'
import { oscillator, SimplePLL } from '../src/lib/dsp'

// https://liquidsdr.org/blog/pll-simple-howto/
test('SimplePLL', () => {

  let phase_in = 3.0
  const frequency_in = -0.20
  const n = 400
  const pll = new SimplePLL(0.05)

  for (let i = 0; i < n; i++) {
    const signal_in = oscillator(phase_in)
    const signal_out = pll.run(signal_in)
    phase_in += frequency_in
    console.log(i, signal_in[0].toFixed(8), signal_in[1].toFixed(8), pll.deltaPhi.toFixed(8))
  }
})

test('Math.sqrt()', () => {
  expect(Math.sqrt(4)).toBe(2)
  expect(Math.sqrt(144)).toBe(12)
  expect(Math.sqrt(2)).toBe(Math.SQRT2)
})

test('JSON', () => {
  const input = {
    foo: 'hello',
    bar: 'world',
  }

  const output = JSON.stringify(input)

  expect(output).eq('{"foo":"hello","bar":"world"}')
  assert.deepEqual(JSON.parse(output), input, 'matches original')
})