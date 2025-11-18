document.addEventListener("DOMContentLoaded", function() {
    const navAccountDiv = document.getElementById("nav-account-links");
    const token = localStorage.getItem("session_token");

    if (navAccountDiv) {
        if (token) {
            // User is logged in
            navAccountDiv.innerHTML = `
                <a href="account.html" style="margin-right: 15px; font-weight:bold;">My Account</a>
                <a href="#" id="logout-link">Logout</a>
            `;
            
            document.getElementById("logout-link").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("session_token");
                window.location.href = "index.html";
            });
        } else {
            // User is NOT logged in
            navAccountDiv.innerHTML = `
                <a href="login.html" style="font-weight:bold;">Login / Get Certified</a>
            `;
        }
    }
});