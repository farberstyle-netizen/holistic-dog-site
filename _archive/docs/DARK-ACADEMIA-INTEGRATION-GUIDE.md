# Dark Academia Theme Integration Guide
## "Immersive Institutional Theatre" - Tactile UI System

This guide shows how to apply the Dark Academia theme to all pages of the Holistic Therapy Dog Association website.

---

## Quick Start: Adding the Theme to Any Page

### 1. Add the Stylesheet

In the `<head>` of any HTML file, add this line **after** `style.css`:

```html
<link rel="stylesheet" href="dark-academia.css">
```

The fonts (Playfair Display and Lato) should already be loaded via Google Fonts.

---

## Visual Foundation Implementation

### Body Texture Overlay

✅ **Automatic** - The paper grain texture is applied globally via the `body::before` pseudo-element. No additional work needed.

### Color Palette Migration

Replace existing color classes/styles with the new palette:

| Old Color | New CSS Variable | Usage |
|-----------|-----------------|-------|
| Red/Maroon backgrounds | `var(--oxblood)` | Section backgrounds |
| White backgrounds | `var(--cream)` or `var(--parchment)` | Cards, containers |
| Yellow/Gold accents | `var(--gold)` | Buttons, borders, highlights |

#### Example Migration:

```html
<!-- BEFORE -->
<section style="background: #8B0000; color: white;">

<!-- AFTER -->
<section class="bg-oxblood" style="color: var(--cream);">
```

### Vignette Effect

Add the `content-section` class to any major section to get the library lighting vignette:

```html
<section class="hero-section content-section bg-oxblood">
    <!-- Automatic vignette applied -->
</section>
```

---

## Typography Transformation

### Headlines (H1, H2, H3)

✅ **Automatic** - All headlines now use Playfair Display with increased letter-spacing.

If you need to manually apply the style:

```html
<h2 class="headline">Certification Registry</h2>
```

### Labels and Subheads

✅ **Automatic** - All `<label>`, `<button>`, and `.subhead` elements are now uppercase with wide letter-spacing.

For custom elements:

```html
<p class="subhead">Department of Canine Affairs</p>
```

---

## Quiz-Specific Components

### Progress Bar

Already implemented in `quiz.html`. To add to other multi-step forms:

```html
<div class="quiz-progress-container">
    <div id="progress-bar" class="quiz-progress-bar" style="width: 50%;"></div>
</div>

<script>
function updateProgress(currentStep, totalSteps) {
    const progressBar = document.getElementById('progress-bar');
    const percent = (currentStep / totalSteps) * 100;
    progressBar.style.width = percent + '%';
}
</script>
```

### Wax Seal Radio Buttons

Replace standard radio inputs with this HTML pattern:

```html
<!-- BEFORE: Standard Radio -->
<label>
    <input type="radio" name="choice" value="yes"> Yes
</label>

<!-- AFTER: Wax Seal Radio -->
<label class="wax-seal-radio">
    <input type="radio" name="choice" value="yes">
    <span>Yes, I certify this information is accurate</span>
</label>
```

**CSS handles everything automatically** - the gold ring and hot wax animation will apply.

#### Full Form Example:

```html
<form>
    <label class="wax-seal-radio">
        <input type="radio" name="dog-type" value="small">
        <span>Small Breed (Under 25 lbs)</span>
    </label>

    <label class="wax-seal-radio">
        <input type="radio" name="dog-type" value="medium">
        <span>Medium Breed (25-60 lbs)</span>
    </label>

    <label class="wax-seal-radio">
        <input type="radio" name="dog-type" value="large">
        <span>Large Breed (60+ lbs)</span>
    </label>
</form>
```

---

## Bureaucratic Button System

### Primary Buttons

Use the `.btn-bureaucratic` class for all primary actions:

```html
<!-- BEFORE -->
<button class="cta-button">Submit</button>

<!-- AFTER -->
<button class="btn-bureaucratic">Submit Application</button>
```

### Recommended Button Copy

Transform generic button text into institutional language:

| Generic | Bureaucratic |
|---------|-------------|
| "Submit" | "Submit Application for Review" |
| "Continue" | "Proceed to Next Section" |
| "Finish" | "Finalize & Seal Documentation" |
| "Save" | "Record in Official Ledger" |
| "Delete" | "Strike from Registry" |
| "Confirm" | "Ratify Decision" |

### Button HTML Example:

```html
<button class="btn-bureaucratic" onclick="submitForm()">
    Submit Application for Review
</button>
```

---

## The Deliberation Screen

### Implementation (Already in quiz.html)

The 5-second "Anticipation Funnel" is implemented with:

1. **HTML** - The screen overlay:
```html
<div id="deliberation-screen" class="deliberation-screen">
    <div class="seal-stamp"></div>
    <p id="deliberation-text" class="deliberation-text">Consulting the 1924 Ledger...</p>
</div>
```

2. **JavaScript** - Trigger and message cycling:
```javascript
function showDeliberation(redirectUrl) {
    const screen = document.getElementById('deliberation-screen');
    const text = document.getElementById('deliberation-text');

    const messages = [
        "Consulting the 1924 Ledger...",
        "Verifying Good Boy Status...",
        "Awaiting Dean's Signature...",
        "Ratifying Credentials..."
    ];

    let index = 0;
    screen.classList.add('active');

    const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        text.textContent = messages[index];
    }, 1250);

    setTimeout(() => {
        clearInterval(interval);
        window.location.href = redirectUrl;
    }, 5000);
}
```

