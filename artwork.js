/**
 * HTDA Artwork Rotation System
 * 
 * Self-contained script that applies rotating dog artwork to headers,
 * footers, and page backgrounds. Uses cropped/cleaned images.
 * 
 * INSTALLATION: Add this single line to the top of header.js:
 *   document.head.appendChild(Object.assign(document.createElement('script'), {src: 'artwork.js'}));
 */

(function() {
    'use strict';
    
    // ========================================
    // CONFIGURATION
    // ========================================
    
    const R2_BASE = 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev';
    
    // Style families - images grouped by artistic style
    // Used to prevent matching styles in header AND footer
    const styleFamilies = {
        greek:     [23, 25, 33, 37],       // Greek meander/key patterns
        roman:     [29, 30, 43],           // Roman mosaic
        chinese:   [38, 40, 42],           // Chinese patterns
        artnouveau:[31, 34],               // Art nouveau/baroque scrollwork
        victorian: [28, 44],               // Victorian damask
        warhol:    [2, 3, 6, 24, 26],      // Pop art style
        klimt:     [11, 14, 15, 16],       // Klimt-inspired organic
        pixel:     [32, 35, 36],           // Pixel art style
        other:     [1, 4, 5, 7, 8, 9, 10, 12, 13, 17, 18, 19, 20, 22, 27]
    };
    
    // Images appropriate for each zone
    // Headers: Bold decorative friezes
    const headerStyles = [23, 24, 25, 26, 28, 29, 30, 31, 33, 34, 37, 38, 40, 42, 43];
    
    // Footers: All friezes including subtler ones
    const footerStyles = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44];
    
    // Backgrounds: Full-coverage patterns (work at low opacity)
    const backgroundStyles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22];
    
    // EXCLUDED (wrong color palette):
    // 39 = Cave painting (grey/brown)
    // 41 = Egyptian Anubis (tan/beige)
    
    // Fixed assignments per page for consistency
    const pageAssignments = {
        'index.html':           { header: 29, background: 13, footer: 37 },  // Roman mosaic, Klimt, Greek
        'about.html':           { header: 30, background: 3,  footer: 38 },
        'certification.html':   { header: 23, background: 15, footer: 42 },
        'faq.html':             { header: 43, background: 1,  footer: 31 },
        'contact.html':         { header: 25, background: 11, footer: 28 },
        'blog.html':            { header: 33, background: 14, footer: 40 },
        'services.html':        { header: 34, background: 2,  footer: 23 },
        'training.html':        { header: 37, background: 16, footer: 29 },
        'resources.html':       { header: 38, background: 4,  footer: 30 },
        'testimonials.html':    { header: 42, background: 5,  footer: 33 },
        'events.html':          { header: 26, background: 6,  footer: 34 },
        'membership.html':      { header: 28, background: 7,  footer: 25 },
        'directory.html':       { header: 31, background: 8,  footer: 43 },
        'gallery.html':         { header: 24, background: 9,  footer: 26 },
        'news.html':            { header: 40, background: 10, footer: 24 },
        'partners.html':        { header: 29, background: 12, footer: 44 },
        'volunteer.html':       { header: 30, background: 17, footer: 32 },
        'donate.html':          { header: 23, background: 18, footer: 35 },
        'privacy.html':         { header: 25, background: 19, footer: 36 },
        'terms.html':           { header: 33, background: 20, footer: 27 },
        'sitemap.html':         { header: 34, background: 22, footer: 28 }
    };
    
    // ========================================
    // CSS INJECTION
    // ========================================
    
    const css = `
        /* Header artwork background */
        header {
            position: relative !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
        }
        header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(75, 0, 0, 0.42);
            pointer-events: none;
            z-index: 0;
        }
        header > * {
            position: relative;
            z-index: 1;
        }
        
        /* Footer artwork background */
        footer {
            position: relative !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
        }
        footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(75, 0, 0, 0.37);
            pointer-events: none;
            z-index: 0;
        }
        footer > * {
            position: relative;
            z-index: 1;
        }
        
        /* Page background watermark */
        #htda-page-bg {
            position: fixed;
            top: -20px;
            left: -20px;
            right: -20px;
            bottom: -20px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.12;
            filter: grayscale(20%);
            pointer-events: none;
            z-index: -1;
        }
    `;
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    function getImageUrl(num) {
        return `${R2_BASE}/dog_art_${String(num).padStart(2, '0')}.jpg`;
    }
    
    function getStyleFamily(imageNum) {
        for (const [family, nums] of Object.entries(styleFamilies)) {
            if (nums.includes(imageNum)) return family;
        }
        return 'unknown';
    }
    
    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    
    function getPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.endsWith('.html') ? page : page + '.html';
    }
    
    function getPageAssignment() {
        const page = getPageName();
        
        // Use fixed assignment if available
        if (pageAssignments[page]) {
            return pageAssignments[page];
        }
        
        // Otherwise pick random but ensure no style matching
        const header = randomFrom(headerStyles);
        const headerFamily = getStyleFamily(header);
        
        // Footer must be different family
        const availableFooters = footerStyles.filter(n => getStyleFamily(n) !== headerFamily);
        const footer = randomFrom(availableFooters);
        const footerFamily = getStyleFamily(footer);
        
        // Background must be different from both
        const availableBgs = backgroundStyles.filter(n => {
            const family = getStyleFamily(n);
            return family !== headerFamily && family !== footerFamily;
        });
        const background = randomFrom(availableBgs);
        
        return { header, footer, background };
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    function init() {
        // Inject CSS
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        
        // Get assignments for this page
        const assignment = getPageAssignment();
        const headerUrl = getImageUrl(assignment.header);
        const footerUrl = getImageUrl(assignment.footer);
        const bgUrl = getImageUrl(assignment.background);
        
        console.log('HTDA Artwork init:', {
            page: getPageName(),
            header: assignment.header,
            footer: assignment.footer,
            background: assignment.background
        });
        
        // Apply header background
        const header = document.querySelector('header');
        if (header) {
            header.style.backgroundImage = `url('${headerUrl}')`;
            console.log('Header artwork applied:', headerUrl);
        }
        
        // Apply footer background
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.backgroundImage = `url('${footerUrl}')`;
            console.log('Footer artwork applied:', footerUrl);
        }
        
        // Create and apply page background
        const bgDiv = document.createElement('div');
        bgDiv.id = 'htda-page-bg';
        bgDiv.style.backgroundImage = `url('${bgUrl}')`;
        document.body.insertBefore(bgDiv, document.body.firstChild);
        console.log('Background artwork applied:', bgUrl);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
