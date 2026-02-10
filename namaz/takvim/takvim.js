document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const name = params.get('name');

    if(name) document.getElementById('city-title').innerText = decodeURIComponent(name);

    if(id) {
        fetch(`../api/vakitler/${id}.json`)
            .then(res => {
                if(!res.ok) throw new Error("Dosya bulunamadı");
                return res.json();
            })
            .then(data => {
                const todayStr = new Date().toLocaleDateString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric'});
                let html = '';

                data.forEach(v => {
                    const isToday = v.MiladiTarihKisa === todayStr;
                    
                    // Eğer bugünse üstteki kartı doldur
                    if(isToday) {
                        document.getElementById('today-info').style.display = 'block';
                        document.getElementById('miladi-today').innerText = v.MiladiTarihUzun;
                        document.getElementById('hicri-today').innerText = v.HicriTarihUzun;
                    }

                    const rowClass = isToday ? 'class="today-row"' : '';
                    html += `<tr ${rowClass}>
                        <td>${v.MiladiTarihKisa.substring(0,5)}<br><small>${v.MiladiTarihUzun.split(' ')[2]}</small></td>
                        <td>${v.Imsak}</td>
                        <td>${v.Ogle}</td>
                        <td>${v.Ikindi}</td>
                        <td>${v.Aksam}</td>
                        <td>${v.Yatsi}</td>
                    </tr>`;
                });
                document.getElementById('calendar-body').innerHTML = html;
            })
            .catch(err => {
                document.getElementById('city-title').innerText = "Hata!";
                document.getElementById('country-subtitle').innerText = "Vakit dosyası eksik.";
            });
    }
});
