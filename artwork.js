/**
 * HTDA Artwork System - Self-Contained
 * Just include this ONE file - it handles everything
 * 
 * Add to header.js:
 *   const artworkScript = document.createElement('script');
 *   artworkScript.src = 'artwork.js';
 *   document.head.appendChild(artworkScript);
 */

(function() {
    'use strict';

    // =====================================================
    // CONFIGURATION
    // =====================================================
    
    const CONFIG = {
        baseUrl: 'https://pub-b8de7488131f47ae9cb4c0c980d7a984.r2.dev',
        
        // Style families - same style won't appear in header AND footer
        styleFamilies: {
            'pollock': [1, 2],
            'kusama': [3, 4],
            'picasso': [5, 6],
            'miro': [7, 8],
            'warhol': [9, 10],
            'mondrian': [11, 12],
            'klimt': [13, 14],
            'matisse': [15, 16],
            'haring': [17, 18],
            'lichtenstein': [19, 20],
            'klee': [21, 22],
            'greek': [23, 24, 25],
            'egyptian': [26, 27, 28],
            'roman': [29, 30],
            'chinese': [31, 32],
            'artnouveau': [33, 34],
            'dubuffet': [35, 36],
            'cave': [37, 38],
            'misc1': [39, 40],
            'misc2': [41, 42],
            'misc3': [43, 44]
        },

        // Which families work for each position
        headerStyles: ['greek', 'egyptian', 'roman', 'chinese', 'artnouveau', 'haring', 'miro', 'klee', 'cave'],
        backgroundStyles: ['klimt', 'kusama', 'pollock', 'mondrian', 'dubuffet', 'misc1', 'misc2'],
        footerStyles: ['matisse', 'warhol', 'picasso', 'lichtenstein', 'greek', 'egyptian', 'artnouveau', 'misc3'],

        // Fixed assignments per page (consistent each visit)
        pageAssignments: {
            'index.html':         { header: 23, background: 13, footer: 15 },
            'about.html':         { header: 26, background: 3,  footer: 9 },
            'how-it-works.html':  { header: 17, background: 11, footer: 5 },
            'gallery.html':       { header: 29, background: 1,  footer: 19 },
            'meet-our-dogs.html': { header: 31, background: 35, footer: 33 },
            'verify.html':        { header: 7,  background: 4,  footer: 27 },
            'quiz.html':          { header: 37, background: 21, footer: 10 },
            'contact.html':       { header: 34, background: 12, footer: 6 },
            'privacy.html':       { header: 24, background: 2,  footer: 16 },
            'terms.html':         { header: 28, background: 14, footer: 20 },
            'advocacy.html':      { header: 8,  background: 36, footer: 25 },
            'login.html':         { header: 18, background: 39, footer: 30 },
            'signup.html':        { header: 32, background: 40, footer: 38 },
            'account.html':       { header: 22, background: 41, footer: 34 },
            'dashboard.html':     { header: 25, background: 42, footer: 17 },
            'order-history.html': { header: 27, background: 43, footer: 7 },
            'my-dogs.html':       { header: 30, background: 44, footer: 21 },
            'diploma.html':       { header: 33, background: 13, footer: 1 },
            'payment-success.html': { header: 23, background: 3, footer: 19 },
            'admin.html':         { header: 38, background: 3,  footer: 11 },
            'admin-shipments.html': { header: 23, background: 35, footer: 19 },
        }
    };

    // =====================================================
    // INJECT CSS
    // =====================================================
    
    const css = `
        /* ===== HEADER WITH ARTWORK BACKGROUND ===== */
        header.has-artwork {
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            position: relative !important;
        }
        header.has-artwork::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(75, 0, 0, 0.85);
            z-index: 0;
        }
        header.has-artwork > * {
            position: relative;
            z-index: 1;
        }

        /* ===== FOOTER WITH ARTWORK BACKGROUND ===== */
        footer.has-artwork {
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            position: relative !important;
        }
        footer.has-artwork::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(75, 0, 0, 0.75);
            z-index: 0;
        }
        footer.has-artwork > * {
            position: relative;
            z-index: 1;
        }

        /* ===== PAGE BACKGROUND ===== */
        .artwork-background {
            position: fixed;
            top: -20px;
            left: -20px;
            width: calc(100% + 40px);
            height: calc(100% + 40px);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            z-index: -1;
            opacity: 0.06;
            filter: grayscale(20%);
        }
    `;

        /* ===== LOADING STATE ===== */
        .artwork-header.loading,
        .artwork-footer.loading,
        .artwork-background.loading {
            background-color: #4B0000;
            background-image: none;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .artwork-header { height: 60px; }
            .artwork-footer { height: 80px; }
            .artwork-background { opacity: 0.05; }
        }
        @media (max-width: 480px) {
            .artwork-header { height: 50px; }
            .artwork-footer { height: 60px; }
        }

        /* ===== FADE IN ===== */
        @keyframes artworkFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .artwork-header, .artwork-footer {
            animation: artworkFadeIn 0.8s ease-out;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function getImageUrl(num) {
        const padded = String(num).padStart(2, '0');
        return `${CONFIG.baseUrl}/dog_art_${padded}.jpg`;
    }

    function randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomImage(allowedStyles, excludeFamilies = []) {
        const available = allowedStyles.filter(s => !excludeFamilies.includes(s));
        if (available.length === 0) return { url: getImageUrl(1), style: 'fallback' };
        
        const chosenStyle = randomFrom(available);
        const images = CONFIG.styleFamilies[chosenStyle] || [1];
        const chosenImage = randomFrom(images);
        
        return { url: getImageUrl(chosenImage), style: chosenStyle, imageNum: chosenImage };
    }

    function getPageAssignment() {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        const assignment = CONFIG.pageAssignments[pageName];
        
        if (assignment) {
            return {
                header: { url: getImageUrl(assignment.header) },
                background: { url: getImageUrl(assignment.background) },
                footer: { url: getImageUrl(assignment.footer) }
            };
        }
        
        // Fallback: random non-matching set
        const header = getRandomImage(CONFIG.headerStyles);
        const background = getRandomImage(CONFIG.backgroundStyles, [header.style]);
        const footer = getRandomImage(CONFIG.footerStyles, [header.style, background.style]);
        return { header, background, footer };
    }

    // =====================================================
    // APPLY ARTWORK
    // =====================================================

    function applyArtwork(type, imageUrl, insertFn) {
        let el = document.querySelector(`.artwork-${type}`);
        
        if (!el) {
            el = document.createElement('div');
            el.className = `artwork-${type} loading`;
            insertFn(el);
        }

        const img = new Image();
        img.onload = function() {
            el.style.backgroundImage = `url('${imageUrl}')`;
            el.classList.remove('loading');
        };
        img.onerror = function() {
            el.classList.remove('loading');
        };
        img.src = imageUrl;
    }

    function init() {
        const artwork = getPageAssignment();

        // Apply artwork to existing HEADER
        const header = document.querySelector('header');
        if (header) {
            const img = new Image();
            img.onload = function() {
                header.style.backgroundImage = `url('${artwork.header.url}')`;
                header.classList.add('has-artwork');
            };
            img.src = artwork.header.url;
        }

        // Apply artwork to existing FOOTER
        const footer = document.querySelector('footer');
        if (footer) {
            const img = new Image();
            img.onload = function() {
                footer.style.backgroundImage = `url('${artwork.footer.url}')`;
                footer.classList.add('has-artwork');
            };
            img.src = artwork.footer.url;
        }

        // Page background (still a separate element)
        applyArtwork('background', artwork.background.url, function(el) {
            document.body.insertBefore(el, document.body.firstChild);
        });
        
        console.log('HTDA Artwork loaded:', artwork);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
