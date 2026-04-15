// ════════════════════════════════════════════════════
//  Firebase Verbinding
// ════════════════════════════════════════════════════
firebase.initializeApp({
    apiKey:            "AIzaSyAK0MeCe1YAtHMNgyYXrvKyh4zvfj5cBgo",
    authDomain:        "cakir-logistics-tracker-c4b6b.firebaseapp.com",
    databaseURL:       "https://cakir-logistics-tracker-c4b6b-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:         "cakir-logistics-tracker-c4b6b",
    storageBucket:     "cakir-logistics-tracker-c4b6b.firebasestorage.app",
    messagingSenderId: "312186012365",
    appId:             "1:312186012365:web:1aa8c57db0d2785404df84"
});

var auth = firebase.auth();
var db   = firebase.database();

// ── WERKPLAATS ────────────────────────────────────────
var DEPOT = { lat:51.0654, lng:4.0289, naam:'Werkplaats Zele' };

// ── STATE ─────────────────────────────────────────────
var currentUser     = null;
var currentUserData = null;
var myLocation      = null;
var myMarker        = null;
var myCircle        = null;
var depotMarker     = null;
var selectedId      = null;
var routeControl    = null;
var allRoutes       = [];
var routeLines      = [];
var markers         = {};
var driverData      = {};
var dbListener      = null;

var ROUTE_COLORS = ['#00d4ff','#00e676','#ffea00','#ff9800'];
var ROUTE_LABELS = [
    {label:'⚡ Snelste',     tag:'tag-fast', tagText:'Snelste'},
    {label:'🌿 Zuinigst',    tag:'tag-eco',  tagText:'Min. diesel'},
    {label:'🔀 Alternatief', tag:'tag-alt',  tagText:'Alternatief'},
    {label:'🔀 Alt. 2',      tag:'tag-alt',  tagText:'Alternatief'}
];

// ── ROUTE BUILDER STATE ───────────────────────────────
var isBuilderActive        = false;
var builderWaypoints       = [];
var builderMarkers         = [];
var builderRouteControl    = null;
var builderMapClickHandler = null;

// ── MAP ───────────────────────────────────────────────
var map = L.map('map',{center:[51.0654,4.0289],zoom:11,zoomControl:false,attributionControl:false});
L.control.attribution({prefix:'© OpenStreetMap | Cakir Logistics',position:'bottomright'}).addTo(map);

var BASE = {
    dark:  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',            {maxZoom:20}),
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {maxZoom:20}),
    sat:   L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20})
};
var TRAFFIC_OVERLAY = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    {maxZoom:20,opacity:0.7,zIndex:500}
);
var currentLayer='dark', trafficOn=false;
BASE.dark.addTo(map);

function setLayer(n){
    map.removeLayer(BASE[currentLayer]);
    BASE[n].addTo(map);
    if(trafficOn){map.removeLayer(TRAFFIC_OVERLAY);TRAFFIC_OVERLAY.addTo(map);}
    currentLayer=n;
    ['dark','light','sat'].forEach(function(k){
        document.getElementById('lb-'+k).classList.toggle('on',k===n);
    });
}
function toggleTraffic(){
    trafficOn=!trafficOn;
    if(trafficOn) TRAFFIC_OVERLAY.addTo(map); else map.removeLayer(TRAFFIC_OVERLAY);
    document.getElementById('lb-traffic').classList.toggle('on',trafficOn);
    hint(trafficOn?'🚦 Traffic aan':'🚦 Traffic uit',3000);
}

// ── HINT BAR ──────────────────────────────────────────
var hintTimer=null;
function hint(msg,ms){
    var el=document.getElementById('hint-bar');
    el.textContent=msg; el.style.opacity='1';
    clearTimeout(hintTimer);
    if(ms) hintTimer=setTimeout(function(){el.style.opacity='0';},ms);
}

// ── AUTH ──────────────────────────────────────────────
auth.onAuthStateChanged(function(user){
    var loader=document.getElementById('loading');
    if(loader){loader.style.opacity='0';setTimeout(function(){loader.remove();},500);}

    if(user){
        currentUser=user;
        db.ref('/users/'+user.uid).once('value',function(snap){
            var data=snap.val();
            if(data){
                currentUserData={
                    naam:      data.naam||user.email,
                    rol:       (data.rol||'chauffeur').toString().trim().toLowerCase(),
                    firebaseId:data.firebaseId||null
                };
            } else {
                currentUserData={naam:user.email,rol:'chauffeur',firebaseId:null};
            }
            onLoginSuccess();
        });
    } else {
        currentUser=null;
        currentUserData=null;
        document.getElementById('login-screen').classList.remove('hidden');
    }
});

