/**
 * VIDEO-BG.JS - Living Mosaic Video Background
 * DESKTOP: 4x3 grid of 12 videos with pulse focus effect
 * MOBILE: 2x3 grid of 6 videos
 * Features: Soft-edge transitions, breathing animation, depth effects
 */

(function() {
  // Don't run on homepage
  if (window.location.pathname === '/' || 
      window.location.pathname === '/index.html' || 
      window.location.pathname.endsWith('/index.html')) {
    return;
  }

  // R2 public URL for wall clips
  const R2_URL = 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev';

  // Build array of 29 wall clips (wall_01.mp4 through wall_29.mp4)
  const clips = [];
  for (let i = 1; i <= 29; i++) {
    const num = i.toString().padStart(2, '0');
    clips.push(`${R2_URL}/wall_${num}.mp4`);
  }

  // Shuffle array helper
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Detect mobile
  const isMobile = window.innerWidth <= 768;
  
  // Grid configuration
  const cols = isMobile ? 2 : 4;
  const rows = 3;
  const totalCells = cols * rows;

  // Shuffle and select clips
  const shuffled = shuffle(clips);
  const selectedClips = shuffled.slice(0, totalCells);

  // Create main container
  const wallContainer = document.createElement('div');
  wallContainer.className = 'video-wall-bg';

  // Create grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'video-wall-grid';
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  // Create cells with videos
  selectedClips.forEach((clipUrl, index) => {
    const cell = document.createElement('div');
    cell.className = 'video-wall-cell';
    cell.dataset.index = index;
    cell.dataset.col = index % cols;
    cell.dataset.row = Math.floor(index / cols);

    // Vignette overlay for soft edges
    const vignette = document.createElement('div');
    vignette.className = 'cell-vignette';
    cell.appendChild(vignette);

    // Video element (will load staggered)
    cell.dataset.src = clipUrl;
    
    gridContainer.appendChild(cell);
  });

  wallContainer.appendChild(gridContainer);

  // Overall dark overlay
  const overlay = document.createElement('div');
  overlay.className = 'video-wall-overlay';
  wallContainer.appendChild(overlay);

  // Overall vignette for seamless edges
  const masterVignette = document.createElement('div');
  masterVignette.className = 'video-wall-master-vignette';
  wallContainer.appendChild(masterVignette);

  // Insert into DOM
  document.body.insertBefore(wallContainer, document.body.firstChild);

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .video-wall-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      background: #1a0000;
    }

    .video-wall-grid {
      position: absolute;
      top: -5%;
      left: -5%;
      width: 110%;
      height: 110%;
      display: grid;
      gap: 0;
      z-index: 1;
    }

    .video-wall-cell {
      position: relative;
      overflow: hidden;
      background: #1a0000;
      transform: scale(1);
      transition: transform 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                  filter 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      filter: brightness(0.7);
    }

    .video-wall-cell.focused {
      transform: scale(1.15);
      filter: brightness(1);
      z-index: 10;
    }

    .video-wall-cell.neighbor {
      transform: scale(0.92);
      filter: brightness(0.5) blur(1px);
    }

    .video-wall-cell video {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.8s ease;
    }

    .video-wall-cell video.loaded {
      opacity: 0.85;
    }

    /* Soft edge vignette per cell */
    .cell-vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(26, 0, 0, 0.3) 70%,
        rgba(26, 0, 0, 0.6) 100%
      );
    }

    /* Master vignette for overall soft edges */
    .video-wall-master-vignette {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 3;
      background: radial-gradient(
        ellipse at center,
        transparent 30%,
        rgba(26, 0, 0, 0.2) 60%,
        rgba(26, 0, 0, 0.5) 85%,
        rgba(26, 0, 0, 0.8) 100%
      );
    }

    /* Dark overlay for content readability */
    .video-wall-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(75, 0, 0, 0.55);
      pointer-events: none;
      z-index: 4;
    }

    /* Ensure content is above video wall */
    body > *:not(.video-wall-bg) {
      position: relative;
      z-index: 1;
    }

    header {
      z-index: 1000 !important;
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
      .video-wall-cell.focused {
        transform: scale(1.1);
      }
      .video-wall-cell.neighbor {
        transform: scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);

  // Staggered video loading
  function loadVideos() {
    const cells = document.querySelectorAll('.video-wall-cell');
    
    function loadVideoAt(index) {
      if (index >= cells.length) {
        // All loaded, start pulse animation
        setTimeout(startPulseAnimation, 1000);
        return;
      }
      
      const cell = cells[index];
      const src = cell.dataset.src;
      
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.innerHTML = `<source src="${src}" type="video/mp4">`;
      
      cell.insertBefore(video, cell.firstChild);
      
      video.play().then(() => {
        video.classList.add('loaded');
      }).catch(() => {
        // Autoplay blocked, still show
        video.classList.add('loaded');
      });
      
      // Load next after short delay
      setTimeout(() => loadVideoAt(index + 1), 150);
    }
    
    loadVideoAt(0);
  }

  // Pulse focus animation
  function startPulseAnimation() {
    const cells = document.querySelectorAll('.video-wall-cell');
    const totalCells = cells.length;
    
    function getNeighborIndices(index) {
      const col = parseInt(cells[index].dataset.col);
      const row = parseInt(cells[index].dataset.row);
      const neighbors = [];
      
      // Check all 8 surrounding positions
      for (let dc = -1; dc <= 1; dc++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (dc === 0 && dr === 0) continue;
          
          const nc = col + dc;
          const nr = row + dr;
          
          if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
            const ni = nr * cols + nc;
            if (ni < totalCells) {
              neighbors.push(ni);
            }
          }
        }
      }
      
      return neighbors;
    }
    
    function pulse() {
      // Clear previous states
      cells.forEach(cell => {
        cell.classList.remove('focused', 'neighbor');
      });
      
      // Pick random cell to focus
      const focusIndex = Math.floor(Math.random() * totalCells);
      cells[focusIndex].classList.add('focused');
      
      // Mark neighbors
      const neighbors = getNeighborIndices(focusIndex);
      neighbors.forEach(ni => {
        cells[ni].classList.add('neighbor');
      });
      
      // Schedule next pulse (5-8 seconds)
      const nextDelay = 5000 + Math.random() * 3000;
      setTimeout(pulse, nextDelay);
    }
    
    // Start pulsing
    pulse();
  }

  // Start loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadVideos);
  } else {
    setTimeout(loadVideos, 100);
  }

})();
