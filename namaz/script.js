let map, marker;

window.onload = function() {
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
        });
};

function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            // Burada kullanıcıya sadece bir bilgi veriyoruz, seçimi manuel yapması en garantisi
            alert("Konumunuz bulundu! Lütfen listeden size en yakın şehri seçin.");
        }, () => alert("Konum izni verilmedi."));
    }
}

async function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;
    const res = await fetch(`api/sehirler/${uId}.json`);
    const data = await res.json();
    const select = document.getElementById('city');
    select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    
    // EĞER ŞEHİR LİSTESİ BOŞSA (Bazı küçük ülkeler için)
    if (data.length === 0) {
        let opt = document.createElement('option');
        opt.value = uId;
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
}

async function loadDistricts() {
    const sId = document.getElementById('city').value;
    if(!sId) return;
    const res = await fetch(`api/ilceler/${sId}.json`);
    const data = await res.json();
    const select = document.getElementById('district');
    select.innerHTML = '<option value="">İlçe Seçiniz...</option>';

    // EĞER İLÇE LİSTESİ BOŞSA (Belçika vb. için hayat kurtaran kısım)
    if (data.length === 0) {
        let opt = document.createElement('option');
        opt.value = sId;
        opt.innerText = "Merkez / Tüm Bölgeler";
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
    const dSelect = document.getElementById('district');
    const cSelect = document.getElementById('city');
    
    const finalId = dSelect.value || cSelect.value;
    // İsmi de çekelim ki takvimde gösterelim
    const finalName = dSelect.options[dSelect.selectedIndex]?.text || cSelect.options[cSelect.selectedIndex]?.text;

    if(!finalId || finalName.includes("Seçiniz")) {
        alert("Lütfen bir bölge seçin abicim!");
        return;
    }
    // URL'ye hem ID hem de ISIM ekliyoruz
    window.location.href = `takvim.html?id=${finalId}&name=${encodeURIComponent(finalName)}`;
}
