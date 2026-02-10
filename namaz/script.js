let map, marker;

window.onload = function() {
    // Haritayı başlat
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    // Ülkeleri yükle
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
        }).catch(err => console.error("Ülke listesi yüklenemedi:", err));
};

function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            // Android kodundaki detectCityAndCountryFromCoords mantığı
            alert("Konumunuz haritada işaretlendi. Lütfen listeden bölgenizi doğrulayıp 'Vakitleri Göster'e basın.");
        }, () => alert("Konum izni verilmedi."));
    }
}

async function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;

    try {
        const res = await fetch(`api/sehirler/${uId}.json`);
        const data = await res.json();
        const select = document.getElementById('city');
        select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
        
        if (!data || data.length === 0) {
            addOption(select, uId, "Merkez / Genel");
        } else {
            data.forEach(s => addOption(select, s.SehirID, s.SehirAdi));
        }
    } catch (e) {
        // Dosya yoksa bile Android mantığındaki fallback
        const select = document.getElementById('city');
        select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
        addOption(select, uId, "Genel Merkez");
    }
    document.getElementById('district').innerHTML = '<option value="">İlçe Seçiniz...</option>';
}

async function loadDistricts() {
    const sId = document.getElementById('city').value;
    const sName = document.getElementById('city').options[document.getElementById('city').selectedIndex].text;
    if(!sId || sName.includes("Seçiniz")) return;

    const select = document.getElementById('district');
    select.innerHTML = '<option value="">İlçe Seçiniz...</option>';

    try {
        const res = await fetch(`api/ilceler/${sId}.json`);
        const data = await res.json();

        if (!data || data.length === 0) {
            addOption(select, sId, sName + " (Merkez)");
        } else {
            data.forEach(i => addOption(select, i.IlceID, i.IlceAdi));
        }
    } catch (e) {
        // Hata durumunda (dosya yoksa) şehri ilçe gibi kullan
        addOption(select, sId, sName);
    }
}

// Yardımcı fonksiyon
function addOption(selectObj, id, text) {
    let opt = document.createElement('option');
    opt.value = id;
    opt.innerText = text;
    selectObj.appendChild(opt);
}

function goToCalendar() {
    const dSelect = document.getElementById('district');
    const cSelect = document.getElementById('city');
    
    // Android findLocationId stratejisi: En alt seviye ID'yi bul
    const finalId = dSelect.value || cSelect.value;
    const finalName = (dSelect.value && !dSelect.options[dSelect.selectedIndex].text.includes("Seçiniz")) 
                      ? dSelect.options[dSelect.selectedIndex].text 
                      : cSelect.options[cSelect.selectedIndex].text;

    if(!finalId || finalName.includes("Seçiniz")) {
        alert("Lütfen bir bölge seçin abicim!");
        return;
    }
    
    window.location.href = `takvim.html?id=${finalId}&name=${encodeURIComponent(finalName)}`;
}