function doLogin(){
    var email=document.getElementById('login-email').value.trim();
    var pw   =document.getElementById('login-pw').value;
    var btn  =document.getElementById('login-btn');
    var err  =document.getElementById('login-err');
    var spin =document.getElementById('login-spinner');
    var box  =document.getElementById('login-box');

    if(!email||!pw){
        err.textContent='⛔ Vul e-mail en wachtwoord in';
        err.classList.add('show'); return;
    }
    btn.disabled=true; spin.classList.add('show'); err.classList.remove('show');
    auth.signInWithEmailAndPassword(email,pw).catch(function(e){
        btn.disabled=false; spin.classList.remove('show');
        err.textContent='⛔ '+translateAuthError(e.code);
        err.classList.add('show');
        box.classList.remove('do-shake');
        void box.offsetWidth;
        box.classList.add('do-shake');
        document.getElementById('login-pw').value='';
    });
}

function translateAuthError(code){
    if(code==='auth/user-not-found')     return 'E-mailadres niet gevonden';
    if(code==='auth/wrong-password')     return 'Onjuist wachtwoord';
    if(code==='auth/invalid-email')      return 'Ongeldig e-mailadres';
    if(code==='auth/too-many-requests')  return 'Te veel pogingen — wacht even';
    if(code==='auth/invalid-credential') return 'Onjuiste inloggegevens';
    return 'Inloggen mislukt ('+code+')';
}

function doLogout(){
    if(dbListener){db.ref('/').off('value',dbListener);dbListener=null;}
    if(isBuilderActive) stopBuilder();
    auth.signOut();
    Object.keys(markers).forEach(function(k){map.removeLayer(markers[k]);});
    markers={};driverData={};
    document.getElementById('driver-list').innerHTML='';
    document.getElementById('route-panel').classList.remove('open');
    clearRoute();
    document.getElementById('login-email').value='';
    document.getElementById('login-pw').value='';
    document.getElementById('login-btn').disabled=false;
    document.getElementById('login-spinner').classList.remove('show');
    document.getElementById('login-err').classList.remove('show');
    document.getElementById('login-screen').classList.remove('hidden');
}

// ── NA SUCCESVOL INLOGGEN ─────────────────────────────
function onLoginSuccess(){
    document.getElementById('login-screen').classList.add('hidden');
    var rol=currentUserData.rol;
    document.getElementById('bu-name').textContent=currentUserData.naam.split(' ')[0];
    document.getElementById('bu-role').textContent=rol.toUpperCase();

    if(rol==='superadmin'||rol==='admin'){
        document.getElementById('admin-tools').style.display='flex';
        document.getElementById('btn-builder').style.display='flex';
        document.getElementById('search-wrap').style.display='block';
        document.getElementById('depot-info').style.display='none';
        if(rol==='superadmin'){
            document.getElementById('btn-users').style.display='flex';
        }
    } else {
        document.getElementById('admin-tools').style.display='none';
        document.getElementById('depot-info').style.display='block';
        document.getElementById('search-wrap').style.display='none';
        showDepotMarker();
    }
    startGeolocation();
    startFirebaseListener();
}

// ── DEPOT MARKER ──────────────────────────────────────
function showDepotMarker(){
    var depotIcon=L.divIcon({
        html:'<div style="width:22px;height:22px;background:var(--accent);border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(0,212,255,0.2),0 0 18px rgba(0,212,255,0.6);display:flex;align-items:center;justify-content:center;font-size:12px;">🏭</div>',
        iconSize:[22,22],iconAnchor:[11,11],className:''
    });
    depotMarker=L.marker([DEPOT.lat,DEPOT.lng],{icon:depotIcon,zIndexOffset:400})
        .addTo(map)
        .bindPopup('<b style="color:#00d4ff">🏭 '+DEPOT.naam+'</b><br><small>Startlocatie</small>');
    document.getElementById('depot-txt').textContent='Werkplaats: '+DEPOT.naam;
}

// ── GEOLOCATION ───────────────────────────────────────
function startGeolocation(){
    var bar=document.getElementById('loc-bar'),txt=document.getElementById('loc-txt');
    if(!navigator.geolocation){bar.className='error';txt.textContent='Geolocatie niet beschikbaar.';return;}
    bar.className='searching';txt.textContent='Locatie ophalen...';
    navigator.geolocation.getCurrentPosition(
        function(pos){
            var lat=pos.coords.latitude,lng=pos.coords.longitude,acc=Math.round(pos.coords.accuracy);
            myLocation=[lat,lng];
            var myIcon=L.divIcon({
                html:'<div style="width:18px;height:18px;background:#00d4ff;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(0,212,255,0.2),0 0 20px rgba(0,212,255,0.7);"></div>',
                iconSize:[18,18],iconAnchor:[9,9],className:''
            });
            if(myMarker) myMarker.setLatLng(myLocation);
            else myMarker=L.marker(myLocation,{icon:myIcon,zIndexOffset:500}).addTo(map)
                .bindPopup('<b style="color:#00d4ff">📍 Jouw locatie</b><br><small>±'+acc+'m</small>');
            if(myCircle) map.removeLayer(myCircle);
            myCircle=L.circle(myLocation,{radius:acc,color:'#00d4ff',fillColor:'#00d4ff',fillOpacity:0.07,weight:1}).addTo(map);
            bar.className='found';txt.textContent='Locatie gevonden (±'+acc+'m)';
            document.getElementById('btn-loc').classList.add('on');
            if(currentUserData&&currentUserData.rol==='chauffeur'){
                var bounds=L.latLngBounds([myLocation,[DEPOT.lat,DEPOT.lng]]);
                map.fitBounds(bounds,{padding:[60,60]});
            }
        },
        function(err){
            bar.className='error';
            if(err.code===1) txt.textContent='⛔ Geweigerd — klik 🔒 adresbalk → Locatie → Toestaan → herlaad';
            else txt.textContent='⚠️ GPS niet beschikbaar';
            hint('⛔ Locatie geblokkeerd — klik 🔒 adresbalk → Locatie → Toestaan',0);
        },
        {enableHighAccuracy:true,timeout:12000,maximumAge:0}
    );
}

