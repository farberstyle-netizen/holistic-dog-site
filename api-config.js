// API Configuration - Single source of truth for all API endpoints
// Eliminates hardcoded .workers.dev and r2.dev URLs throughout the codebase

const API_CONFIG = {
  // Detect environment
  isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // API endpoints (same-origin paths for production, full URLs for dev)
  get endpoints() {
    const isDev = this.isDev;
    const devBase = 'https://farberstyle.workers.dev';

    if (isDev) {
      return {
        login: `${devBase}/api-login`,
        signup: `${devBase}/api-signup`,
        verify: `${devBase}/api-verify`,
        account: `${devBase}/api-account`,
        checkout: `${devBase}/api-checkout`,
        dogs: `${devBase}/api-dogs`,
        resetPassword: `${devBase}/api-reset-password`,
        gallery: `${devBase}/api-gallery`,
        admin: `${devBase}/api-admin`,
        adminShipments: `${devBase}/api-admin-shipments`
      };
    }

    // Production: same-origin paths (routed by Cloudflare)
    return {
      login: '/api/login',
      signup: '/api/signup',
      verify: '/api/verify',
      account: '/api/account',
      checkout: '/api/checkout',
      dogs: '/api/dogs',
      resetPassword: '/api/reset-password',
      gallery: '/api/gallery',
      admin: '/api/admin',
      adminShipments: '/api/admin-shipments'
    };
  },

  // R2 bucket URL for dog photos
  get r2Origin() {
    if (this.isDev) {
      return 'https://pub-6ce181398b9b4e588bcc0db8db53f07a.r2.dev';
    }
    // Production: use CDN subdomain or same-origin path
    return '/cdn';
  },

  // Helper to get full photo URL
  getPhotoUrl(photoFilename) {
    if (!photoFilename) return '/default-pfp.png';
    if (photoFilename.startsWith('http')) return photoFilename;
    return `${this.r2Origin}/${photoFilename}`;
  },

  // Helper for authenticated fetch (uses cookies, not localStorage)
  async fetch(endpoint, options = {}) {
    const url = typeof endpoint === 'string' ? endpoint : endpoint;
    const config = {
      ...options,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    return fetch(url, config);
  }
};

// Export for use in HTML pages
window.API_CONFIG = API_CONFIG;
