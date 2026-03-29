const map = L.map('map', {
    center: [40.0, -3.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 10,
    maxBounds: [[35.0, -12.0], [44.5, 5.0]],
    maxBoundsViscosity: 1.0
});

const primaryLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.9,
    maxZoom: 19
}).addTo(map);

const fallbackLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    opacity: 0.9,
    subdomains: 'abc',
    maxZoom: 20
});

let usingFallbackLayer = false;
primaryLayer.on('tileerror', () => {
    if (usingFallbackLayer) {
        return;
    }

    usingFallbackLayer = true;
    map.removeLayer(primaryLayer);
    fallbackLayer.addTo(map);

    const note = document.querySelector('.map-disclaimer');
    if (note) {
        note.innerText = 'El servidor principal de mapa ha limitado el acceso. Mostramos una capa alternativa visualmente similar.';
    }
});

const TOTALITY_NORTH = 43.6;
const TOTALITY_SOUTH = 39.5;
const BOOKING_AID = '4347393';
const CHECKIN_DATE = '2026-08-11';
const CHECKOUT_DATE = '2026-08-13';

function buildBookingUrl(cityName) {
    return `https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent(cityName)}&checkin=${CHECKIN_DATE}&checkout=${CHECKOUT_DATE}&group_adults=2&no_rooms=1&aid=${BOOKING_AID}`;
}

function setBookingLinks(cityName) {
    const mainButton = document.getElementById('btn-hotel');
    if (mainButton) {
        mainButton.href = buildBookingUrl(cityName);
    }

    const cityLinks = document.querySelectorAll('.booking-link');
    cityLinks.forEach((link) => {
        const city = link.dataset.city || cityName;
        link.href = buildBookingUrl(city);
    });
}

const eclipseDate = new Date('2026-08-12T20:00:00+02:00').getTime();
setInterval(() => {
    const now = Date.now();
    const diff = eclipseDate - now;

    if (diff <= 0) {
        document.getElementById('days').innerText = '000';
        document.getElementById('hours').innerText = '00';
        document.getElementById('minutes').innerText = '00';
        document.getElementById('seconds').innerText = '00';
        return;
    }

    document.getElementById('days').innerText = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(3, '0');
    document.getElementById('hours').innerText = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
    document.getElementById('minutes').innerText = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    document.getElementById('seconds').innerText = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
}, 1000);

function updateUI(lat, lng, cityName) {
    let coverage = 0;

    if (lat < TOTALITY_NORTH && lat > TOTALITY_SOUTH) {
        coverage = 100;
    } else {
        const dist = Math.min(Math.abs(lat - TOTALITY_NORTH), Math.abs(lat - TOTALITY_SOUTH));
        coverage = Math.max(50, Math.floor(100 - (dist * 12)));
    }

    document.getElementById('city-name').innerText = cityName;
    document.getElementById('coords').innerText = `Lat: ${lat.toFixed(2)} | Lon: ${lng.toFixed(2)}`;
    document.getElementById('percent-text').innerText = `${coverage}% cobertura`;
    document.getElementById('eclipse-type').innerText = coverage === 100 ? 'TOTAL' : 'PARCIAL';

    const moon = document.getElementById('moon');
    if (moon) {
        moon.style.left = `${100 - coverage}%`;
    }

    setBookingLinks(cityName);
}

let tempMarker = null;
map.on('click', (e) => {
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }

    tempMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    L.popup()
        .setLatLng(e.latlng)
        .setContent('<b>Ubicación seleccionada</b><br>Consulta los detalles en el panel inferior')
        .openOn(map);

    updateUI(e.latlng.lat, e.latlng.lng, 'Punto seleccionado');
});

async function findCity() {
    const cityInput = document.getElementById('city-input');
    const city = cityInput.value.trim();

    if (!city) {
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${city}, Spain`)}`);
        const data = await response.json();

        if (!data[0]) {
            alert('No encontramos esa ciudad. Prueba con otra búsqueda.');
            return;
        }

        const { lat, lon, display_name } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        const name = display_name.split(',')[0];

        map.flyTo([parsedLat, parsedLon], 10);
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([parsedLat, parsedLon]).addTo(map);

        updateUI(parsedLat, parsedLon, name);
    } catch (error) {
        alert('Ha ocurrido un error en la búsqueda. Inténtalo de nuevo en unos segundos.');
    }
}

document.getElementById('search-button').addEventListener('click', findCity);
document.getElementById('city-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        findCity();
    }
});

updateUI(42.34, -3.70, 'Burgos');



