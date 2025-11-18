document.addEventListener("DOMContentLoaded", function() {
    // 1. Inject consistent navigation across all pages
    const navLinksContainer = document.getElementById("nav-links");
    const accountContainer = document.getElementById("nav-account-links");

    // Standard navigation for all pages
    if (navLinksContainer) {
        navLinksContainer.innerHTML = `
            <li><a href="how-it-works.html">How It Works</a></li>
            <li><a href="meet-our-dogs.html">Meet Our Dogs</a></li>
            <li><a href="gallery.html">Gallery</a></li>
            <li><a href="why.html">Why the HTDA</a></li>
            <li><a href="verify.html" class="nav-verify-prominent">Verify License</a></li>
        `;
    }

    // 2. Handle Account Logic (Top Right)
    const token = localStorage.getItem("session_token");
    const userAvatar = "https://placehold.co/100x100/B89A6A/5D2A2A?text=ME"; 

    if (accountContainer) {
        if (token) {
            // LOGGED IN: Show profile picture
            accountContainer.innerHTML = `
                <a href="dashboard.html" title="My Dashboard">
                    <img src="${userAvatar}" alt="My Profile" class="user-pfp">
                </a>
            `;
        } else {
            // LOGGED OUT: Show Login Button
            accountContainer.innerHTML = `
                <a href="login.html" class="btn-login-header">LOGIN</a>
            `;
        }
    }
});