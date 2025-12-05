/**
 * HTDA Artwork Rotation System
 * 
 * Self-contained script that applies rotating dog artwork strips to headers
 * and footers. Wide strips only (2.5:1 ratio or higher).
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
    
    // Style families - prevent same style in header AND footer
    const styleFamilies = {
        greek:     [33, 37],               // Greek meander strips
        chinese:   [38, 40, 42],           // Chinese pattern strips
        artnouveau:[31, 34],               // Art nouveau scrollwork strips
        victorian: [28, 44],               // Victorian damask strips
        pixel:     [32, 35, 36],           // Pixel art strips
        other:     [27, 43]                // Other strip patterns
    };
    
    // ONLY wide strips (2.5:1 ratio or higher) for headers/footers
    const headerStyles = [27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44];
    const footerStyles = [27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 40, 42, 43, 44];
    
    // NO backgrounds - only header/footer strips
    // Excluded: 39 (grey), 41 (tan) - wrong color palette
    
    // Fixed assignments per page - header and footer strips ONLY
    const pageAssignments = {
        'index.html':           { header: 28, footer: 37 },
        'about.html':           { header: 31, footer: 38 },
        'certification.html':   { header: 33, footer: 42 },
        'faq.html':             { header: 43, footer: 34 },
        'contact.html':         { header: 35, footer: 27 },
        'blog.html':            { header: 36, footer: 40 },
        'services.html':        { header: 34, footer: 32 },
        'training.html':        { header: 37, footer: 28 },
        'resources.html':       { header: 38, footer: 31 },
        'testimonials.html':    { header: 42, footer: 33 },
        'events.html':          { header: 27, footer: 35 },
        'membership.html':      { header: 28, footer: 36 },
        'directory.html':       { header: 31, footer: 43 },
        'gallery.html':         { header: 32, footer: 44 },
        'news.html':            { header: 40, footer: 38 },
        'partners.html':        { header: 33, footer: 44 },
        'volunteer.html':       { header: 34, footer: 27 },
        'donate.html':          { header: 35, footer: 42 },
        'privacy.html':         { header: 36, footer: 43 },
        'terms.html':           { header: 37, footer: 40 },
        'sitemap.html':         { header: 38, footer: 31 }
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
        
        return { header, footer };
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
        
        console.log('HTDA Artwork init:', {
            page: getPageName(),
            header: assignment.header,
            footer: assignment.footer
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
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
