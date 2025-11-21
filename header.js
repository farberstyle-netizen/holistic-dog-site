/**
 * HEADER.JS - Dynamic Navigation
 */

(function() {
  const navLinks = document.getElementById('nav-links');
  const navAccount = document.getElementById('nav-account-links');
  const sessionToken = localStorage.getItem('session_token');

  // Base navigation links
  const baseLinks = [
    { text: 'Home', href: 'index.html' },
    { text: 'About', href: 'about.html' },
    { text: 'Meet Our Dogs', href: 'meet-our-dogs.html' },
    { text: 'Gallery', href: 'gallery.html' },
    { text: 'Verify License', href: 'verify.html', prominent: true }
  ];

  // Update logo to use header image
  const logoElement = document.querySelector('.logo');
  if (logoElement) {
    logoElement.innerHTML = '<img src="logo-header.png" alt="Holistic Therapy Dog Association" style="height: 70px;">';
  }

  // Split navigation - verify button next to logo, rest next to login
  const verifyLink = baseLinks.find(link => link.prominent);
  const regularLinks = baseLinks.filter(link => !link.prominent && link.text !== 'Home');
  
  if (navLinks) {
    navLinks.innerHTML = verifyLink ? `<li><a href="${verifyLink.href}" class="nav-verify-prominent">${verifyLink.text}</a></li>` : '';
  }

  // Populate account area with nav links and login/profile
  if (navAccount) {
    let linksHTML = regularLinks.map(link => {
      return `<a href="${link.href}" class="nav-link-header">${link.text}</a>`;
    }).join('');
    
    if (sessionToken) {
      // User is logged in - show nav links + profile picture with dropdown
      navAccount.innerHTML = linksHTML + `
        <div class="account-dropdown-container">
          <img src="https://via.placeholder.com/40" alt="Profile" class="user-pfp" id="user-pfp">
          <div class="account-dropdown" id="account-dropdown">
            <a href="dashboard.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Dashboard
            </a>
            <a href="account.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Account
            </a>
            <a href="#" onclick="logout(event)" class="dropdown-item logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </a>
          </div>
        </div>
      `;

      // Add hover listeners for desktop dropdown
      const dropdownContainer = document.querySelector('.account-dropdown-container');
      const dropdown = document.getElementById('account-dropdown');
      
      if (dropdownContainer && dropdown) {
        dropdownContainer.addEventListener('mouseenter', () => {
          dropdown.classList.add('show');
        });
        
        dropdownContainer.addEventListener('mouseleave', () => {
          dropdown.classList.remove('show');
        });
      }

    } else {
      // User is not logged in - show nav links + login button
      navAccount.innerHTML = linksHTML + `<a href="login.html" class="btn-login-header">LOGIN</a>`;
    }
  }

  // Add hamburger menu button
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
    
    // Insert hamburger before nav element
    const nav = navContainer.querySelector('nav');
    navContainer.insertBefore(hamburger, nav);
    
    // Toggle mobile menu
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      nav.classList.toggle('mobile-active');
      document.body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking a link
    const navLinksElements = nav.querySelectorAll('a');
    navLinksElements.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // Logout function
  window.logout = function(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('session_token');
    window.location.href = 'index.html';
  };

  // Auto-inject footer on every page
  document.addEventListener('DOMContentLoaded', function() {
    if (!document.querySelector('footer')) {
      const footer = document.createElement('footer');
      footer.innerHTML = `
        <div class="footer-seal">
          <img src="gold_seal.svg" alt="Holistic Therapy Dog Association Seal">
        </div>
        <div class="footer-links">
          <a href="about.html">About Us</a>
          <a href="meet-our-dogs.html">Meet Our Dogs</a>
          <a href="gallery.html">Gallery</a>
          <a href="verify.html">Verify License</a>
          <a href="contact.html">Contact</a>
          <a href="privacy-policy.html">Privacy</a>
          <a href="terms.html">Terms</a>
        </div>
        <p class="disclaimer">
          <strong>Disclaimer:</strong> The Holistic Therapy Dog certification is commemorative and does not confer legal rights under the ADA for Service Animals. This is not a Service Animal registry.
        </p>
        <p>&copy; 2025 Holistic Therapy Dog Association. All Rights Reserved.</p>
      `;
      document.body.appendChild(footer);
    }
  });
})();
