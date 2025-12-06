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
        riley:     [4],                    // Bridget Riley wavy
        lichten:   [6],                    // Lichtenstein pop art
        dubuffet:  [10],                   // Dubuffet sketchy
        mondrian:  [11],                   // Mondrian grid
        fantasy:   [21],                   // Fantasy winged dogs
        warhol:    [27, 29],               // Warhol outlines
        greek:     [31, 41],               // Greek meander
        frenchie:  [34],                   // French bulldog faces
        pixel:     [35, 36],               // Pixel art
        dachshund: [37],                   // Warhol dachshund grid
        damask:    [38, 39],               // Victorian damask corgis
        mosaic:    [40],                   // Roman mosaic
        chinese:   [42, 43],               // Chinese shar-pei
        egyptian:  [44],                   // Egyptian hieroglyph
        cave:      [45]                    // Cave painting
    };
    
    // ONLY wide strips (2.5:1 ratio or higher) for headers/footers
    // Images: 4, 6, 10, 11, 21, 27, 29, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45
    const headerStyles = [4, 6, 10, 11, 21, 27, 29, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
    const footerStyles = [4, 6, 10, 11, 21, 27, 29, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
    
    // NO backgrounds - only header/footer strips
    // Total: 45 images (1 excluded: Egyptian Anubis tan)
    
    // Fixed assignments per page - header and footer strips ONLY
    const pageAssignments = {
        'index.html':           { header: 31, footer: 40 },  // Greek meander / Roman mosaic
        'about.html':           { header: 38, footer: 44 },  // Damask corgis / Egyptian
        'certification.html':   { header: 42, footer: 37 },  // Chinese shar-pei / Dachshund grid
        'faq.html':             { header: 45, footer: 34 },  // Cave painting / Frenchie
        'contact.html':         { header: 35, footer: 41 },  // Pixel art / Greek meander
        'blog.html':            { header: 36, footer: 43 },  // Pixel abstract / Chinese lattice
        'services.html':        { header: 34, footer: 31 },  // Frenchie / Greek meander
        'training.html':        { header: 40, footer: 38 },  // Roman mosaic / Damask
        'resources.html':       { header: 44, footer: 42 },  // Egyptian / Chinese
        'testimonials.html':    { header: 43, footer: 35 },  // Chinese lattice / Pixel
        'events.html':          { header: 41, footer: 45 },  // Greek / Cave
        'membership.html':      { header: 37, footer: 36 },  // Dachshund / Pixel
        'directory.html':       { header: 31, footer: 44 },  // Greek / Egyptian
        'gallery.html':         { header: 39, footer: 40 },  // Damask / Mosaic
        'news.html':            { header: 42, footer: 38 },  // Chinese / Damask
        'partners.html':        { header: 34, footer: 43 },  // Frenchie / Chinese
        'volunteer.html':       { header: 35, footer: 41 },  // Pixel / Greek
        'donate.html':          { header: 45, footer: 37 },  // Cave / Dachshund
        'privacy.html':         { header: 36, footer: 44 },  // Pixel / Egyptian
        'terms.html':           { header: 40, footer: 42 },  // Mosaic / Chinese
        'sitemap.html':         { header: 38, footer: 31 },  // Damask / Greek
        'quiz.html':            { header: 43, footer: 35 },  // Chinese / Pixel
        'dashboard.html':       { header: 41, footer: 39 },  // Greek / Damask
        'verify.html':          { header: 44, footer: 36 },  // Egyptian / Pixel
        'checkout.html':        { header: 37, footer: 45 }   // Dachshund / Cave
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
            border: none !important;
            margin-top: 0 !important;
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
        
        /* Remove any gap/border above footer */
        body > section:last-of-type,
        body > main:last-of-type,
        body > div:last-of-type:not(.modal-overlay) {
            margin-bottom: 0 !important;
            border-bottom: none !important;
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
