// Load artwork system (self-contained, no conflicts)
document.head.appendChild(Object.assign(document.createElement('script'), {src: 'artwork.js'}));

/**
 * HEADER.JS - Minimal Institutional Header
 * Logo (two lines) + Verify License + Login/Account
 * Includes video background for non-homepage pages
 */

(function() {
  const navLinks = document.getElementById('nav-links');
  const navAccount = document.getElementById('nav-account-links');
  const sessionToken = localStorage.getItem('session_token');

  // Update logo to two-line wordmark
  const logoElement = document.querySelector('.logo');
  if (logoElement) {
    logoElement.innerHTML = 'Holistic Therapy<br>Dog Association';
  }

  // Navigation - Main links + Verify License (nav-link style, not button)
  if (navLinks) {
    navLinks.innerHTML = `
      <li><a href="how-it-works.html" class="nav-link">How It Works</a></li>
      <li><a href="gallery.html" class="nav-link">Gallery</a></li>
      <li><a href="meet-our-dogs.html" class="nav-link">Meet Our Dogs</a></li>
      <li><a href="verify.html" class="nav-link">Verify License</a></li>
    `;
  }

  // Account area based on login state
  if (navAccount) {
    if (sessionToken) {
      // User is logged in - show account dropdown
      navAccount.innerHTML = `
        <div class="account-dropdown-container">
          <button class="nav-btn nav-btn-gold account-trigger" aria-label="Account menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Account
          </button>
          <div class="account-dropdown" id="account-dropdown">
            <a href="dashboard.html" class="dropdown-item">Dashboard</a>
            <a href="account.html" class="dropdown-item">My Account</a>
            <a href="order-history.html" class="dropdown-item">Order History</a>
            <div class="dropdown-divider"></div>
            <a href="#" onclick="logout(event)" class="dropdown-item logout">Logout</a>
          </div>
        </div>
      `;

      const dropdownContainer = document.querySelector('.account-dropdown-container');
      const dropdown = document.getElementById('account-dropdown');
      
      if (dropdownContainer && dropdown) {
        // Hover behavior for desktop
        dropdownContainer.addEventListener('mouseenter', () => {
          dropdown.classList.add('show');
        });
        
        dropdownContainer.addEventListener('mouseleave', () => {
          // Small delay to prevent accidental close
          setTimeout(() => {
            if (!dropdownContainer.matches(':hover')) {
              dropdown.classList.remove('show');
            }
          }, 100);
        });

        // Click behavior (for mobile and accessibility)
        const trigger = dropdownContainer.querySelector('.account-trigger');
        if (trigger) {
          trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('show');
          });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!dropdownContainer.contains(e.target)) {
            dropdown.classList.remove('show');
          }
        });
      }

    } else {
      // Not logged in - show login button (outlined style)
      navAccount.innerHTML = `
        <a href="login.html" class="nav-btn nav-btn-outline">Login</a>
      `;
    }
  }

  // Mobile hamburger
  const navContainer = document.querySelector('.nav-container');
  
  if (navContainer && !document.querySelector('.hamburger-menu')) {
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;
    
    const nav = navContainer.querySelector('nav');
    if (nav) {
      navContainer.insertBefore(hamburger, nav);
      
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('mobile-active');
        document.body.classList.toggle('menu-open');
      });
      
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          nav.classList.remove('mobile-active');
          document.body.classList.remove('menu-open');
        });
      });
    }
  }

  // ========================================
  // VIDEO BACKGROUND FOR NON-HOMEPAGE PAGES
  // ========================================
  initVideoBackground();

  // Logout function
  window.logout = function(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('session_token');
    window.location.href = 'index.html';
  };
})();

/**
 * Video Background System
 * Shows video grid on non-homepage pages
 */
function initVideoBackground() {
  // Don't run on homepage
  const path = window.location.pathname;
  if (path === '/' || path.endsWith('/index.html') || path === '/index.html') {
    return;
  }

  const R2_URL = 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev';
  
  // Build clip list (wall_01.mp4 through wall_30.mp4)
  const clips = [];
  for (let i = 1; i <= 30; i++) {
    clips.push(`${R2_URL}/wall_${i.toString().padStart(2, '0')}.mp4`);
  }

  // Shuffle array
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const isMobile = window.innerWidth <= 768;
  const shuffled = shuffle(clips);

  // Mark body for video background styling
  document.body.classList.add('has-video-bg');

  // Create container
  const container = document.createElement('div');
  container.className = 'video-wall-container';

  if (isMobile) {
    // MOBILE: Single fullscreen video
    container.innerHTML = `
      <video class="video-wall-single" autoplay muted loop playsinline>
        <source src="${shuffled[0]}" type="video/mp4">
      </video>
      <div class="video-wall-overlay"></div>
    `;
  } else {
    // DESKTOP: 4x3 grid (12 videos)
    const grid = document.createElement('div');
    grid.className = 'video-wall-grid';
    
    const selected = shuffled.slice(0, 12);
    selected.forEach((url, index) => {
      const cell = document.createElement('div');
      cell.className = 'video-wall-cell';
      cell.dataset.src = url;
      cell.dataset.index = index;
      grid.appendChild(cell);
    });

    container.appendChild(grid);
    container.innerHTML += '<div class="video-wall-overlay"></div>';

    // Staggered video loading
    setTimeout(() => {
      const cells = document.querySelectorAll('.video-wall-cell');
      let index = 0;
      
      function loadNext() {
        if (index >= cells.length) return;
        const cell = cells[index];
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.innerHTML = `<source src="${cell.dataset.src}" type="video/mp4">`;
        cell.appendChild(video);
        video.play().catch(() => {});
        index++;
        setTimeout(loadNext, 300);
      }
      loadNext();
    }, 100);
  }

  // Insert at beginning of body
  document.body.insertBefore(container, document.body.firstChild);
}
