// ============================================================
// NAV TOGGLE (mobile menu)
// ============================================================
(function() {
  const navToggle = document.getElementById('nav-toggle');
  const navOverlay = document.querySelector('.nav-overlay');

  if (!navToggle || !navOverlay) return;

  navOverlay.addEventListener('click', () => {
    navToggle.checked = false;
  });
})();

// ============================================================
// PARTNER LOGO MARQUEE DUPLICATION
// ============================================================
(function() {
  const slide = document.getElementById('partner-slide');
  if (!slide) return;

  const logos = Array.from(slide.children);
  // İkinci kopyayı ekleyerek sonsuz marquee
  logos.forEach(logo => {
    const clone = logo.cloneNode(true);
    slide.appendChild(clone);
  });
})();

// ============================================================
// METRIC COUNTERS (numbers animate once on scroll)
// ============================================================
(function() {
  const cards = document.querySelectorAll('.metric-card');
  if (!cards.length) return;

  function animateCard(card) {
    const numEl = card.querySelector('.metric-number');
    if (!numEl) return;

    const staticValue = numEl.getAttribute('data-static');
    if (staticValue) {
      // 24/7 ve EU gibi sabit değerler
      numEl.textContent = staticValue;
      return;
    }

    const targetAttr = numEl.getAttribute('data-target');
    if (!targetAttr) return;

    const target = parseInt(targetAttr, 10);
    if (isNaN(target)) return;

    const suffix = numEl.getAttribute('data-suffix') || '';
    let current = 0;
    const steps = 40;
    const increment = target / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = target;
        clearInterval(interval);
      }
      numEl.textContent = Math.round(current) + suffix;
    }, 30);
  }

  function onScroll() {
    cards.forEach(card => {
      if (card.classList.contains('pop')) return;
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) {
        card.classList.add('pop');
        animateCard(card);
      }
    });
  }

  window.addEventListener('scroll', onScroll);
  window.addEventListener('load', onScroll);
})();

// ============================================================
// REVEAL ON SCROLL (fade-up animation for .reveal)
// ============================================================
(function() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  function onScrollReveal() {
    revealEls.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', onScrollReveal);
  window.addEventListener('load', onScrollReveal);
})();

// ============================================================
// MEDIA LIGHTBOX: fullscreen video + photos
// ============================================================
(function() {
  const lightbox = document.getElementById('media-lightbox');
  if (!lightbox) return;

  const imgEl = lightbox.querySelector('.media-lightbox-img');
  const videoEl = lightbox.querySelector('.media-lightbox-video');
  const videoSource = videoEl.querySelector('source');
  const closeBtn = lightbox.querySelector('.media-lightbox-close');
  const backdrop = lightbox.querySelector('.media-lightbox-backdrop');

  function openImage(src, alt) {
    // videoyu kapat
    videoEl.pause();
    videoEl.style.display = 'none';
    if (videoSource) {
      videoSource.src = '';
      videoEl.load();
    } else {
      videoEl.src = '';
    }

    imgEl.src = src;
    imgEl.alt = alt || '';
    imgEl.style.display = 'block';

    lightbox.classList.add('is-open');
  }

  function openVideo(src) {
    // resmi gizle
    imgEl.style.display = 'none';
    imgEl.src = '';

    if (videoSource) {
      videoSource.src = src;
      videoEl.load();
    } else {
      videoEl.src = src;
    }

    videoEl.style.display = 'block';
    lightbox.classList.add('is-open');
    videoEl.play().catch(() => {});
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    videoEl.pause();
  }

  // Hero main video fullscreen
  const heroMain = document.querySelector('.hero-media-main[data-type="video"]');
  if (heroMain) {
    const btn = heroMain.querySelector('.media-fullscreen-btn');
    const video = heroMain.querySelector('video');
    if (btn && video) {
      const sourceEl = video.querySelector('source');
      const src = (sourceEl && sourceEl.getAttribute('src')) || video.currentSrc;
      btn.addEventListener('click', () => {
        if (src) openVideo(src);
      });
    }
  }

  // Hero photos fullscreen
  document.querySelectorAll('.hero-media-photos img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      openImage(img.src, img.alt);
    });
  });

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();

// ============================================================
// CONTACT FORM: submit via fetch, no redirect
// ============================================================
(function() {
  const encodedEndpoint = 'aHR0cHM6Ly9mb3Jtc3ByZWUuaW8vZi9tbmpremprZA==';

  function decodeBase64(str) {
    try { return atob(str); } catch (e) { return ''; }
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const endpoint = decodeBase64(encodedEndpoint);
    if (!endpoint) return;

    // form action & method yine set edelim (Network’te net görünsün)
    form.setAttribute('action', endpoint);
    form.setAttribute('method', 'post');

    form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Formspree sayfasına gitmeyi engelle

      const formData = new FormData(form);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        // İstersen hiçbir mesaj verme, sadece formu temizle:
        if (res.ok) {
          form.reset();
          // Buraya istersek kendi mini mesajımızı ekleriz,
          // ama şu an hiçbir şey göstermiyoruz = “Bedankt” yok.
        }
      } catch (err) {
        // Hata olursa da sayfa değişmesin
        console.error('Contact form error', err);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initContactForm);
})();