function centerMyLoc(){
    if(myLocation){map.flyTo(myLocation,16,{duration:1.2});if(myMarker)myMarker.openPopup();}
    else startGeolocation();
}

// ── TRUCK ICON ────────────────────────────────────────
function truckIcon(status,selected){
    var isSOS=status==='SOS';
    var color=isSOS?'#ff4444':(status==='START_RIT'||status==='rijden')?'#00e676':'#ffea00';
    var sz=selected?44:34;
    var ring=isSOS?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #ff4444;animation:sos-ring 1.2s ease-out infinite;pointer-events:none;"></div>':'';
    return L.divIcon({
        html:'<div style="position:relative;display:inline-block;">'
            +ring
            +'<div style="width:'+sz+'px;height:'+sz+'px;background:'+color+';border-radius:'+(selected?'11px':'50%')+';border:2px solid white;box-shadow:0 0 '+(isSOS?'20px #ff4444':(selected?'16px':'8px')+' '+color+'99')+';display:flex;align-items:center;justify-content:center;font-size:'+(selected?19:14)+'px;position:relative;z-index:2;">🚛</div>'
            +'</div>'
            +'<div style="background:#111827;color:'+color+';border-radius:3px;padding:1px 5px;font-size:9px;font-family:monospace;font-weight:bold;text-align:center;margin-top:2px;white-space:nowrap;">'+status+'</div>',
        iconSize:[sz,sz+14],iconAnchor:[sz/2,sz/2],className:''
    });
}

function badge(s){
    var c=(s==='SOS'||s==='pauze')?'sb-red':(s==='START_RIT'||s==='rijden')?'sb-green':'sb-yellow';
    return '<span class="s-badge '+c+'">'+s+'</span>';
}

// ── FIREBASE LISTENER ─────────────────────────────────
function startFirebaseListener(){
    var rol=currentUserData.rol;
    var myFirebaseId=currentUserData.firebaseId;

    dbListener=function(snap){
        var root=snap.val()||{};
        var tracking=root.tracking||{}, meldingen=root.meldingen||{};
        var list=document.getElementById('driver-list');
        var filter=document.getElementById('search-input').value.toLowerCase();
        list.innerHTML='';
        var totaal=0,rijdend=0,sos=0;

        for(var id in tracking){
            if(id==='1'||id==='Gast_User') continue;
            var pos=tracking[id], meta=meldingen[id]||{naam:'Chauffeur',status:'STANDBY'};

            if(rol==='chauffeur'&&myFirebaseId&&id!==myFirebaseId) continue;

            driverData[id]={lat:pos.latitude,lng:pos.longitude,naam:meta.naam,status:meta.status};
            totaal++;
            if(meta.status==='START_RIT'||meta.status==='rijden') rijdend++;
            if(meta.status==='SOS') sos++;

            var isOwn=(myFirebaseId&&id===myFirebaseId);

            if(markers[id]){
                markers[id].setLatLng([pos.latitude,pos.longitude]);
                markers[id].setIcon(truckIcon(meta.status,id===selectedId));
            } else {
                markers[id]=L.marker([pos.latitude,pos.longitude],{icon:truckIcon(meta.status,false)})
                    .addTo(map).bindPopup('<b>'+meta.naam+'</b><br><small>'+meta.status+'</small>');
                markers[id].on('click',(function(i){return function(){selectDriver(i);};})(id));
            }

            if(filter&&meta.naam.toLowerCase().indexOf(filter)===-1) continue;

            var sc='s-'+meta.status.toLowerCase().replace(/\s+/g,'_');
            var card=document.createElement('div');
            card.className='driver-card '+sc+(selectedId===id?' active':'')+(isOwn?' own-card':'');
            card.id='card-'+id;

            var btnsHtml='';
            if(rol!=='chauffeur'){
                btnsHtml='<div class="card-btns">'
                    +'<button class="route-btn" onclick="event.stopPropagation();routeToDriver(\''+id+'\')">🏠 Afstand</button>'
                    +'<button class="send-route-btn" id="snd-'+id+'" onclick="event.stopPropagation();quickSendToDriver(\''+id+'\')" title="Stuur gebouwde route naar deze chauffeur">📤 Stuur</button>'
                    +'</div>';
            }

            card.innerHTML=
                '<div class="d-avatar">'+meta.naam.substring(0,2).toUpperCase()+'</div>'+
                '<div class="d-info">'+
                    '<div class="d-name">'+meta.naam+(isOwn?'<span class="own-tag">JIJ</span>':'')+'</div>'+
                    '<div class="d-meta">'+badge(meta.status)+'</div>'+
                '</div>'+
                btnsHtml;
            card.onclick=(function(i){return function(){selectDriver(i);};})(id);
            list.appendChild(card);
        }

        document.getElementById('s-total').textContent=totaal;
        document.getElementById('s-rij').textContent=rijdend;
        document.getElementById('s-sos').textContent=sos;

        refreshBuilderDriverSelect();
    };

    db.ref('/').on('value',dbListener);
}

