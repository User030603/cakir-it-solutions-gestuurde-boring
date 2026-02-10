document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const locName = params.get('name');

    if(locName) document.getElementById('location-display').innerText = "📍 " + decodeURIComponent(locName);

    if(id) {
        // Bir üst klasördeki api klasörüne gitmek için ../ ekledik
        fetch(`../api/vakitler/${id}.json`)
            .then(res => {
                if(!res.ok) throw new Error("Vakit dosyası bulunamadı");
                return res.json();
            })
            .then(data => {
                let html = '';
                const today = new Date().toLocaleDateString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric'});

                data.forEach(v => {
                    const isToday = v.MiladiTarihKisa === today ? 'class="today-row"' : '';
                    html += `<tr ${isToday}>
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
                document.getElementById('location-display').innerHTML = 
                    `<div style="color:#ef4444; font-size:14px;">⚠️ Hata: Veri bulunamadı!</div>`;
            });
    }
});
