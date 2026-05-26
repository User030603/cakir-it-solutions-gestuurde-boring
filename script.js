document.addEventListener("DOMContentLoaded", function () {
  /* ── 1. PARTNER MARQUEE LOGO KLONLAMA (CLAUDE SİSTEMİ) ── */
  var slide = document.getElementById('partner-slide');
  if (slide) {
    var origItems = Array.from(slide.children);
    origItems.forEach(function (item) {
      slide.appendChild(item.cloneNode(true));
    });
    slide.style.animation = 'marquee-scroll 30s linear infinite';
    
    slide.addEventListener('mouseenter', function () { slide.style.animationPlayState = 'paused'; });
    slide.addEventListener('mouseleave', function () { slide.style.animationPlayState = 'running'; });
  }

  /* ── 2. AŞAĞI KAYDIRDIKÇA BELİRME ANİMASYONU (SCROLL REVEAL) ── */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0) {
    var ioReveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          ioReveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { ioReveal.observe(el); });
  }

  /* ── 3. DÖNEN RAKAM SAYAÇLARI (COUNT-UP) ── */
  var counters = document.querySelectorAll('.metric-number[data-target]');
  if (counters.length > 0) {
    var ioCounter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        ioCounter.unobserve(entry.target);

        var el = entry.target;
        var target = parseInt(el.getAttribute('data-target'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1400; /* ms */
        var start = null;

        var card = el.closest('.metric-card');
        if (card) card.classList.add('pop');

        function step(timestamp) {
          if (!start) start = timestamp;
          var progress = Math.min((timestamp - start) / duration, 1);
          var eased = 1 - (1 - progress) * (1 - progress);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { ioCounter.observe(el); });
  }

  /* ── 4. MOBİL MENÜ LİNKE TIKLAYINCA OTOMATİK KAPANMA ── */
  var navLinks = document.querySelectorAll('.nav-links a');
  var navToggle = document.getElementById('nav-toggle');
  if (navLinks.length > 0 && navToggle) {
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.checked = false;
      });
    });
  }
});
// MEDIA LIGHTBOX: fullscreen video + photos
(function() {
  const lightbox = document.getElementById('media-lightbox');
  if (!lightbox) return; // index'te yoksa çık

  const imgEl = lightbox.querySelector('.media-lightbox-img');
  const videoEl = lightbox.querySelector('.media-lightbox-video');
  const videoSource = videoEl.querySelector('source');
  const closeBtn = lightbox.querySelector('.media-lightbox-close');
  const backdrop = lightbox.querySelector('.media-lightbox-backdrop');

  function openImage(src, alt) {
    // video kapat
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
    // image gizle
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
      const src = video.querySelector('source')?.src || video.currentSrc;
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