function selectDriver(id){
    selectedId=id;
    Object.keys(markers).forEach(function(k){
        if(driverData[k]) markers[k].setIcon(truckIcon(driverData[k].status,k===id));
    });
    document.querySelectorAll('.driver-card').forEach(function(c){c.classList.remove('active');});
    var card=document.getElementById('card-'+id);
    if(card){card.classList.add('active');card.scrollIntoView({behavior:'smooth',block:'nearest'});}
    var d=driverData[id];
    if(d) map.flyTo([d.lat,d.lng],15,{duration:1.2});
}

// ── LIVE ROUTE (admin → chauffeur afstand) ────────────
function routeToDriver(id){
    selectDriver(id);
    var d=driverData[id]; if(!d) return;
    if(!myLocation){
        hint('🎯 Locatie ophalen...',0);
        navigator.geolocation.getCurrentPosition(
            function(pos){myLocation=[pos.coords.latitude,pos.coords.longitude];buildRoute(myLocation,[d.lat,d.lng],d.naam);},
            function(){hint('⛔ Locatie niet beschikbaar — klik 🔒 adresbalk → Locatie → Toestaan',0);},
            {enableHighAccuracy:true,timeout:10000,maximumAge:0}
        );
        return;
    }
    buildRoute(myLocation,[d.lat,d.lng],d.naam);
}

function buildRoute(from,to,naam){
    if(routeControl){map.removeControl(routeControl);routeControl=null;}
    routeLines.forEach(function(p){map.removeLayer(p);}); routeLines=[];allRoutes=[];
    document.getElementById('route-tabs').innerHTML='';
    document.getElementById('instr-list').innerHTML='<div style="color:var(--muted);font-size:12px;padding:4px 0;">Berekenen...</div>';
    hint('🔄 Routes berekenen naar '+naam+'...',0);

    routeControl=L.Routing.control({
        waypoints:[L.latLng(from[0],from[1]),L.latLng(to[0],to[1])],
        router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1',profile:'driving'}),
        routeWhileDragging:false,showAlternatives:true,alternatives:true,
        lineOptions:{styles:[]},
        createMarker:function(i,wp){
            return L.marker(wp.latLng,{icon:L.divIcon({
                html:'<div style="width:16px;height:16px;background:'+(i===0?'#00d4ff':'#ff4444')+';border-radius:50%;border:2px solid white;box-shadow:0 0 10px '+(i===0?'#00d4ff':'#ff4444')+';display:flex;align-items:center;justify-content:center;font-size:9px;">'+(i===0?'🏠':'🚛')+'</div>',
                iconSize:[16,16],iconAnchor:[8,8],className:''
            })});
        }
    }).addTo(map);

    routeControl.on('routesfound',function(ev){
        var routes=ev.routes;
        routes.sort(function(a,b){return a.summary.totalTime-b.summary.totalTime;});
        allRoutes=routes;
        routes.forEach(function(route,i){
            var poly=L.polyline(route.coordinates,{
                color:i===0?ROUTE_COLORS[0]:(ROUTE_COLORS[i+1]||'#888'),
                weight:i===0?6:3,opacity:i===0?0.95:0.4
            }).addTo(map);
            poly.on('click',(function(idx){return function(){activateRoute(idx);};})(i));
            routeLines.push(poly);
        });
        renderRouteTabs(routes);
        activateRoute(0);
        document.getElementById('route-panel').classList.add('open');
        if(routeLines.length>0) map.fitBounds(L.featureGroup(routeLines).getBounds().pad(0.15));
        hint('✅ '+routes.length+' route'+(routes.length>1?'s':'')+' gevonden',5000);
    });

    routeControl.on('routingerror',function(){
        hint('⚠️ Route mislukt — controleer verbinding',6000);
        document.getElementById('instr-list').innerHTML='<div style="color:var(--red);font-size:12px;">Route mislukt.</div>';
    });
}

function renderRouteTabs(routes){
    var tabs=document.getElementById('route-tabs'); tabs.innerHTML='';
    routes.forEach(function(route,i){
        var info=ROUTE_LABELS[i]||ROUTE_LABELS[2];
        var tab=document.createElement('div');
        tab.className='route-tab'+(i===0?' active':''); tab.id='tab-'+i;
        tab.innerHTML='<div class="rt-label">'+info.label+'</div><div class="rt-time">'+formatTime(route.summary.totalTime)+'</div><div class="rt-dist">'+(route.summary.totalDistance/1000).toFixed(1)+' km</div><div class="rt-tag '+info.tag+'">'+info.tagText+'</div>';
        tab.onclick=(function(idx){return function(){activateRoute(idx);};})(i);
        tabs.appendChild(tab);
    });
}

