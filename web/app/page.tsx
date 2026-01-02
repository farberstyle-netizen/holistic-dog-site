// TODO(index.html): <script src="header.js"></script> - now handled by Header component in layout.tsx
// TODO(index.html): <script src="footer.js"></script> - now handled by Footer component in layout.tsx
// TODO(index.html): function startCertification() - inline script lines 238-249
// TODO(index.html): function closeModal() - inline script lines 251-253
// TODO(index.html): function goToQuiz() - inline script lines 255-258
// TODO(index.html): function goToDashboard() - inline script lines 260+
// TODO(index.html): scroll indicator handler - inline script lines 270-278
// TODO(index.html): modal outside click handler - inline script lines 266-268

export default function Home() {
  return (
    <>
      {/* ===== VIDEO HERO - SINGLE VIDEO ===== */}
      <section className="video-hero">
        <div className="hero-video-container">
          <video className="hero-video" autoPlay muted loop playsInline>
            <source src="hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay"></div>
        </div>

        {/* Floating content */}
        <div className="hero-content">
          <div className="hero-content-box">
            <h1>Where Loyalty Meets Legacy</h1>
            <p>Certify their Dedication and Devotion</p>
            <button className="cta-button">Start HERE</button>
            {/* TODO(index.html): onclick="startCertification()" - source not yet ported */}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="trust-section">
        <h2>Committed to Excellence</h2>
        <div className="icons-grid">
          <div className="icon-card">
            <img src="doctor.png" alt="Holistic Wellness Icon" />
            <h3>Holistic Focus</h3>
            <p>Honoring the therapeutic bond between dogs and humans—recognizing their profound impact on emotional, mental, and spiritual well-being.</p>
          </div>

          <div className="icon-card">
            <img src="judge.png" alt="Trust and Integrity Icon" />
            <h3>Trusted</h3>
            <p>Every certification is issued with integrity to ensure it reflects the genuine bond between you and your dog.</p>
          </div>

          <div className="icon-card">
            <img src="globe.png" alt="World-Class Standards Icon" />
            <h3>World-Class Standards</h3>
            <p>A globally accessible database validating your dog's certification—maintaining excellence and credibility worldwide.</p>
          </div>
        </div>
      </section>

      {/* ===== DIPLOMA PREVIEW ===== */}
      <section className="diploma-preview">
        <div className="diploma-container">
          <h2>Learn How to Certify Your Dog</h2>
          <p className="section-intro">Take the Quiz!</p>

          <a href="quiz.html" className="cta-button" style={{marginBottom: '2rem'}}>Start Quiz</a>

          <div style={{maxWidth: '900px', margin: '0 auto'}}>
            <img src="diploma-holder.jpg" alt="Official HTDA Diploma in Leatherette Holder" style={{width: '100%', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}} />
          </div>
        </div>
      </section>

      {/* Choice Modal for logged-in users */}
      <div id="choiceModal" className="modal-overlay">
        <div className="modal-content">
          <button className="close-modal">&times;</button>
          {/* TODO(index.html): onclick="closeModal()" - source not yet ported */}
          <h3>Welcome Back!</h3>
          <p>Would you like to certify another dog, or view your current account?</p>
          <div className="modal-actions">
            <button className="modal-btn btn-primary">YES, I want to certify another dog</button>
            {/* TODO(index.html): onclick="goToQuiz()" - source not yet ported */}
            <button className="modal-btn btn-secondary">NO, take me to my account</button>
            {/* TODO(index.html): onclick="goToDashboard()" - source not yet ported */}
          </div>
        </div>
      </div>
    </>
  );
}
