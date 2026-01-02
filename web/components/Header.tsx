'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const closeMobileMenu = () => setShowMobileMenu(false);

  return (
    <header>
      <div className="nav-container">
        <Link href="/" className="logo" onClick={closeMobileMenu}>
          Holistic Therapy<br />Dog Association
        </Link>

        <button
          className={`hamburger-menu ${showMobileMenu ? 'active' : ''}`}
          aria-label="Toggle menu"
          onClick={() => setShowMobileMenu(v => !v)}
          type="button"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <nav className={showMobileMenu ? 'mobile-active' : ''}>
          <ul id="nav-links">
            <li>
              <Link href="/how-it-works" className="nav-link" onClick={closeMobileMenu}>
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/gallery" className="nav-link" onClick={closeMobileMenu}>
                Gallery
              </Link>
            </li>
            <li>
              <Link href="/meet-our-dogs" className="nav-link" onClick={closeMobileMenu}>
                Meet Our Dogs
              </Link>
            </li>
            <li>
              <Link href="/verify" className="nav-link" onClick={closeMobileMenu}>
                Verify License
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
