// API Configuration - Single source of truth for all API endpoints
// Uses environment-based routing without hardcoded development domains

const API_CONFIG = {
  // Detect environment
  isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

  // API endpoints (same-origin paths for production, full URLs for dev)
  get endpoints() {
    const isDev = this.isDev;
    // Development: use subdomain-based Worker URLs (configure DEV_API_BASE as needed)
    const devBase = isDev ? (window.DEV_API_BASE || 'https://dev-api.example.com') : '';

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
        adminShipments: `${devBase}/api-admin-shipments`,
        logout: `${devBase}/api-logout`
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
      adminShipments: '/api/admin-shipments',
      logout: '/api/logout'
    };
  },

  // R2 bucket URL for dog photos
  get r2Origin() {
    if (this.isDev) {
      // Development: use public R2 URL (configure DEV_R2_ORIGIN as needed)
      return window.DEV_R2_ORIGIN || 'https://dev-r2.example.com';
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
