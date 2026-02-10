// Sayfa açılınca ülkeleri yükle
window.onload = function() {
    fetch('api/ulkeler/liste.json')
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">Seçiniz...</option>';
            data.forEach(u => html += `<option value="${u.UlkeID}">${u.UlkeAdi}</option>`);
            document.getElementById('country').innerHTML = html;
        });
    
    // Haritayı başlat
    var map = L.map('map').setView([51.06, 4.03], 13); // Zele merkezli
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
};

function loadCities() {
    let uId = document.getElementById('country').value;
    fetch(`api/sehirer/${uId}.json`)
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">Seçiniz...</option>';
            data.forEach(s => html += `<option value="${s.SehirID}">${s.SehirAdi}</option>`);
            document.getElementById('city').innerHTML = html;
        });
}

function loadDistricts() {
    let sId = document.getElementById('city').value;
    fetch(`api/ilceler/${sId}.json`)
        .then(res => res.json())
        .then(data => {
            let html = '<option value="">Seçiniz...</option>';
            data.forEach(i => html += `<option value="${i.IlceID}">${i.IlceAdi}</option>`);
            document.getElementById('district').innerHTML = html;
        });
}