function activateRoute(idx){
    document.querySelectorAll('.route-tab').forEach(function(t,i){t.classList.toggle('active',i===idx);});
    routeLines.forEach(function(poly,i){
        if(i===idx){poly.setStyle({color:ROUTE_COLORS[0],weight:6,opacity:0.95});poly.bringToFront();}
        else poly.setStyle({color:ROUTE_COLORS[i+1]||'#888',weight:3,opacity:0.4});
    });
    var r=allRoutes[idx];
    var km=(r.summary.totalDistance/1000).toFixed(1);
    var mins=Math.round(r.summary.totalTime/60);
    var eta=new Date(Date.now()+r.summary.totalTime*1000).toTimeString().slice(0,5);
    document.getElementById('r-time').textContent=mins<60?mins+' min':Math.floor(mins/60)+'u '+(mins%60)+'m';
    document.getElementById('r-dist').textContent=km+' km';
    document.getElementById('r-eta').textContent=eta;
    renderInstructions(r.instructions||[]);
}

function renderInstructions(steps){
    var box=document.getElementById('instr-list'); box.innerHTML='';
    if(!steps.length){box.innerHTML='<div style="color:var(--muted);font-size:12px;">Geen instructies.</div>';return;}
    steps.forEach(function(step){
        var div=document.createElement('div'); div.className='instr-item';
        div.innerHTML='<div class="instr-icon">'+instrIcon(step.type)+'</div><div style="flex:1;"><div class="instr-text">'+step.text+'</div>'+(step.distance>0?'<div class="instr-dist">'+formatDist(step.distance)+'</div>':'')+'</div>';
        box.appendChild(div);
    });
}

function instrIcon(t){
    t=(t||'').toLowerCase();
    if(t==='sharp left')  return '↰'; if(t==='sharp right') return '↱';
    if(t==='left')        return '⬅️'; if(t==='right')       return '➡️';
    if(t==='slight left') return '↖️'; if(t==='slight right')return '↗️';
    if(t.indexOf('roundabout')!==-1) return '🔄';
    if(t==='u-turn')      return '↩️'; if(t.indexOf('destination')!==-1) return '🏁';
    if(t==='straight')    return '⬆️'; if(t==='depart')      return '🚀';
    return '▶️';
}
function formatDist(m){return m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m';}
function formatTime(s){var m=Math.round(s/60);return m<60?m+' min':Math.floor(m/60)+'u '+(m%60)+'m';}

function clearRoute(){
    if(routeControl){map.removeControl(routeControl);routeControl=null;}
    routeLines.forEach(function(p){map.removeLayer(p);}); routeLines=[];allRoutes=[];
    document.getElementById('route-panel').classList.remove('open');
    document.getElementById('route-tabs').innerHTML='';
    document.getElementById('instr-list').innerHTML='';
    hint('Route gewist',3000);
}
function focusDriver(){
    if(!selectedId||!driverData[selectedId]) return;
    map.flyTo([driverData[selectedId].lat,driverData[selectedId].lng],15,{duration:1.2});
}

// ════════════════════════════════════════════════════
//  🚀 ROUTE BOUWER
// ════════════════════════════════════════════════════

function toggleRouteBuilder(){
    if(isBuilderActive) stopBuilder();
    else startBuilder();
}

function startBuilder(){
    isBuilderActive=true;
    document.getElementById('route-builder-panel').style.display='block';
    document.getElementById('btn-builder').classList.add('active-builder');
    document.getElementById('btn-builder').textContent='🗺️ Stop Bouwer';
    document.getElementById('map').classList.add('builder-mode');
    clearRoute();
    refreshBuilderDriverSelect();
    hint('✏️ ROUTE BOUWER AAN — Klik op de kaart om stops toe te voegen',0);

    builderMapClickHandler=function(e){
        addBuilderStop(e.latlng.lat,e.latlng.lng);
    };
    map.on('click',builderMapClickHandler);
}

function stopBuilder(){
    isBuilderActive=false;
    document.getElementById('route-builder-panel').style.display='none';
    document.getElementById('btn-builder').classList.remove('active-builder');
    document.getElementById('btn-builder').textContent='🗺️ Route Bouwer';
    document.getElementById('map').classList.remove('builder-mode');
    if(builderMapClickHandler){ map.off('click',builderMapClickHandler); builderMapClickHandler=null; }
    clearBuilderDraw();
    hint('Route Bouwer gesloten',3000);
}

function addBuilderStop(lat,lng){
    var idx = builderWaypoints.length;

    builderWaypoints.push({
        lat: lat,
        lng: lng,
        naam: (idx===0) ? 'Depot Zele' : 'Adres ophalen...',
        pakket_nr: '',
        tijd: ''
    });

    var isFirst = (idx === 0);
    var markerIcon = L.divIcon({
        html:'<div style="width:26px;height:26px;background:'+(isFirst?'#00d4ff':'#00e676')+';border-radius:50%;border:2px solid #111;color:#000;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;font-family:monospace;box-shadow:0 2px 10px rgba(0,0,0,0.5);">'+(idx+1)+'</div>',
        iconSize:[26,26],iconAnchor:[13,13],className:''
    });
    var m = L.marker([lat,lng],{icon:markerIcon}).addTo(map);
    builderMarkers.push(m);

    renderBuilderStopList();
    drawBuilderRoute();

    if (idx !== 0) {
        fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+lat+'&lon='+lng)
            .then(function(response){return response.json();})
            .then(function(data){
                var adres = "Stop " + (idx + 1);
                if (data && data.address) {
                    var straat = data.address.road || data.address.pedestrian || "";
                    var huisnr = data.address.house_number || "";
                    var stad = data.address.village || data.address.town || data.address.city || "";
                    if (straat) {
                        adres = (straat + ' ' + huisnr + ', ' + stad).trim();
                    }
                }
                builderWaypoints[idx].naam = adres;
                renderBuilderStopList();
                var stopLabel = (idx===1?'🏁 '+adres:'📍 '+adres);
                m.bindPopup('<b>'+stopLabel+'</b><br><small>'+lat.toFixed(5)+', '+lng.toFixed(5)+'</small>');
                hint('Stop '+(idx+1)+' toegevoegd: ' + adres, 4000);
            })
            .catch(function(err){
                console.warn("Geocoding failed", err);
                builderWaypoints[idx].naam = "Stop " + (idx + 1);
                renderBuilderStopList();
            });
    } else {
        m.bindPopup('<b>🟦 Start (Depot)</b><br><small>'+lat.toFixed(5)+', '+lng.toFixed(5)+'</small>');
        hint('Startpunt geplaatst', 3000);
    }
}

