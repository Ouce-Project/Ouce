export async function squareJpeg(file, size) {
  const bmp = await createImageBitmap(file)
  const side = Math.min(bmp.width, bmp.height)
  const cv = Object.assign(document.createElement('canvas'), { width: size, height: size })
  cv.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size)
  return new Promise(done => cv.toBlob(done, 'image/jpeg', 0.86))
}

export const toDataURL = blob => new Promise(done => {
  const reader = new FileReader()
  reader.onload = () => done(reader.result)
  reader.readAsDataURL(blob)
})

export async function embeddedCover(blob) {
  try {
    const head = new Uint8Array(await blob.slice(0, 10).arrayBuffer())
    if (String.fromCharCode(...head.slice(0, 3)) !== 'ID3' || head[3] < 3) return null
    const ver = head[3]
    const size = (head[6] << 21) | (head[7] << 14) | (head[8] << 7) | head[9]
    const buf = new Uint8Array(await blob.slice(10, 10 + Math.min(size, 6e6)).arrayBuffer())
    let p = 0
    while (p + 10 < buf.length) {
      const id = String.fromCharCode(...buf.slice(p, p + 4))
      if (!/^[A-Z0-9]{4}$/.test(id)) break
      const len = ver === 4
        ? (buf[p + 4] << 21) | (buf[p + 5] << 14) | (buf[p + 6] << 7) | buf[p + 7]
        : buf[p + 4] * 16777216 + (buf[p + 5] << 16) + (buf[p + 6] << 8) + buf[p + 7]
      if (id === 'APIC') {
        const f = buf.slice(p + 10, p + 10 + len)
        const enc = f[0]
        let i = 1
        while (i < f.length && f[i] !== 0) i++
        const mime = String.fromCharCode(...f.slice(1, i))
        i += 2
        if (enc === 1 || enc === 2) {
          while (i + 1 < f.length && !(f[i] === 0 && f[i + 1] === 0)) i += 2
          i += 2
        } else {
          while (i < f.length && f[i] !== 0) i++
          i++
        }
        return i < f.length ? new Blob([f.slice(i)], { type: mime.includes('/') ? mime : 'image/jpeg' }) : null
      }
      p += 10 + len
    }
  } catch {}
  return null
}
