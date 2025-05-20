console.log("Script loaded!");

const audioPlayer = document.getElementById('audioPlayer');
const loadingIndicator = document.getElementById('loadingIndicator');
const playbackInfo = document.getElementById('playbackInfo');
let stations = [];
let map; // Declare map globally

async function fetchStationsWithGeoInfo() {
    loadingIndicator.style.display = 'block';
    playbackInfo.textContent = '';
    const apiUrl = 'https://de1.api.radio-browser.info/json/stations/search?has_geo_info=true&limit=500&hidebroken=true&order=clickcount&reverse=true';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        stations = data;
        console.log("Fetched stations:", stations);

        // Initialize map and plot markers
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        stations.forEach(station => {
            if (station.geo_lat != null && station.geo_long != null) {
                const marker = L.marker([station.geo_lat, station.geo_long]);
                marker.bindPopup(station.name); // Keep popup for station name
                marker.addTo(map);

                marker.on('click', () => {
                    playbackInfo.textContent = `Connecting to ${station.name}...`;
                    if (station.urlResolved) {
                        console.log(`Attempting to play: ${station.name} - ${station.urlResolved}`);
                        audioPlayer.src = station.urlResolved;
                        playbackInfo.textContent = `Loading: ${station.name}...`; // Update before play
                        audioPlayer.play();
                    } else {
                        console.error('No stream URL found for station:', station.name);
                        playbackInfo.textContent = `No stream URL found for ${station.name}.`;
                    }
                });
            }
        });

    } catch (error) {
        console.error('Error fetching station data:', error);
        playbackInfo.textContent = 'Could not load stations. Please check your connection or try again later.';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Audio player event listeners
audioPlayer.addEventListener('error', function(e) {
    console.error('Audio playback error:', e);
    const stationName = audioPlayer.currentSrc && stations.find(s => s.urlResolved === audioPlayer.currentSrc)?.name;
    const message = stationName ? `Error playing station: ${stationName}` : 'Error playing audio.';
    playbackInfo.textContent = message;
});

audioPlayer.addEventListener('playing', function() {
    const stationName = stations.find(s => s.urlResolved === audioPlayer.currentSrc)?.name;
    if (stationName) {
        playbackInfo.textContent = `Now Playing: ${stationName}`;
    } else {
        playbackInfo.textContent = 'Playing audio.';
    }
});

// API interaction and map initialization code will go here

fetchStationsWithGeoInfo();
