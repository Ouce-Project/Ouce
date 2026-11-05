import { $, clamp } from './lib/dom.js'
import { store } from './lib/store.js'
import { state } from './state.js'

const DEFAULT_ACCENT = '#0330ef'

const hexToRgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

const rgbToHex = rgb => '#' + rgb.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')

function normalizeHex(input) {
  let v = String(input).trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(v)) v = [...v].map(c => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : null
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const hue = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [hue * 60, s, l]
}

function hslToRgb(hue, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function pickAccent(img) {
  const size = 48
  const cv = Object.assign(document.createElement('canvas'), { width: size, height: size })
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, size, size)
  const { data } = g.getImageData(0, 0, size, size)
  const bins = Array.from({ length: 36 }, () => ({ w: 0, r: 0, g: 0, b: 0 }))
  let sumR = 0, sumG = 0, sumB = 0, count = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue
    const [r, gr, b] = [data[i], data[i + 1], data[i + 2]]
    sumR += r; sumG += gr; sumB += b; count++
    const [hue, s, l] = rgbToHsl(r, gr, b)
    if (l < 0.12 || l > 0.92) continue
    const w = s * s * (1 - Math.abs(2 * l - 1))
    const bin = bins[Math.floor(hue / 10) % 36]
    bin.w += w; bin.r += r * w; bin.g += gr * w; bin.b += b * w
  }
  if (!count) return null
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a))
  if (best.w > Math.max(2, count * 0.01)) {
    const [hue, s, l] = rgbToHsl(best.r / best.w, best.g / best.w, best.b / best.w)
    return rgbToHex(hslToRgb(hue, clamp(s, 0.55, 0.95), clamp(l, 0.42, 0.58)))
  }
  const [hue, , l] = rgbToHsl(sumR / count, sumG / count, sumB / count)
  return rgbToHex(hslToRgb(hue, 0.08, clamp(l, 0.6, 0.78)))
}

export const theme = {
  pref: normalizeHex(store.get('ouce_pref_accent') || '') || DEFAULT_ACCENT,
  locked: store.get('ouce_accent_lock') === '1',
  current: null,
  rgb: [3, 48, 239]
}

function paintFavicon(hex, ink) {
  const cv = Object.assign(document.createElement('canvas'), { width: 64, height: 64 })
  const g = cv.getContext('2d')
  g.fillStyle = hex
  g.beginPath()
  g.roundRect ? g.roundRect(0, 0, 64, 64, 14) : g.rect(0, 0, 64, 64)
  g.fill()
  g.fillStyle = ink
  g.beginPath(); g.ellipse(25, 45, 9.5, 7.2, -0.35, 0, Math.PI * 2); g.fill()
  g.fillRect(32.5, 14, 4.2, 31)
  g.beginPath()
  g.moveTo(36.7, 14)
  g.bezierCurveTo(47, 17, 51, 24, 48.5, 33)
  g.bezierCurveTo(46, 27, 42, 25, 36.7, 24)
  g.closePath(); g.fill()
  $('#favicon').href = cv.toDataURL('image/png')
}

export function applyAccent(hex) {
  if (hex === theme.current) return
  theme.current = hex
  const [r, g, b] = hexToRgb(hex)
  theme.rgb = [r, g, b]
  const [hue, s, l] = rgbToHsl(r, g, b)
  const hi = rgbToHex(hslToRgb(hue, s, clamp(l + 0.14, 0, 0.78)))
  const lo = rgbToHex(hslToRgb(hue, s, clamp(l - 0.12, 0.08, 1)))
  const ink = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#111111' : '#ffffff'
  const root = document.documentElement.style
  root.setProperty('--accent', hex)
  root.setProperty('--accent-rgb', `${r} ${g} ${b}`)
  root.setProperty('--accent-hi', hi)
  root.setProperty('--accent-lo', lo)
  root.setProperty('--on-accent', ink)
  $('meta[name=theme-color]').setAttribute('content', hex)
  paintFavicon(hex, ink)
}

export function accentFromCover(src) {
  if (theme.locked || !src) return
  const img = new Image()
  img.onload = () => {
    const hex = pickAccent(img)
    if (hex && !theme.locked) applyAccent(hex)
  }
  img.src = src
}

function setUserColor(input) {
  const hex = normalizeHex(input)
  if (!hex) return false
  theme.pref = hex
  store.set('ouce_pref_accent', hex)
  applyAccent(hex)
  return true
}

function syncSettings() {
  $('#hex').value = theme.current.toUpperCase()
  $('#colorPick').value = theme.current
  $('#lock').checked = theme.locked
}

export function bindSettings() {
  const msg = $('#hexMsg')
  const apply = value => {
    if (setUserColor(value)) { syncSettings(); msg.textContent = 'Cor aplicada.' }
    else msg.textContent = 'Use uma cor no formato #RRGGBB.'
  }
  $('#setBtn').addEventListener('click', () => { msg.textContent = ''; syncSettings(); $('#setDlg').showModal() })
  $('#hexApply').addEventListener('click', () => apply($('#hex').value))
  $('#hex').addEventListener('keydown', e => { if (e.key === 'Enter') apply(e.target.value) })
  $('#colorPick').addEventListener('input', e => apply(e.target.value))
  $('#hexReset').addEventListener('click', () => { setUserColor(DEFAULT_ACCENT); syncSettings(); msg.textContent = 'Voltou ao azul do Ouce.' })
  $('#lock').addEventListener('change', e => {
    theme.locked = e.target.checked
    store.set('ouce_accent_lock', theme.locked ? '1' : '0')
    if (theme.locked) applyAccent(theme.pref)
    else if (state.now.cover) accentFromCover(state.now.cover)
  })
}
