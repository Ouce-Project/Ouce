import { $ } from './lib/dom.js'
import { rateOf } from './lib/fx.js'
import { tagOf } from './lib/track.js'
import { makeImpulse } from './engine.js'
import { mine, state } from './state.js'
import { toast } from './ui.js'

const MAX_SECONDS = 15 * 60
const REVERB_TAIL = 3

async function render(blob, fx) {
  const probe = new AudioContext()
  const buffer = await probe.decodeAudioData(await blob.arrayBuffer())
  const sampleRate = probe.sampleRate
  probe.close()
  if (buffer.duration > MAX_SECONDS) throw new Error('faixa longa demais')

  const rate = rateOf(fx)
  const seconds = buffer.duration / rate + (fx.reverb > 0 ? REVERB_TAIL : 0.1)
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate)

  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = rate

  const low = ctx.createBiquadFilter()
  low.type = 'lowshelf'
  low.frequency.value = 140
  low.gain.value = fx.bass * 15

  const dry = ctx.createGain()
  dry.gain.value = 1 - fx.reverb * 0.25
  const wet = ctx.createGain()
  wet.gain.value = fx.reverb * 0.6
  const verb = ctx.createConvolver()
  verb.buffer = makeImpulse(ctx)

  src.connect(low)
  low.connect(dry)
  low.connect(verb)
  verb.connect(wet)
  dry.connect(ctx.destination)
  wet.connect(ctx.destination)
  src.start()
  return ctx.startRendering()
}

function toWav(buffer) {
  const channels = buffer.numberOfChannels
  const length = buffer.length
  const bytes = length * channels * 2
  const view = new DataView(new ArrayBuffer(44 + bytes))
  const text = (offset, str) => [...str].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))

  text(0, 'RIFF')
  view.setUint32(4, 36 + bytes, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, bytes, true)

  const data = Array.from({ length: channels }, (_, i) => buffer.getChannelData(i))
  let peak = 0
  for (const ch of data) for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(ch[i]))
  const gain = peak > 0.98 ? 0.98 / peak : 1

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < channels; c++) {
      const v = data[c][i] * gain
      view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([view], { type: 'audio/wav' })
}

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export async function downloadEdited() {
  const n = state.now
  if (!n.blob) return toast('Abra uma música primeiro.')
  if (n.id !== null && !mine(n.id)) return toast('Só dá para baixar músicas suas ou arquivos que você abriu.')

  const btn = $('#dlBtn')
  btn.disabled = true
  btn.classList.add('busy')
  toast('Preparando o arquivo…')
  try {
    const wav = toWav(await render(n.blob, state.fx))
    const tag = tagOf(state.fx)
    const name = `${n.title}${tag ? ` (${tag})` : ''}.wav`.replace(/[\\/:*?"<>|]+/g, '')
    save(wav, name)
    toast('Download pronto')
  } catch (err) {
    console.error(err)
    toast(err.message === 'faixa longa demais' ? 'Essa faixa passa de 15 minutos, é longa demais.' : 'Não consegui gerar o arquivo.')
  } finally {
    btn.disabled = false
    btn.classList.remove('busy')
  }
}
