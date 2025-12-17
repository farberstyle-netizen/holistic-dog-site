(function() {
  const navLinks = document.getElementById('nav-links');
  const navAccount = document.getElementById('nav-account-links');
  if (navLinks) {
    navLinks.innerHTML = '<li><a href="how-it-works.html">How It Works</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="meet-our-dogs.html">Meet Our Dogs</a></li><li><a href="about.html">About</a></li><li><a href="verify.html">Verify License</a></li>';
  }
  if (navAccount) {
    navAccount.innerHTML = '<a href="login.html" class="nav-btn">Login</a>';
  }
})();
