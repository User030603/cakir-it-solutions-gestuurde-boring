let map, marker;

window.onload = function() {
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    fetch('api/ulkeler/liste.json')
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('country');
            data.forEach(u => addOption(select, u.UlkeID, u.UlkeAdi));
        })
        .catch(err => console.error("API Hatası:", err));
};

function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
        }, () => alert("Konum izni verilmedi."));
    }
}

async function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;
    const select = document.getElementById('city');
    select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    try {
        const res = await fetch(`api/sehirler/${uId}.json`);
        const data = await res.json();
        data.forEach(s => addOption(select, s.SehirID, s.SehirAdi));
    } catch (e) { addOption(select, uId, "Merkez / Genel"); }
}

async function loadDistricts() {
    const sId = document.getElementById('city').value;
    if(!sId) return;
    const select = document.getElementById('district');
    select.innerHTML = '<option value="">İlçe Seçiniz...</option>';
    try {
        const res = await fetch(`api/ilceler/${sId}.json`);
        const data = await res.json();
        data.forEach(i => addOption(select, i.IlceID, i.IlceAdi));
    } catch (e) { addOption(select, sId, "Merkez"); }
}

function addOption(selectObj, id, text) {
    let opt = document.createElement('option');
    opt.value = id;
    opt.innerText = text;
    selectObj.appendChild(opt);
}

function goToCalendar() {
    const dSelect = document.getElementById('district');
    const cSelect = document.getElementById('city');
    
    const finalId = (dSelect.value && dSelect.value !== "") ? dSelect.value : cSelect.value;
    const finalName = (dSelect.value && dSelect.value !== "") ? dSelect.options[dSelect.selectedIndex].text : cSelect.options[cSelect.selectedIndex].text;

    if(!finalId || finalName.includes("Seçiniz")) {
        alert("Lütfen bölge seçin!");
        return;
    }
    
    // YENİ KLASÖR YÖNLENDİRMESİ
    window.location.href = `takvim/?id=${finalId}&name=${encodeURIComponent(finalName)}`;
}