function undoLastStop(){
    if(!builderWaypoints.length) return;
    builderWaypoints.pop();
    var lastMarker=builderMarkers.pop();
    if(lastMarker) map.removeLayer(lastMarker);
    renderBuilderStopList();
    drawBuilderRoute();
    hint('Laatste stop verwijderd',2000);
}

function removeStop(idx){
    builderWaypoints.splice(idx,1);
    if(builderMarkers[idx]){map.removeLayer(builderMarkers[idx]);}
    builderMarkers.splice(idx,1);
    builderMarkers.forEach(function(m,i){
        var isFirst=(i===0);
        m.setIcon(L.divIcon({
            html:'<div style="width:26px;height:26px;background:'+(isFirst?'#00d4ff':'#00e676')+';border-radius:50%;border:2px solid #111;color:#000;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;font-family:monospace;box-shadow:0 2px 10px rgba(0,0,0,0.5);">'+(i+1)+'</div>',
            iconSize:[26,26],iconAnchor:[13,13],className:''
        }));
    });
    renderBuilderStopList();
    drawBuilderRoute();
}

function updateWp(idx, field, value) {
    builderWaypoints[idx][field] = value;
}

function renderBuilderStopList(){
    var list=document.getElementById('builder-stops-list');
    var counter=document.getElementById('builder-counter');
    list.innerHTML='';
    counter.textContent=builderWaypoints.length+' stop(s) geplaatst op de kaart';

    builderWaypoints.forEach(function(wp,i){
        var div=document.createElement('div');
        div.className='b-stop-item';

        var header =
            '<div class="b-stop-header">'
            +'<div class="b-stop-info">'
            +'<div class="b-stop-num">'+(i+1)+'</div>'
            +'<div class="b-stop-coords">'+wp.lat.toFixed(4)+', '+wp.lng.toFixed(4)+'</div>'
            +'</div>'
            +'<button class="b-stop-del" onclick="removeStop('+i+')" title="Verwijder Stop">✕</button>'
            +'</div>';

        var inputs =
            '<div class="b-stop-inputs">'
            +'<input class="b-input" type="text" placeholder="Adres of Naam (bv. Kerkstraat 5)" value="'+wp.naam+'" onchange="updateWp('+i+', \'naam\', this.value)">'
            +'<div class="b-row-flex">'
            +'<input class="b-input" style="flex:1;" type="text" placeholder="Pakket Nr (optioneel)" value="'+wp.pakket_nr+'" onchange="updateWp('+i+', \'pakket_nr\', this.value)">'
            +'<input class="b-input" style="width:90px;" type="time" title="Aankomsttijd" value="'+wp.tijd+'" onchange="updateWp('+i+', \'tijd\', this.value)">'
            +'</div>'
            +'</div>';

        div.innerHTML = header + inputs;
        list.appendChild(div);
    });
}

function drawBuilderRoute(){
    if(builderRouteControl){map.removeControl(builderRouteControl);builderRouteControl=null;}
    if(builderWaypoints.length<2) return;

    var latlngs=builderWaypoints.map(function(w){return L.latLng(w.lat,w.lng);});
    builderRouteControl=L.Routing.control({
        waypoints:latlngs,
        router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1',profile:'driving'}),
        routeWhileDragging:false,
        show:false,
        addWaypoints:false,
        createMarker:function(){return null;},
        lineOptions:{styles:[{color:'#00e676',opacity:0.85,weight:5,dashArray:'8,4'}]}
    }).addTo(map);
}

