// Load artwork system (self-contained, no conflicts)
document.head.appendChild(Object.assign(document.createElement('script'), {src: 'artwork.js'}));

/**
 * HEADER.JS - Minimal Institutional Header
 * Logo (two lines) + Verify License + Login/Account
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

  // Navigation - Main links + Verify License button
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

  // Logout function
  window.logout = function(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('session_token');
    window.location.href = 'index.html';
  };
})();
