let map, marker;

window.onload = function() {
    // Haritayı Zele merkezli başlat
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    // Ülkeleri senin api klasöründen çek
    fetch('api/ulkeler/liste.json')
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">Ülke Seçin</option>';
            data.forEach(u => html += `<option value="${u.UlkeID}">${u.UlkeAdi}</option>`);
            document.getElementById('country').innerHTML = html;
        });
};

// Konum Bul Butonu Fonksiyonu
function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 14);
            marker.setLatLng([lat, lng]);
            alert("Konumunuz bulundu! Lütfen listeden en yakın bölgeyi seçin.");
        });
    } else {
        alert("Tarayıcınız konum özelliğini desteklemiyor.");
    }
}

function loadCities() {
    let uId = document.getElementById('country').value;
    if(!uId) return;
    fetch(`api/sehirler/${uId}.json`)
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">Şehir Seçin</option>';
            data.forEach(s => html += `<option value="${s.SehirID}">${s.SehirAdi}</option>`);
            document.getElementById('city').innerHTML = html;
            document.getElementById('district').innerHTML = '<option>Önce Şehir Seçin</option>';
        });
}

function loadDistricts() {
    let sId = document.getElementById('city').value;
    if(!sId) return;
    fetch(`api/ilceler/${sId}.json`)
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">İlçe Seçin</option>';
            data.forEach(i => html += `<option value="${i.IlceID}">${i.IlceAdi}</option>`);
            document.getElementById('district').innerHTML = html;
        });
}

// İlçe seçilince takvime yönlendir
document.getElementById('district').onchange = function() {
    let id = this.value;
    if(id) {
        window.location.href = `takvim.html?id=${id}`;
    }
};