function clearBuilderDraw(){
    builderWaypoints=[];
    builderMarkers.forEach(function(m){map.removeLayer(m);}); builderMarkers=[];
    if(builderRouteControl){map.removeControl(builderRouteControl);builderRouteControl=null;}
    document.getElementById('builder-stops-list').innerHTML='';
    document.getElementById('builder-counter').textContent='0 stops geplaatst';
}

function clearBuilder(){
    clearBuilderDraw();
    hint('Route gewist',2000);
}

// ── BUILDER DRIVER SELECT + CONFIRM MODAL ─────────────
var pendingRouteDataToLoad = null;

function refreshBuilderDriverSelect(){
    var sel=document.getElementById('builder-driver-select');
    var prev=sel.value;
    sel.innerHTML='<option value="">-- Kies chauffeur --</option>';
    Object.keys(driverData).forEach(function(uid){
        var opt=document.createElement('option');
        opt.value=uid; opt.textContent=driverData[uid].naam;
        sel.appendChild(opt);
    });
    if(prev&&driverData[prev]) sel.value=prev;
}

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('builder-driver-select').addEventListener('change', function(e){
        var selectedUid = e.target.value;
        if(!selectedUid) return;

        hint('Zoeken naar actieve route voor chauffeur...', 0);

        db.ref('active_routes/'+selectedUid).once('value')
            .then(function(snap){
                var routeData = snap.val();
                if(routeData && routeData.stops && routeData.stops.length > 0){
                    pendingRouteDataToLoad = routeData.stops;
                    document.getElementById('confirm-modal').classList.add('open');
                } else {
                    hint('Chauffeur heeft momenteel geen actieve route.', 3000);
                }
            })
            .catch(function(err){
                console.error("Fout bij ophalen route: ", err);
            });
    });

    document.getElementById('confirm-load-btn').addEventListener('click', function(){
        if(pendingRouteDataToLoad){
            loadDriverRouteIntoBuilder(pendingRouteDataToLoad);
        }
        closeConfirmModal();
    });
});

function closeConfirmModal(){
    document.getElementById('confirm-modal').classList.remove('open');
    pendingRouteDataToLoad = null;
}

