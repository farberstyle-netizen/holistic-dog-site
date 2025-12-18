/**
 * VIDEO-BG.JS - Living Mosaic Video Background
 * 
 * A 3×4 grid of 12 looping dog videos that "breathes" - 
 * periodically one video gently expands while neighbors softly compress.
 * Soft edges, smooth transitions, organic feel.
 * 
 * DESKTOP: 3×4 grid (12 videos) with pulse focus effect
 * MOBILE: 2×3 grid (6 videos) with same effect, scaled down
 */

(function() {
  'use strict';

  // Don't run on homepage
  if (window.location.pathname === '/' || 
      window.location.pathname === '/index.html' || 
      window.location.pathname.endsWith('/index.html')) {
    return;
  }

  // ========================================
  // CONFIGURATION
  // ========================================
  
  const R2_URL = 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev';
  const TOTAL_CLIPS = 29;
  const DESKTOP_COUNT = 12;  // 3×4 grid
  const MOBILE_COUNT = 6;    // 2×3 grid
  const PULSE_INTERVAL_MIN = 5000;  // Min ms between focus shifts
  const PULSE_INTERVAL_MAX = 8000;  // Max ms between focus shifts
  const TRANSITION_DURATION = 1.8;  // Seconds for grow/shrink animation

  // ========================================
  // HELPERS
  // ========================================

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getRandomInterval() {
    return Math.floor(Math.random() * (PULSE_INTERVAL_MAX - PULSE_INTERVAL_MIN)) + PULSE_INTERVAL_MIN;
  }

  function getClipUrl(num) {
    return `${R2_URL}/wall_${String(num).padStart(2, '0')}.mp4`;
  }

  // Get all clip numbers (1-29), shuffle, take what we need
  function getRandomClips(count) {
    const allClips = Array.from({ length: TOTAL_CLIPS }, (_, i) => i + 1);
    return shuffle(allClips).slice(0, count);
  }

  // ========================================
  // GRID NEIGHBOR LOGIC
  // ========================================

  // For a grid, get indices of adjacent cells (including diagonals)
  function getNeighbors(index, cols, total) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const rows = Math.ceil(total / cols);
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const ni = nr * cols + nc;
          if (ni < total) neighbors.push(ni);
        }
      }
    }
    return neighbors;
  }

  // ========================================
  // MAIN INITIALIZATION
  // ========================================

  const isMobile = window.innerWidth <= 768;
  const videoCount = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
  const cols = isMobile ? 2 : 4;
  const rows = isMobile ? 3 : 3;
  const clips = getRandomClips(videoCount);

  // Create container
  const container = document.createElement('div');
  container.className = 'living-mosaic-bg';

  // Create grid
  const grid = document.createElement('div');
  grid.className = 'mosaic-grid';

  // Create video cells
  const cells = [];
  clips.forEach((clipNum, index) => {
    const cell = document.createElement('div');
    cell.className = 'mosaic-cell';
    cell.dataset.index = index;

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.src = getClipUrl(clipNum);
    
    // Stagger load for performance
    setTimeout(() => {
      video.play().catch(() => {});
    }, index * 200);

    cell.appendChild(video);
    grid.appendChild(cell);
    cells.push(cell);
  });

  // Add overlay for darkening
  const overlay = document.createElement('div');
  overlay.className = 'mosaic-overlay';

  // Add soft edge vignette
  const vignette = document.createElement('div');
  vignette.className = 'mosaic-vignette';

  container.appendChild(grid);
  container.appendChild(overlay);
  container.appendChild(vignette);
  document.body.insertBefore(container, document.body.firstChild);

  // ========================================
  // PULSE FOCUS ANIMATION
  // ========================================

  let currentFocus = -1;
  let previousNeighbors = [];

  function pulse() {
    // Reset previous states
    cells.forEach(cell => {
      cell.classList.remove('focused', 'compressed');
    });

    // Pick new focus (different from current)
    let newFocus;
    do {
      newFocus = Math.floor(Math.random() * videoCount);
    } while (newFocus === currentFocus && videoCount > 1);

    currentFocus = newFocus;
    const neighbors = getNeighbors(currentFocus, cols, videoCount);

    // Apply focus to chosen cell
    cells[currentFocus].classList.add('focused');

    // Apply compression to neighbors
    neighbors.forEach(ni => {
      cells[ni].classList.add('compressed');
    });

    // Schedule next pulse
    setTimeout(pulse, getRandomInterval());
  }

  // Start pulsing after videos have loaded
  setTimeout(pulse, 2000);

  // ========================================
  // INJECT STYLES
  // ========================================

  const style = document.createElement('style');
  style.textContent = `
    /* Container */
    .living-mosaic-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      background: #1a0000;
    }

    /* Grid Layout */
    .mosaic-grid {
      position: absolute;
      top: -5%;
      left: -5%;
      width: 110%;
      height: 110%;
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-template-rows: repeat(${rows}, 1fr);
      gap: 0;
      z-index: 1;
    }

    /* Individual Cell */
    .mosaic-cell {
      position: relative;
      overflow: hidden;
      transition: transform ${TRANSITION_DURATION}s cubic-bezier(0.4, 0, 0.2, 1),
                  filter ${TRANSITION_DURATION}s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity ${TRANSITION_DURATION}s cubic-bezier(0.4, 0, 0.2, 1);
      transform: scale(1);
      filter: blur(0px) brightness(0.7);
      border-radius: 0;
    }

    /* Video inside cell */
    .mosaic-cell video {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 120%;
      min-height: 120%;
      width: auto;
      height: auto;
      object-fit: cover;
    }

    /* Soft edge gradient on each cell */
    .mosaic-cell::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(26, 0, 0, 0.3) 80%,
        rgba(26, 0, 0, 0.6) 100%
      );
      pointer-events: none;
      z-index: 2;
      transition: opacity ${TRANSITION_DURATION}s ease;
    }

    /* Focused cell - grows and brightens */
    .mosaic-cell.focused {
      transform: scale(1.15);
      filter: blur(0px) brightness(0.9);
      z-index: 10;
    }

    .mosaic-cell.focused::after {
      opacity: 0.3;
    }

    /* Compressed neighbors - shrink and dim slightly */
    .mosaic-cell.compressed {
      transform: scale(0.92);
      filter: blur(1px) brightness(0.55);
    }

    .mosaic-cell.compressed::after {
      opacity: 1;
    }

    /* Overall dark overlay */
    .mosaic-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(75, 0, 0, 0.55);
      z-index: 2;
      pointer-events: none;
    }

    /* Soft vignette around edges */
    .mosaic-vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        ellipse at center,
        transparent 30%,
        rgba(26, 0, 0, 0.4) 70%,
        rgba(26, 0, 0, 0.8) 100%
      );
      z-index: 3;
      pointer-events: none;
    }

    /* Ensure page content stays above */
    body > *:not(.living-mosaic-bg) {
      position: relative;
      z-index: 1;
    }

    header {
      z-index: 1000 !important;
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
      .mosaic-cell.focused {
        transform: scale(1.12);
      }
      .mosaic-cell.compressed {
        transform: scale(0.94);
      }
      .mosaic-overlay {
        background: rgba(75, 0, 0, 0.6);
      }
    }
  `;

  document.head.appendChild(style);

})();
