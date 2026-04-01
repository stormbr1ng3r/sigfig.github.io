// ─────────────────────────────────────────────────────────────────────────────
// Q&A DATA
// Add your answered questions here. Newest first, or whatever order feels right.
// Each entry: { q: "the question", a: "your answer" }
// ─────────────────────────────────────────────────────────────────────────────

const QAS = [
  {
    q: "What's your favorite fic you've written?",
    a: "Probably the slow burn I finished last summer. I'm still proud of how the last chapter landed.",
  },
  {
    q: "Do you take requests?",
    a: "Sometimes! I'm more likely to write something if it hits a trope I'm currently fixated on.",
  },
  {
    q: "How long have you been in this fandom?",
    a: "Since basically the beginning. I remember when there were maybe three fics on ao3 and we were all just vibing.",
  },
  {
    q: "Favorite trope to write?",
    a: "Forced proximity. Every single time. Something about two people who have no choice but to figure each other out.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────

function cardHTML({ q, a }) {
  return `
    <article class="qa-card card">
      <div class="bubble bubble-q">
        <span class="bubble-meta">✦ anonymous</span>
        <p>${q}</p>
      </div>
      <div class="bubble bubble-a">
        <span class="bubble-meta">me ✦</span>
        <p>${a}</p>
      </div>
    </article>
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// PRETEXT COLUMN BALANCING
// Uses Pretext to measure each card's text height before render, then
// distributes cards into two columns so their total heights are balanced.
// Falls back to a simple even split if Pretext can't load.
// ─────────────────────────────────────────────────────────────────────────────

async function balanceColumns(container, items) {
  try {
    // Pretext is framework-agnostic — we import it from the CDN.
    // If the package isn't available yet, the catch block handles it gracefully.
    const { prepare, layout } = await import('https://esm.sh/@chenglou/pretext')

    // Wait for fonts so measurements match what the browser actually renders.
    await document.fonts.ready

    const isMobile   = window.innerWidth < 640
    const numCols    = isMobile ? 1 : 2
    const gap        = 16
    const padding    = 40             // 20px left + 20px right card padding
    const colWidth   = (container.offsetWidth - gap * (numCols - 1)) / numCols - padding
    const FONT       = '15px DM Sans' // matches .bubble p font-size
    const LINE_H     = 25

    // Measure each card: sum question height + answer height + chrome (labels, gaps)
    const heights = items.map(({ q, a }) => {
      const qH = layout(prepare(q, FONT), colWidth, LINE_H).height
      const aH = layout(prepare(a, FONT), colWidth, LINE_H).height
      return qH + aH + 88 // 88px ≈ labels + padding + bubble gap
    })

    // Greedy column fill: always add the next card to the shortest column
    const colHeights = Array(numCols).fill(0)
    const cols       = Array.from({ length: numCols }, () => [])

    items.forEach((item, i) => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      cols[col].push(item)
      colHeights[col] += heights[i] + gap
    })

    return cols
  } catch {
    // Pretext unavailable — fall back to a simple even split
    const mid = Math.ceil(items.length / 2)
    return [items.slice(0, mid), items.slice(mid)]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function renderQA() {
  const container = document.getElementById('qa-columns')
  if (!container) return

  // Nothing to show — hide the section chrome rather than showing empty grid
  if (QAS.length === 0) {
    container.innerHTML = ''
    return
  }

  // Show loading indicator while Pretext measures
  container.innerHTML = '<p class="qa-loading" role="status">✦</p>'

  const cols = await balanceColumns(container, QAS)

  container.innerHTML = cols
    .map(col => `<div class="qa-col">${col.map(cardHTML).join('')}</div>`)
    .join('')

  // Staggered entrance — each card fades + slides in sequentially
  container.querySelectorAll('.qa-card').forEach((el, i) => {
    el.style.animationDelay = `${i * 70}ms`
    el.classList.add('qa-card--in')
  })
}

// Re-balance on resize (debounced)
let resizeTimer
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(renderQA, 350)
})

renderQA()
