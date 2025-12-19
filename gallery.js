/**
 * GALLERY.JS - Dynamic Gallery Loader with Frame Orientation Support
 */

// Wait for page to load, then fetch and display gallery dogs
(async function loadGallery() {
  const galleryGrid = document.querySelector('.registry-grid');
  
  // Show loading state
  galleryGrid.innerHTML = `
    <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
      <p style="color: #555; font-size: 1.2rem;">Loading certified therapy dogs...</p>
    </div>
  `;

  try {
    // Fetch gallery dogs from API
    const response = await fetch('https://api-gallery.farberstyle.workers.dev');
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();

    // Check if we have dogs
    if (!data.success || !data.dogs || data.dogs.length === 0) {
      galleryGrid.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
          <p style="color: #555; font-size: 1.2rem;">No certified dogs yet. Be the first to join!</p>
          <a href="quiz.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 2rem; background: #8B0000; color: white; text-decoration: none; border-radius: 4px;">Start Certification</a>
        </div>
      `;
      return;
    }

    // Clear loading state
    galleryGrid.innerHTML = '';

    // Create and add dog cards
    data.dogs.forEach(dog => {
      const card = createDogCard(dog);
      galleryGrid.appendChild(card);
    });

  } catch (error) {
    console.error('Failed to load gallery:', error);
    
    galleryGrid.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
        <p style="color: #c33; font-size: 1.2rem;">Failed to load gallery. Please refresh the page.</p>
        <p style="color: #777; font-size: 0.9rem; margin-top: 0.5rem;">Error: ${error.message}</p>
      </div>
    `;
  }
})();

/**
 * Create a dog card HTML element with frame orientation support
 * @param {Object} dog - Dog data from API
 * @returns {HTMLElement} - Dog card element
 */
function createDogCard(dog) {
  const card = document.createElement('div');
  card.className = 'dog-card';

  // Format dog name to uppercase
  const dogName = dog.dog_name.toUpperCase();
  
  // Get photo URL from R2 custom domain
  const photoUrl = dog.photo_url;
  
  // Get frame orientation (default to square if not specified)
  const frameOrientation = dog.frame_orientation || 'square';
  
  // Format certification date
  let certDate = 'Recently Certified';
  if (dog.paid_at) {
    try {
      const date = new Date(dog.paid_at);
      certDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      // Keep default if date parsing fails
    }
  }

  // Determine image container class based on frame orientation
  let containerClass = 'dog-image-container';
  let imageStyle = '';
  
  if (frameOrientation === 'portrait') {
    containerClass += ' frame-portrait';
    imageStyle = 'aspect-ratio: 3/4; object-fit: cover;';
  } else if (frameOrientation === 'landscape') {
    containerClass += ' frame-landscape';
    imageStyle = 'aspect-ratio: 4/3; object-fit: cover;';
  } else { // square
    containerClass += ' frame-square';
    imageStyle = 'aspect-ratio: 1/1; object-fit: cover;';
  }

  // Build the card using DOM methods to prevent XSS
  const imageContainer = document.createElement('div');
  imageContainer.className = containerClass;

  if (photoUrl) {
    const img = document.createElement('img');
    img.src = `https://photos.holistictherapydogassociation.com/${encodeURIComponent(photoUrl)}`;
    img.alt = dogName; // textContent auto-escapes
    img.className = 'dog-image';
    img.style.cssText = imageStyle;
    img.onerror = function() {
      const placeholder = document.createElement('div');
      placeholder.className = 'dog-image-placeholder';
      placeholder.textContent = 'Photo Loading...';
      this.parentElement.replaceChild(placeholder, this);
    };
    imageContainer.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'dog-image-placeholder';
    placeholder.textContent = 'Photo Loading...';
    imageContainer.appendChild(placeholder);
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'dog-content';

  const nameHeading = document.createElement('h3');
  nameHeading.className = 'dog-name';
  nameHeading.textContent = dogName; // Safely escapes HTML

  const statusHeading = document.createElement('h4');
  statusHeading.className = 'dog-status';
  statusHeading.textContent = 'LICENSE: ACTIVE';

  const licenseP = document.createElement('p');
  licenseP.className = 'dog-bio';
  licenseP.textContent = `License ID: ${dog.license_id || 'Pending'}`;

  const certP = document.createElement('p');
  certP.className = 'dog-bio';
  certP.textContent = `Certified: ${certDate}`;

  contentDiv.appendChild(nameHeading);
  contentDiv.appendChild(statusHeading);
  contentDiv.appendChild(licenseP);
  contentDiv.appendChild(certP);

  card.appendChild(imageContainer);
  card.appendChild(contentDiv);

  return card;
}
