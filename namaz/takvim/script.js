// script.js içindeki goToCalendar fonksiyonunda bu satırı değiştir:
window.location.href = `takvim/index.html?id=${finalId}&name=${encodeURIComponent(finalName)}`;

// VEYA daha şık görünsün dersen (Çoğu tarayıcı index.html'i otomatik anlar):
window.location.href = `takvim/?id=${finalId}&name=${encodeURIComponent(finalName)}`;
