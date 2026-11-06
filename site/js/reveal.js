export function initReveal() {
  const items = document.querySelectorAll('.reveal')
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'))
    return
  }
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('in')
      io.unobserve(entry.target)
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
  items.forEach(el => io.observe(el))
}
