import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-container">

        {/* Main Footer Content */}
        <div className="footer-main">

          {/* Left Column */}
          <div className="footer-column">
            <h4>Organization</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Center Seal */}
          <div className="footer-seal-center">
            <Link href="/" aria-label="Return to homepage">
              <img src="/gold-seal.png" alt="HTDA Official Seal" width="160" height="160" />
            </Link>
          </div>

          {/* Right Column */}
          <div className="footer-column">
            <h4>Resources</h4>
            <ul>
              <li><Link href="/verify">Verify License</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
              <li><Link href="/advocacy">Advocacy</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
            </ul>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="footer-disclaimer">
          <p><strong>Disclaimer:</strong> The Holistic Therapy Dog certification is commemorative and does not confer legal rights under the ADA.</p>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} Holistic Therapy Dog Association. All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
}
