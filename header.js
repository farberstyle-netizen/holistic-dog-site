/**
 * HEADER.JS - Holistic Therapy Dog Association
 * Clean, minimal institutional header
 * 
 * Features:
 * - Two-line logo wordmark
 * - Main navigation links
 * - Account dropdown for logged-in users
 * - Mobile hamburger menu
 */

(function() {
  'use strict';

  // Get DOM elements
  const navLinks = document.getElementById('nav-links');
  const navAccount = document.getElementById('nav-account-links');
  const sessionToken = localStorage.getItem('session_token');
  const isAdmin = localStorage.getItem('is_admin') === '1';

  // Update logo to two-line wordmark
  const logoElement = document.querySelector('.logo');
  if (logoElement) {
    logoElement.innerHTML = 'Holistic Therapy<br>Dog Association';
  }

  // Build main navigation
  if (navLinks) {
    navLinks.innerHTML = `
      <li><a href="how-it-works.html" class="nav-link">How It Works</a></li>
      <li><a href="gallery.html" class="nav-link">Gallery</a></li>
      <li><a href="meet-our-dogs.html" class="nav-link">Meet Our Dogs</a></li>
      <li><a href="verify.html" class="nav-link">Verify License</a></li>
    `;
  }

  // Build account area based on login state
  if (navAccount) {
    if (sessionToken) {
      // User is logged in - show account dropdown
      const adminLink = isAdmin ? '<a href="admin.html" class="dropdown-item">Admin Panel</a>' : '';
      
      navAccount.innerHTML = `
        <div class="account-dropdown-container">
          <button class="account-trigger" aria-label="Account menu" aria-expanded="false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Account</span>
            <svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="account-dropdown" id="account-dropdown">
            <a href="dashboard.html" class="dropdown-item">Dashboard</a>
            <a href="account.html" class="dropdown-item">My Account</a>
            <a href="order-history.html" class="dropdown-item">Order History</a>
            ${adminLink}
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item logout" id="logout-link">Logout</a>
          </div>
        </div>
      `;

      // Set up dropdown behavior
      setupAccountDropdown();
      
    } else {
      // Not logged in - show login button
      navAccount.innerHTML = `
        <a href="login.html" class="nav-btn-login">Login</a>
      `;
    }
  }

  // Set up mobile hamburger menu
  setupMobileMenu();

  /**
   * Set up account dropdown behavior (hover + click)
   */
  function setupAccountDropdown() {
    const container = document.querySelector('.account-dropdown-container');
    const dropdown = document.getElementById('account-dropdown');
    const trigger = container?.querySelector('.account-trigger');
    const logoutLink = document.getElementById('logout-link');

    if (!container || !dropdown || !trigger) return;

    let hoverTimeout;

    // Hover behavior (desktop)
    container.addEventListener('mouseenter', function() {
      clearTimeout(hoverTimeout);
      dropdown.classList.add('show');
      trigger.setAttribute('aria-expanded', 'true');
    });

    container.addEventListener('mouseleave', function() {
      hoverTimeout = setTimeout(function() {
        dropdown.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
      }, 150);
    });

    // Click behavior (mobile/accessibility)
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('show');
      dropdown.classList.toggle('show');
      trigger.setAttribute('aria-expanded', !isOpen);
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        dropdown.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    // Logout handler
    if (logoutLink) {
      logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('session_token');
        localStorage.removeItem('is_admin');
        window.location.href = 'index.html';
      });
    }
  }

  /**
   * Set up mobile hamburger menu
   */
  function setupMobileMenu() {
    const navContainer = document.querySelector('.nav-container');
    const nav = navContainer?.querySelector('nav');

    if (!navContainer || !nav) return;

    // Don't add if already exists
    if (document.querySelector('.hamburger-menu')) return;

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;

    // Insert hamburger into nav container
    navContainer.appendChild(hamburger);

    // Toggle menu on click
    hamburger.addEventListener('click', function() {
      const isActive = hamburger.classList.toggle('active');
      nav.classList.toggle('mobile-active');
      hamburger.setAttribute('aria-expanded', isActive);
      document.body.classList.toggle('menu-open');
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        nav.classList.remove('mobile-active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });

    // Close menu on resize to desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        nav.classList.remove('mobile-active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
    });
  }

  // Global logout function (for backwards compatibility)
  window.logout = function(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('session_token');
    localStorage.removeItem('is_admin');
    window.location.href = 'index.html';
  };

})();
