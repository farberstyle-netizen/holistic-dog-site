/**
 * FOOTER.JS - Holistic Therapy Dog Association
 * Clean institutional footer matching header style
 * 
 * Structure:
 * - Left column: Organization links
 * - Center: Official seal (focal point)
 * - Right column: Resources/Legal links
 * - Bottom: Disclaimer and copyright
 */

(function() {
  'use strict';

  const footer = document.querySelector('footer');
  
  if (!footer) return;

  const currentYear = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-container">
      
      <!-- Main Footer Content -->
      <div class="footer-main">
        
        <!-- Left Column -->
        <div class="footer-column">
          <h4>Organization</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="how-it-works.html">How It Works</a></li>
            <li><a href="careers.html">Careers</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        
        <!-- Center Seal -->
        <div class="footer-seal-center">
          <a href="index.html" aria-label="Return to homepage">
            <img src="gold-seal.png" alt="HTDA Official Seal" width="160" height="160" />
          </a>
        </div>
        
        <!-- Right Column -->
        <div class="footer-column">
          <h4>Resources</h4>
          <ul>
            <li><a href="verify.html">Verify License</a></li>
            <li><a href="gallery.html">Gallery</a></li>
            <li><a href="advocacy.html">Advocacy</a></li>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul>
        </div>
        
      </div>
      
      <!-- Disclaimer -->
      <div class="footer-disclaimer">
        <p><strong>Disclaimer:</strong> The Holistic Therapy Dog certification is commemorative and does not confer legal rights under the ADA.</p>
      </div>
      
      <!-- Copyright -->
      <div class="footer-bottom">
        <p>&copy; ${currentYear} Holistic Therapy Dog Association. All Rights Reserved.</p>
      </div>
      
    </div>
  `;

})();
