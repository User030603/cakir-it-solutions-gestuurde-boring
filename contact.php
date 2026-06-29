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

    // İsteğe bağlı: action & method set (Network’te gözüksün diye)
    form.setAttribute('action', endpoint);
    form.setAttribute('method', 'post');

    form.addEventListener('submit', async function(e) {
      e.preventDefault(); // Formspree sayfasına gitmeyi engeller

      const formData = new FormData(form);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          form.reset();
          // Burada herhangi bir kendi mesajını göstermek istemiyorsan
          // hiçbir şey yapma; sayfa aynı kalır.
        }
      } catch (err) {
        console.error('Contact form error', err);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initContactForm);
})();
