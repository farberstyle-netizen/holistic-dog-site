/**
 * FOOTER.JS - Institutional Footer with Seal
 * Two centered columns with large seal in middle
 */

(function() {
  const footer = document.querySelector('footer');
  
  if (footer) {
    footer.innerHTML = `
      <div class="footer-container">
        <div class="footer-main">
          <div class="footer-column">
            <h4>Organization</h4>
            <ul>
              <li><a href="about.html">About Us</a></li>
              <li><a href="careers.html">Careers</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          
          <div class="footer-seal-center">
            <img src="gold-seal.png" alt="Holistic Therapy Dog Association Seal" />
          </div>
          
          <div class="footer-column">
            <h4>Legal</h4>
            <ul>
              <li><a href="verify.html">Verify License</a></li>
              <li><a href="privacy-policy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms & Conditions</a></li>
              <li><a href="advocacy.html">Advocacy</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-disclaimer">
          <p><strong>Disclaimer:</strong> The Holistic Therapy Dog certification is commemorative and does not confer legal rights under the ADA.</p>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Holistic Therapy Dog Association. All Rights Reserved.</p>
        </div>
      </div>
    `;
  }
})();
