let map, marker;

window.onload = function() {
    // Haritayı başlat (Zele merkezli)
    map = L.map('map').setView([51.06, 4.03], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker([51.06, 4.03]).addTo(map);

    // Ülkeleri yükle
    fetch('api/ulkeler/liste.json')
        .then(res => {
            if (!res.ok) throw new Error("Dosya bulunamadı");
            return res.json();
        })
        .then(data => {
            const select = document.getElementById('country');
            select.innerHTML = '<option value="">Ülke Seçiniz...</option>';
            data.forEach(u => {
                addOption(select, u.UlkeID, u.UlkeAdi);
            });
        })
        .catch(err => {
            console.error("Ülke listesi yüklenemedi:", err);
        });
};

function findMyState() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude, longitude} = pos.coords;
            map.setView([latitude, longitude], 15);
            marker.setLatLng([latitude, longitude]);
            alert("Konumunuz işaretlendi. Şimdi listeden Ülke ve Şehir seçerek devam edebilirsiniz.");
        }, () => alert("Konum izni verilmedi."));
    }
}

async function loadCities() {
    const uId = document.getElementById('country').value;
    if(!uId) return;

    const select = document.getElementById('city');
    select.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    document.getElementById('district').innerHTML = '<option value="">İlçe Seçiniz...</option>';

    try {
        const res = await fetch(`api/sehirler/${uId}.json`);
        if (!res.ok) throw new Error("Şehir dosyası yok");
        const data = await res.json();
        
        if (!data || data.length === 0) {
            addOption(select, uId, "Merkez / Genel");
        } else {
            data.forEach(s => addOption(select, s.SehirID, s.SehirAdi));
        }
    } catch (e) {
        addOption(select, uId, "Genel Merkez");
    }
}

async function loadDistricts() {
    const sId = document.getElementById('city').value;
    const sName = document.getElementById('city').options[document.getElementById('city').selectedIndex].text;
    
    if(!sId || sName.includes("Seçiniz")) return;

    const select = document.getElementById('district');
    select.innerHTML = '<option value="">İlçe Seçiniz...</option>';

    try {
        const res = await fetch(`api/ilceler/${sId}.json`);
        if (!res.ok) throw new Error("İlçe dosyası yok");
        const data = await res.json();

        if (!data || data.length === 0) {
            addOption(select, sId, sName + " (Merkez)");
        } else {
            data.forEach(i => addOption(select, i.IlceID, i.IlceAdi));
            if(!data.find(d => d.IlceAdi.toUpperCase().includes("MERKEZ"))) {
                addOption(select, sId, "MERKEZ");
            }
        }
    } catch (e) {
        addOption(select, sId, sName + " (Merkez)");
    }
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
    
    const dVal = dSelect.value;
    const cVal = cSelect.value;
    
    // İlçe ID varsa al, yoksa Şehir ID al
    const finalId = (dVal && dVal !== "" && !dSelect.options[dSelect.selectedIndex].text.includes("Seçiniz")) ? dVal : cVal;
    
    const dText = dSelect.options[dSelect.selectedIndex]?.text;
    const cText = cSelect.options[cSelect.selectedIndex]?.text;
    
    const finalName = (dVal && dVal !== "" && !dText.includes("Seçiniz")) ? dText : cText;

    if(!finalId || finalName.includes("Seçiniz")) {
        alert("Lütfen bir bölge seçin abicim!");
        return;
    }
    
    // BURASI DEĞİŞTİ: Artık takvim klasöründeki index.html'e gidiyor
    window.location.href = `takvim/?id=${finalId}&name=${encodeURIComponent(finalName)}`;
}
