import { $, $$, esc } from './lib/dom.js'

export function scramble(el, text) {
  const pool = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*'
  const steps = 18
  let frame = 0
  cancelAnimationFrame(el._raf)
  const tick = () => {
    el.textContent = [...text].map((c, i) => (c === ' ' || i < (frame * text.length) / steps ? c : pool[(Math.random() * pool.length) | 0])).join('')
    if (++frame <= steps) el._raf = requestAnimationFrame(tick)
    else el.textContent = text
  }
  tick()
}

export function toast(msg, undo) {
  const el = $('#toast')
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Desfazer</button>' : ''}`
  el.classList.add('on')
  clearTimeout(el._t)
  el._t = setTimeout(() => el.classList.remove('on'), 5000)
  if (undo) $('button', el).onclick = () => { undo(); el.classList.remove('on') }
}

export function undoable(msg, run, restore) {
  const timer = setTimeout(run, 5000)
  toast(msg, () => { clearTimeout(timer); restore() })
}

export function countUp(el, to) {
  const format = n => n.toLocaleString('pt-BR')
  if (to <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return (el.textContent = format(to))
  const start = performance.now()
  const tick = now => {
    const p = Math.min(1, (now - start) / 1400)
    el.textContent = format(Math.round(to * (1 - (1 - p) ** 3)))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function bindDialogs() {
  $$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()))
}
