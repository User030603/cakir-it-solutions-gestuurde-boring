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
