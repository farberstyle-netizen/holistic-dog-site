// API Configuration - Single source of truth for all API endpoints
// This prevents hardcoded .workers.dev URLs throughout the codebase

const API_CONFIG = {
  // Detect environment
  isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // Base API origin (same-origin for production, workers.dev for development)
  get baseOrigin() {
    if (this.isDev) {
      return 'https://farberstyle.workers.dev';
    }
    return 'https://api.holistictherapydogassociation.com';
  },

  // API endpoints
  get endpoints() {
    const base = this.baseOrigin;
    return {
      login: `${base}/api-login`,
      signup: `${base}/api-signup`,
      verify: `${base}/api-verify`,
      account: `${base}/api-account`,
      checkout: `${base}/api-checkout`,
      dogs: `${base}/api-dogs`,
      resetPassword: `${base}/api-reset-password`,
      gallery: `${base}/api-gallery`,
      admin: `${base}/api-admin`,
      adminShipments: `${base}/api-admin-shipments`
    };
  },

  // R2 bucket URL for dog photos
  get r2Origin() {
    if (this.isDev) {
      return 'https://pub-6ce181398b9b4e588bcc0db8db53f07a.r2.dev';
    }
    return 'https://cdn.holistictherapydogassociation.com';
  },

  // Helper to get full photo URL
  getPhotoUrl(photoFilename) {
    if (!photoFilename) return '/default-pfp.png';
    return `${this.r2Origin}/${photoFilename}`;
  }
};

// Export for use in HTML pages
window.API_CONFIG = API_CONFIG;
