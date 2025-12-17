/**
 * VIDEO-BG.JS - Video Background for Non-Homepage Pages
 * DESKTOP: 4x3 grid of 12 videos (staggered load)
 * MOBILE: 1 single random fullscreen video
 */

(function() {
  // Don't run on homepage
  if (window.location.pathname === '/' || 
      window.location.pathname === '/index.html' || 
      window.location.pathname.endsWith('/index.html')) {
    return;
  }

  // R2 public URL
  const R2_URL = 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev';

  // Wall clip filenames (01-30)
  const clips = [];
  for (let i = 1; i <= 30; i++) {
    const num = i.toString().padStart(2, '0');
    clips.push(`${R2_URL}/wall_${num}.mp4`);
  }

  // Shuffle array
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const isMobile = window.innerWidth <= 768;
  const shuffled = shuffle([...clips]);

  // Create container
  const wallContainer = document.createElement('div');
  wallContainer.className = 'video-wall-bg';

  if (isMobile) {
    // MOBILE: Single fullscreen video
    const randomClip = shuffled[0];
    wallContainer.innerHTML = `
      <video class="video-single" autoplay muted loop playsinline>
        <source src="${randomClip}" type="video/mp4">
      </video>
      <div class="video-wall-overlay"></div>
    `;
  } else {
    // DESKTOP: 4x3 grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'video-wall-grid';
    
    const selectedClips = shuffled.slice(0, 12);
    selectedClips.forEach((clipUrl) => {
      const cell = document.createElement('div');
      cell.className = 'video-wall-cell';
      cell.dataset.src = clipUrl;
      gridContainer.appendChild(cell);
    });

    wallContainer.appendChild(gridContainer);
    wallContainer.innerHTML += '<div class="video-wall-overlay"></div>';

    // Staggered load for desktop
    setTimeout(() => {
      const cells = document.querySelectorAll('.video-wall-cell');
      function loadVideoAt(index) {
        if (index >= cells.length) return;
        const cell = cells[index];
        const src = cell.dataset.src;
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.innerHTML = `<source src="${src}" type="video/mp4">`;
        cell.appendChild(video);
        video.play().catch(() => {});
        setTimeout(() => loadVideoAt(index + 1), 400);
      }
      loadVideoAt(0);
    }, 100);
  }

  document.body.insertBefore(wallContainer, document.body.firstChild);

  // Add styles
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

    .video-wall-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(75, 0, 0, 0.7);
      z-index: 2;
    }

    /* MOBILE: Single fullscreen video */
    .video-single {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      object-fit: cover;
      opacity: 0.6;
      z-index: 1;
    }

    /* DESKTOP: Grid */
    .video-wall-grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 2px;
      z-index: 1;
    }

    .video-wall-cell {
      position: relative;
      overflow: hidden;
      background: #1a0000;
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
      transition: opacity 0.5s ease;
    }

    .video-wall-cell video:not(:empty) {
      opacity: 0.6;
    }

    /* Ensure content is above */
    body > *:not(.video-wall-bg) {
      position: relative;
      z-index: 1;
    }

    header {
      z-index: 1000 !important;
    }
  `;
  document.head.appendChild(style);
})();
