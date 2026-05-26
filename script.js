// MEDIA LIGHTBOX: fullscreen video + photos
(function() {
  const lightbox = document.getElementById('media-lightbox');
  if (!lightbox) return;

  const imgEl = lightbox.querySelector('.media-lightbox-img');
  const videoEl = lightbox.querySelector('.media-lightbox-video');
  const videoSource = videoEl.querySelector('source');
  const closeBtn = lightbox.querySelector('.media-lightbox-close');
  const backdrop = lightbox.querySelector('.media-lightbox-backdrop');

  function openImage(src, alt) {
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

  document.querySelectorAll('.hero-media-photos img').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      openImage(img.src, img.alt);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();
// METRIC COUNTERS (simple)
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

    const target = parseInt(numEl.getAttribute('data-target'), 10);
    const suffix = numEl.getAttribute('data-suffix') || '';
    if (!target || isNaN(target)) return;

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
