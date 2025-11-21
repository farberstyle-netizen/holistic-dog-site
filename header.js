document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.getElementById('nav-links');
  const navAccount = document.getElementById('nav-account-links');
  const token = localStorage.getItem('session_token');

  const publicLinks = [
    { href: 'about.html', text: 'About Us' },
    { href: 'meet-our-dogs.html', text: 'Meet Our Dogs' },
    { href: 'gallery.html', text: 'Gallery' }
  ];

  if (navLinks) {
    navLinks.innerHTML = publicLinks.map(link => 
      `<li><a href="${link.href}">${link.text}</a></li>`
    ).join('');
  }

  if (navAccount) {
    if (token) {
      navAccount.innerHTML = `
        <div class="account-dropdown-container">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${token.substring(0,8)}" 
               alt="Profile" class="profile-pic">
          <div id="account-dropdown" class="account-dropdown">
            <a href="dashboard.html">Dashboard</a>
            <a href="account.html">My Account</a>
            <a href="#" onclick="logout(); return false;">Logout</a>
          </div>
        </div>
      `;

      const accountContainer = document.querySelector('.account-dropdown-container');
      const dropdown = document.getElementById('account-dropdown');

      if (accountContainer && dropdown) {
        let timeout;
        
        accountContainer.addEventListener('mouseenter', () => {
          clearTimeout(timeout);
          dropdown.classList.add('show');
        });
        
        accountContainer.addEventListener('mouseleave', () => {
          timeout = setTimeout(() => {
            dropdown.classList.remove('show');
          }, 200);
        });
        
        dropdown.addEventListener('mouseenter', () => {
          clearTimeout(timeout);
        });
        
        dropdown.addEventListener('mouseleave', () => {
          timeout = setTimeout(() => {
            dropdown.classList.remove('show');
          }, 200);
        });
      }
    } else {
      navAccount.innerHTML = `<a href="login.html" class="cta-button">LOGIN</a>`;
    }
  }
});

function logout() {
  localStorage.removeItem('session_token');
  window.location.href = 'index.html';
}