// CONFIGURACIÓN INICIAL DEL MAPA
const map = L.map('map', {
    center: [40.0, -3.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 10,
    maxBounds: [
        [35.0, -12.0], 
        [44.5, 5.0]    
    ],
    maxBoundsViscosity: 1.0 
});

// Estilo de mapa calles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    opacity: 0.9
}).addTo(map);

const TOTALITY_NORTH = 43.6;
const TOTALITY_SOUTH = 39.5;

// --- CONFIGURACIÓN DE AFILIADO ---
const BOOKING_AID = 'TU_ID_AQUI'; // Pon aquí tu ID de afiliado cuando lo tengas

// 1. CONTADOR DE TIEMPO
const eclipseDate = new Date('August 12, 2026 20:00:00').getTime();
setInterval(() => {
    const now = new Date().getTime();
    const d = eclipseDate - now;
    if (d > 0) {
        document.getElementById('days').innerText = Math.floor(d / (1000 * 60 * 60 * 24)).toString().padStart(3, '0');
        document.getElementById('hours').innerText = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById('minutes').innerText = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        document.getElementById('seconds').innerText = Math.floor((d % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }
}, 1000);

// 2. FUNCIÓN PARA ACTUALIZAR LA INTERFAZ Y EL BOTÓN
function updateUI(lat, lng, cityName = "Punto seleccionado", comingFromMap = false) {
    // Cálculo de cobertura
    let cob = 0;
    if (lat < TOTALITY_NORTH && lat > TOTALITY_SOUTH) {
        cob = 100;
    } else {
        const dist = Math.min(Math.abs(lat - TOTALITY_NORTH), Math.abs(lat - TOTALITY_SOUTH));
        cob = Math.max(50, Math.floor(100 - (dist * 12)));
    }

    // Actualizar datos en el panel
    document.getElementById('city-name').innerText = cityName;
    document.getElementById('coords').innerText = `Lat: ${lat.toFixed(2)} | Lon: ${lng.toFixed(2)}`;
    document.getElementById('percent-text').innerText = `${cob}% Cobertura`;
    document.getElementById('eclipse-type').innerText = cob === 100 ? "TIPO: TOTAL 🌑" : "TIPO: PARCIAL 🌗";
    
    const moon = document.getElementById('moon');
    if (moon) moon.style.left = `${100 - cob}%`;
    
    // --- LÓGICA DEL BOTÓN Y MENSAJE ---
    const btnHotel = document.getElementById('btn-hotel');
    const helpText = document.querySelector('.small-text');
    
    // Generar enlace dinámico para Booking
    const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cityName)}&dest_type=latlng&latitude=${lat}&longitude=${lng}&checkin=2026-08-11&checkout=2026-08-13&aid=${BOOKING_AID}`;
    btnHotel.href = hotelUrl;

    // Cambiar mensaje si el usuario clica en el mapa
    if (comingFromMap) {
        helpText.innerHTML = "✨ <b>¿Buscas hotel en esta zona?</b> Clica en Buscar hotel";
        helpText.style.color = "#f39c12"; // Dorado para llamar la atención
    } else {
        helpText.innerText = "Reserva pronto, la ocupación será alta.";
        helpText.style.color = "#888";
    }
}

// 3. EVENTO DE CLIC EN EL MAPA
let tempMarker = null;

map.on('click', e => {
    if (tempMarker) map.removeLayer(tempMarker);
    
    // Marcador visual
    tempMarker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 6,
        fillColor: '#fff',
        color: '#f39c12',
        weight: 3,
        fillOpacity: 0.8
    }).addTo(map);
    
    // POPUP EN EL MAPA: Lo que pediste
    L.popup()
        .setLatLng([e.latlng.lat, e.latlng.lng])
        .setContent("<b>¿Buscas hotel aquí?</b><br>Usa el botón del panel")
        .openOn(map);
    
    // Actualizar UI del panel lateral
    updateUI(e.latlng.lat, e.latlng.lng, "Punto en el mapa", true);
});

// 4. BUSCADOR DE CIUDADES
document.getElementById('search-button').onclick = () => {
    const city = document.getElementById('city-input').value;
    if (!city) return;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}, Spain`)
        .then(r => r.json())
        .then(data => {
            if(data[0]) {
                const { lat, lon, display_name } = data[0];
                const l = parseFloat(lat), ln = parseFloat(lon);
                
                map.flyTo([l, ln], 10, { duration: 1.5 });
                
                if (tempMarker) map.removeLayer(tempMarker);
                tempMarker = L.marker([l, ln]).addTo(map);
                
                const shortName = display_name.split(',')[0];
                updateUI(l, ln, shortName, false); // Falso porque es búsqueda, no clic directo
            } else {
                alert("No se encontró la ubicación.");
            }
        });
};

// Enter en el buscador
document.getElementById('city-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('search-button').click();
});

// Inicialización
updateUI(42.34, -3.70, "Burgos", false);