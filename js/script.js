// CONFIGURACIÓN INICIAL - Centrado en España con límites
const map = L.map('map', {
    center: [40.0, -3.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 10,
    maxBounds: [
        [35.0, -12.0], // Suroeste (Canarias incluidas)
        [44.5, 5.0]    // Noreste (Pirineos)
    ],
    maxBoundsViscosity: 1.0 // No permite salir de los límites
});

// ESTILO PREMIUM OSCURO - CartoDB Dark Matter
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
    opacity: 0.9
}).addTo(map);

const TOTALITY_NORTH = 43.6;
const TOTALITY_SOUTH = 39.5;

// 1. CONTADOR
const eclipseDate = new Date('August 12, 2026 20:00:00').getTime();
setInterval(() => {
    const now = new Date().getTime();
    const d = eclipseDate - now;
    document.getElementById('days').innerText = Math.floor(d / (1000 * 60 * 60 * 24)).toString().padStart(3, '0');
    document.getElementById('hours').innerText = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    document.getElementById('minutes').innerText = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    document.getElementById('seconds').innerText = Math.floor((d % (1000 * 60)) / 1000).toString().padStart(2, '0');
}, 1000);

// 2. LÓGICA DE COBERTURA Y UI
function updateUI(lat, lng, cityName = "Punto seleccionado") {
    let cob = 0;
    if (lat < TOTALITY_NORTH && lat > TOTALITY_SOUTH) {
        cob = 100;
    } else {
        const dist = Math.min(Math.abs(lat - TOTALITY_NORTH), Math.abs(lat - TOTALITY_SOUTH));
        cob = Math.max(50, Math.floor(100 - (dist * 12)));
    }

    document.getElementById('city-name').innerText = cityName;
    document.getElementById('coords').innerText = `Lat: ${lat.toFixed(2)} | Lon: ${lng.toFixed(2)}`;
    document.getElementById('percent-text').innerText = `${cob}% Cobertura`;
    document.getElementById('eclipse-type').innerText = cob === 100 ? "TIPO: TOTAL 🌑" : "TIPO: PARCIAL 🌗";
    document.getElementById('moon').style.left = `${100 - cob}%`;
    
    document.getElementById('btn-hotel').href = `https://www.booking.com/searchresults.html?ss=España&dest_type=latlng&latitude=${lat}&longitude=${lng}&checkin=2026-08-11&checkout=2026-08-13`;
}

// Variable para guardar el marcador temporal
let tempMarker = null;

map.on('click', e => {
    // Eliminar marcador anterior si existe
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    // Crear nuevo marcador temporal
    tempMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 6,
        fillColor: '#fff',
        color: '#f39c12',
        weight: 3,
        fillOpacity: 0.8
    }).addTo(map);
    
    // Crear popup
    const popup = L.popup()
        .setLatLng([e.latlng.lat, e.latlng.lng])
        .setContent("📍 Ubicación seleccionada")
        .openOn(map);
    
    // Cuando se cierra el popup, eliminar el marcador
    popup.on('remove', () => {
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    });
    
    updateUI(e.latlng.lat, e.latlng.lng);
});

// 3. BUSCADOR
document.getElementById('search-button').onclick = () => {
    const city = document.getElementById('city-input').value;
    if (!city) return;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}, Spain`)
        .then(r => r.json())
        .then(data => {
            if(data[0]) {
                const { lat, lon, display_name } = data[0];
                const l = parseFloat(lat), ln = parseFloat(lon);
                map.flyTo([l, ln], 10, {
                    duration: 1.5
                });
                updateUI(l, ln, display_name.split(',')[0]);
                
                // Eliminar marcador anterior si existe
                if (tempMarker) {
                    map.removeLayer(tempMarker);
                }
                
                // Crear marcador temporal para la búsqueda
                tempMarker = L.marker([l, ln], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: '<div style="background:#f39c12;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 10px #f39c12;"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(map);
                
                // Crear popup
                const popup = L.popup()
                    .setLatLng([l, ln])
                    .setContent(`<b>${display_name.split(',')[0]}</b>`)
                    .openOn(map);
                
                // Cuando se cierra el popup, eliminar el marcador
                popup.on('remove', () => {
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                        tempMarker = null;
                    }
                });
            } else {
                alert("Ciudad no encontrada. Intenta con otra.");
            }
        })
        .catch(err => {
            console.error("Error en la búsqueda:", err);
            alert("Error al buscar la ciudad. Inténtalo de nuevo.");
        });
};

// Permitir búsqueda al presionar Enter
document.getElementById('city-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-button').click();
    }
});

// Tracking de clics en enlaces de afiliados (opcional)
function trackAffiliateClick(product) {
    console.log(`Clic en producto: ${product}`);
    // Aquí puedes añadir Google Analytics u otro sistema de tracking
    // gtag('event', 'click', { 'event_category': 'affiliate', 'event_label': product });
}

// Toggle para mostrar/ocultar divulgación de afiliados
function toggleDisclosure() {
    const content = document.getElementById('disclosureContent');
    content.classList.toggle('active');
}

// Inicializar con Burgos
updateUI(42.34, -3.70, "Burgos");