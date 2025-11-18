document.addEventListener("DOMContentLoaded", function() {
    // 1. Inject Header Content (Logo + Nav)
    // This ensures every page has the same links automatically
    const navLinksContainer = document.getElementById("nav-links");
    const accountContainer = document.getElementById("nav-account-links");

    // We use the existing HTML structure but populate logic here if needed.
    // Assuming your HTML has the <ul> for nav-links, we ensure the items are correct.
    if (navLinksContainer) {
        navLinksContainer.innerHTML = `
            <li><a href="about.html">About Us</a></li>
            <li><a href="diploma.html">The Diploma</a></li>
            <li><a href="meet-our-dogs.html">Meet Our Dogs</a></li>
            <li><a href="verify.html">Verify License</a></li>
        `;
    }

    // 2. Handle Account Logic (Top Right)
    const token = localStorage.getItem("session_token");
    
    // Placeholder for user avatar (You can replace this with a real URL from the database later)
    const userAvatar = "https://placehold.co/100x100/B89A6A/5D2A2A?text=ME"; 

    if (accountContainer) {
        if (token) {
            // LOGGED IN: Show PFP
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