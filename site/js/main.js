import { initDemo } from './demo.js'
import { startBars } from './bars.js'
import { initReveal } from './reveal.js'
import { rotateWords } from './scramble.js'

const nav = document.querySelector('#nav')

function onScroll() {
  nav.classList.toggle('scrolled', scrollY > 8)
}

addEventListener('scroll', onScroll, { passive: true })
onScroll()

startBars()
initReveal()
initDemo()
rotateWords(document.querySelector('#swap'), ['mais lenta', 'com reverb', 'mais rápida', 'do seu jeito'])