### Customizing Messages

Change the `messages` array for different contexts:

```javascript
// For payment processing
const messages = [
    "Inscribing transaction in the Master Ledger...",
    "Applying official wax seal...",
    "Awaiting Treasurer's approval...",
    "Finalizing registry entry..."
];

// For form submission
const messages = [
    "Reviewing application documents...",
    "Cross-referencing 1924 charter...",
    "Awaiting committee decision...",
    "Preparing official response..."
];
```

---

## Page-by-Page Migration Checklist

### For Every Page:

1. ✅ Add `<link rel="stylesheet" href="dark-academia.css">` in `<head>`
2. ✅ Replace color values with CSS variables
3. ✅ Add utility classes (`bg-oxblood`, `bg-cream`, etc.)
4. ✅ Update button text to bureaucratic copy
5. ✅ Apply `.btn-bureaucratic` to primary buttons
6. ✅ Convert radio buttons to `.wax-seal-radio` pattern
7. ✅ Add vignette classes to major sections

### High-Priority Pages for Theme Application:

1. **index.html** - Homepage hero section
2. **signup.html** - Registration form
3. **add-dog.html** - Dog registration form
4. **checkout.html** - Payment flow
5. **gallery.html** - Certified dogs display
6. **account.html** - User dashboard
7. **admin.html** - Admin panel

---

## Utility Classes Reference

### Background Colors
```html
<div class="bg-oxblood">Deep oxblood background</div>
<div class="bg-cream">Cream/off-white background</div>
<div class="bg-parchment">Aged parchment background</div>
```

### Text Colors
```html
<p class="text-oxblood">Oxblood text</p>
<p class="text-gold">Gold accent text</p>
<p class="text-cream">Cream text (for dark backgrounds)</p>
```

### Border Colors
```html
<div class="border-gold">Gold border</div>
<div class="border-oxblood">Oxblood border</div>
```

### Special Effects
```html
<h1 class="letterpress">Engraved headline effect</h1>
```

---

## CSS Variables Quick Reference

Use these in inline styles or custom CSS:

```css
/* Colors */
var(--oxblood)         /* #5d1818 - Primary dark red */
var(--oxblood-dark)    /* #3d0f0f - Darker variant */
var(--cream)           /* #fdfbf7 - Warm off-white */
var(--bone)            /* #F5F2EE - Subtle cream */
var(--gold)            /* #D4A574 - Matte metallic gold */
var(--gold-dark)       /* #C5A059 - Deeper gold */
var(--parchment)       /* #f9f6f1 - Aged paper */

/* Typography */
var(--letter-spacing-headline)  /* 0.05em */
var(--letter-spacing-label)     /* 0.15em */

/* Transitions */
var(--transition-slow)    /* 0.6s ease-in-out */
var(--transition-medium)  /* 0.4s ease */
```

---

## Advanced Customization

### Adjusting Texture Opacity

To make the paper grain more/less visible:

```css
/* In a custom stylesheet or style block */
:root {
    --texture-opacity: 0.12; /* Default is 0.08 */
}
```

### Custom Vignette Strength

```css
:root {
    --vignette-strength: rgba(0, 0, 0, 0.8); /* Darker vignette */
}
```

### Adding Custom Bureaucratic Forms

For multi-page forms or applications:

```html
<div class="application-form bg-parchment" style="padding: 3rem; max-width: 800px; margin: 0 auto;">
    <h2>Official Application Form</h2>
    <p class="subhead">Section I: Candidate Information</p>

    <label class="form-label">Full Legal Name of Canine</label>
    <input type="text" name="dog_name" required>

    <label class="form-label">Breed Classification</label>
    <label class="wax-seal-radio">
        <input type="radio" name="breed" value="purebred">
        <span>Purebred with Pedigree</span>
    </label>
    <label class="wax-seal-radio">
        <input type="radio" name="breed" value="mixed">
        <span>Mixed Heritage</span>
    </label>

    <button class="btn-bureaucratic">Submit for Evaluation</button>
</div>
```

---

## Testing Checklist

After applying the theme to a page:

- [ ] Paper grain texture visible on body
- [ ] Headlines use Playfair Display with wide spacing
- [ ] Labels are uppercase with wide spacing
- [ ] Buttons have oxblood gradient and gold border
- [ ] Button hover effect shows gold glow
- [ ] Radio buttons show gold ring when unchecked
- [ ] Radio buttons animate with "wax seal" when checked
- [ ] Color palette matches oxblood/cream/gold scheme
- [ ] Vignette effect visible on colored sections
- [ ] Progress bar (if present) shows gold fill
- [ ] All text is readable and properly contrasted

---

## Performance Notes

- The SVG noise texture is embedded as a data URI (no external request)
- All animations use CSS transforms (GPU-accelerated)
- Transition durations are intentionally slow for "deliberate" feel
- Theme adds ~8KB to page load (minified CSS would be ~5KB)

---

## Browser Compatibility

✅ **Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ **Partial Support (no texture):**
- IE 11 (lacks mix-blend-mode support)

---

## Next Steps

1. Apply theme to homepage (`index.html`)
2. Update all form pages with wax seal radios
3. Add deliberation screens to checkout/payment flows
4. Update admin panel with institutional aesthetic
5. Create custom "certificate" design for completed certifications

---

**Need help?** Reference the fully-implemented `quiz.html` as a working example of all theme features.
