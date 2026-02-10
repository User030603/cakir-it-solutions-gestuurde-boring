let map, marker;
let allCountries = [];

window.onload = function() {
    // Haritayı başlat
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    // Ülkeleri önbelleğe al ve yükle
    fetch('api/ulkeler/liste.json')
        .then(res => res.json())
        .then(data => {
            allCountries = data;
            const select = document.getElementById('country');
            data.forEach(u => {
                let opt = document.createElement('option');
                opt.value = u.UlkeID;
                opt.innerText = u.UlkeAdi;
                select.appendChild(opt);
            });
        });
};

// --- AKILLI KONUM BULMA ---
function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);

            // Ters Coğrafi Kodlama (Reverse Geocoding) - Ücretsiz Servis
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const locationData = await res.json();
                const city = locationData.address.city || locationData.address.town || locationData.address.province;
                
                alert(`Konumunuz: ${city}. En yakın vakitler hazırlanıyor...`);
                // Burada otomatik eşleşme simülasyonu yapabilirsin veya kullanıcıyı seçim yapmaya zorlamadan en yakın ID'yi tahmin edebilirsin.
                // Şimdilik manuel seçimi tetikleyelim ama hata vermesini engelleyelim.
            } catch (err) {
                console.log("Konum ismi alınamadı.");
            }
        }, () => alert("Konum erişimi kapalı."));
    }
}

// --- EKSİK VERİ KONTROLÜ (Şehir/İlçe Boşsa) ---
async function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;

    const res = await fetch(`api/sehirler/${uId}.json`);
    const data = await res.json();
    
    const select = document.getElementById('city');
    select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    
    if (data.length === 0) {
        let opt = document.createElement('option');
        opt.value = uId; // Eğer şehir yoksa ülke ID'sini kullan
        opt.innerText = "Merkez / Genel";
        select.appendChild(opt);
    } else {
        data.forEach(s => {
            let opt = document.createElement('option');
            opt.value = s.SehirID;
            opt.innerText = s.SehirAdi;
            select.appendChild(opt);
        });
    }
    document.getElementById('district').innerHTML = '<option value="">İlçe Seçiniz...</option>';
}

async function loadDistricts() {
    const sId = document.getElementById('city').value;
    if(!sId) return;

    const res = await fetch(`api/ilceler/${sId}.json`);
    const data = await res.json();
    
    const select = document.getElementById('district');
    select.innerHTML = '<option value="">İlçe Seçiniz...</option>';

    // EĞER İLÇE LİSTESİ BOŞSA: Şehir ID'sini ilçe ID'si gibi kullandır
    if (data.length === 0) {
        let opt = document.createElement('option');
        opt.value = sId; // İlçe yoksa Şehir ID'sini ver
        opt.innerText = "Tüm Bölgeler";
        select.appendChild(opt);
    } else {
        data.forEach(i => {
            let opt = document.createElement('option');
            opt.value = i.IlceID;
            opt.innerText = i.IlceAdi;
            select.appendChild(opt);
        });
    }
}

function goToCalendar() {
    const districtId = document.getElementById('district').value;
    const cityId = document.getElementById('city').value;
    
    // Hangisi doluysa onu gönder (İlçe yoksa Şehir, Şehir yoksa hata)
    const finalId = districtId || cityId;

    if(!finalId) {
        alert("Lütfen bir bölge seçin!");
        return;
    }
    window.location.href = `takvim.html?id=${finalId}`;
}
