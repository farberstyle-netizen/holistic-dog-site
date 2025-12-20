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
    const response = await fetch(API_CONFIG.endpoints.gallery);
    
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

  // Build the card HTML
  card.innerHTML = `
    <div class="${containerClass}">
      ${photoUrl ? 
        `<img src="https://photos.holistictherapydogassociation.com/${photoUrl}" 
             alt="${dogName}" 
             class="dog-image"
             style="${imageStyle}"
             onerror="this.parentElement.innerHTML='<div class=\\'dog-image-placeholder\\'>Photo Loading...</div>'">` 
        : 
        '<div class="dog-image-placeholder">Photo Loading...</div>'
      }
    </div>
    <div class="dog-content">
      <h3 class="dog-name">${dogName}</h3>
      <h4 class="dog-status">LICENSE: ACTIVE</h4>
      <p class="dog-bio">License ID: ${dog.license_id || 'Pending'}</p>
      <p class="dog-bio">Certified: ${certDate}</p>
    </div>
  `;

  return card;
}
