let map, marker;

window.onload = function() {
    // Başlangıç: Zele
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    // Ülkeleri çek
    fetch('api/ulkeler/liste.json')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('country');
            data.forEach(u => {
                let opt = document.createElement('option');
                opt.value = u.UlkeID;
                opt.innerText = u.UlkeAdi;
                select.appendChild(opt);
            });
        });
};

function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
        }, () => alert("Konum erişimi reddedildi."));
    }
}

function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;
    fetch(`api/sehirler/${uId}.json`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('city');
            select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
            data.forEach(s => {
                let opt = document.createElement('option');
                opt.value = s.SehirID;
                opt.innerText = s.SehirAdi;
                select.appendChild(opt);
            });
        });
}

function loadDistricts() {
    const sId = document.getElementById('city').value;
    if(!sId) return;
    fetch(`api/ilceler/${sId}.json`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('district');
            select.innerHTML = '<option value="">İlçe Seçiniz...</option>';
            data.forEach(i => {
                let opt = document.createElement('option');
                opt.value = i.IlceID;
                opt.innerText = i.IlceAdi;
                select.appendChild(opt);
            });
        });
}

function goToCalendar() {
    const id = document.getElementById('district').value;
    if(!id) {
        alert("Lütfen bir ilçe seçin!");
        return;
    }
    window.location.href = `takvim.html?id=${id}`;
}