function loadDriverRouteIntoBuilder(stopsArray){
    clearBuilderDraw();

    stopsArray.forEach(function(stop, index){
        var extractedName = stop.naam;
        var extractedTime = "";
        var timeSplit = stop.naam.split(" 🕒 ");
        if(timeSplit.length === 2){
            extractedName = timeSplit[0];
            extractedTime = timeSplit[1];
        }

        builderWaypoints.push({
            lat: stop.lat,
            lng: stop.lon,
            naam: extractedName,
            pakket_nr: stop.pakket_nr || "",
            tijd: extractedTime
        });

        var isFirst = (index === 0);
        var markerIcon = L.divIcon({
            html:'<div style="width:26px;height:26px;background:'+(isFirst?'#00d4ff':'#00e676')+';border-radius:50%;border:2px solid #111;color:#000;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;font-family:monospace;box-shadow:0 2px 10px rgba(0,0,0,0.5);">'+(index+1)+'</div>',
            iconSize:[26,26],iconAnchor:[13,13],className:''
        });

        var m = L.marker([stop.lat, stop.lon], {icon: markerIcon}).addTo(map);
        m.bindPopup('<b>'+extractedName+'</b>');
        builderMarkers.push(m);
    });

    renderBuilderStopList();
    drawBuilderRoute();
    hint('Route succesvol ingeladen!', 3000);

    if(builderMarkers.length > 0){
        var group = new L.featureGroup(builderMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// ── STUUR ROUTE NAAR CHAUFFEUR ────────────────────────
function sendBuiltRoute(){
    if(builderWaypoints.length<2){
        hint('⚠️ Voeg minstens 2 stops toe (start + einde)',4000); return;
    }
    var driverUid=document.getElementById('builder-driver-select').value;
    if(!driverUid){
        hint('⚠️ Kies eerst een chauffeur!',4000); return;
    }
    var driverNaam=(driverData[driverUid]&&driverData[driverUid].naam)||driverUid;

    var stops = builderWaypoints.map(function(wp, i){
        var finalName = wp.naam.trim() || ("Stop " + (i+1));
        if(wp.tijd){
            finalName += " 🕒 " + wp.tijd;
        }
        return {
            lat:       wp.lat,
            lon:       wp.lng,
            naam:      finalName,
            pakket_nr: wp.pakket_nr || "",
            status:    'open'
        };
    });

    var routeData={
        status:    'NEW_ROUTE',
        timestamp: Date.now(),
        verzonden_door: currentUserData.naam,
        stops:     stops
    };

    hint('🔄 Route verzenden naar '+driverNaam+'...',0);

    db.ref('active_routes/'+driverUid).set(routeData)
        .then(function(){
            hint('✅ Route verzonden naar '+driverNaam+'!',5000);
            stopBuilder();
        })
        .catch(function(err){
            hint('⛔ Verzenden mislukt: '+err.message,6000);
        });
}

function quickSendToDriver(uid){
    if(builderWaypoints.length<2){
        hint('⚠️ Open eerst de Route Bouwer en voeg stops toe!',4000); return;
    }
    var driverNaam=(driverData[uid]&&driverData[uid].naam)||uid;
    var stops=builderWaypoints.map(function(wp,i){
        return {
            lat:wp.lat, lon:wp.lng,
            naam:(i===0)?'Start':(i===builderWaypoints.length-1?'Eindbestemming':'Stop '+i),
            status:'open', pakket_nr:''
        };
    });
    db.ref('active_routes/'+uid).set({
        status:'NEW_ROUTE', timestamp:Date.now(),
        verzonden_door:currentUserData.naam, stops:stops
    }).then(function(){
        hint('✅ Route verzonden naar '+driverNaam+'!',5000);
    }).catch(function(err){
        hint('⛔ Fout: '+err.message,5000);
    });
}

// ── QR MODAL ──────────────────────────────────────────
var qrDone=false;
function openQR(){
    document.getElementById('qr-modal').classList.add('open');
    if(!qrDone){
        QRCode.toCanvas(document.getElementById('qr-canvas'),'CAKIR_AUTH_2026',
            {width:200,margin:1,color:{dark:'#000000',light:'#ffffff'},errorCorrectionLevel:'H'},
            function(err){if(err)console.warn('QR fallback:',err);}
        );
        qrDone=true;
    }
}
function closeQR(){document.getElementById('qr-modal').classList.remove('open');}

// ── USER BEHEER MODAL ─────────────────────────────────
function openUserModal(){
    document.getElementById('user-modal').classList.add('open');
    loadUsers();
}
function closeUserModal(){document.getElementById('user-modal').classList.remove('open');}

function loadUsers(){
    var list=document.getElementById('user-list');
    list.innerHTML='<div style="color:var(--muted);font-size:12px;">Laden...</div>';
    db.ref('/users').once('value',function(snap){
        var users=snap.val()||{};
        list.innerHTML='';
        var keys=Object.keys(users);
        if(!keys.length){list.innerHTML='<div style="color:var(--muted);font-size:12px;">Geen gebruikers gevonden.</div>';return;}
        keys.forEach(function(uid){
            var u=users[uid];
            var row=document.createElement('div'); row.className='user-row';
            row.innerHTML=
                '<div class="user-avatar">'+(u.naam||'?').substring(0,2).toUpperCase()+'</div>'+
                '<div class="user-info"><div class="user-name">'+(u.naam||'Onbekend')+'</div><div class="user-email">'+(u.email||uid)+'</div></div>'+
                '<span class="role-badge role-'+(u.rol||'chauffeur')+'">'+(u.rol||'chauffeur').toUpperCase()+'</span>';
            list.appendChild(row);
        });
    });
}

function addUser(){
    var naam  =document.getElementById('new-name').value.trim();
    var email =document.getElementById('new-email').value.trim();
    var pass  =document.getElementById('new-pass').value;
    var rol   =document.getElementById('new-role').value;
    var fid   =document.getElementById('new-firebase-id').value.trim();
    var msg   =document.getElementById('add-user-msg');

    if(!naam||!email||!pass){msg.style.color='var(--red)';msg.textContent='⛔ Vul naam, e-mail en wachtwoord in.';return;}
    msg.style.color='var(--muted)';msg.textContent='🔄 Aanmaken...';

    var secondaryApp=firebase.initializeApp(firebase.app().options,'secondary_'+Date.now());
    secondaryApp.auth().createUserWithEmailAndPassword(email,pass)
        .then(function(cred){
            var uid=cred.user.uid;
            var userData={naam:naam,email:email,rol:rol};
            if(fid) userData.firebaseId=fid;
            return db.ref('/users/'+uid).set(userData).then(function(){
                secondaryApp.auth().signOut();
                secondaryApp.delete();
                msg.style.color='var(--green)';
                msg.textContent='✅ '+naam+' aangemaakt als '+rol;
                document.getElementById('new-name').value='';
                document.getElementById('new-email').value='';
                document.getElementById('new-pass').value='';
                document.getElementById('new-firebase-id').value='';
                loadUsers();
            });
        }).catch(function(e){
            try{secondaryApp.delete();}catch(x){}
            msg.style.color='var(--red)';
            msg.textContent='⛔ '+translateAuthError(e.code);
        });
}

// ── ZOEK FILTER ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('search-input').addEventListener('input',function(){
        var f=this.value.toLowerCase();
        document.querySelectorAll('.driver-card').forEach(function(c){
            var n=c.querySelector('.d-name')?c.querySelector('.d-name').textContent.toLowerCase():'';
            c.style.display=n.indexOf(f)!==-1?'':'none';
        });
    });
});
