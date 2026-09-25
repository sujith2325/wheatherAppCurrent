const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '1ae31d0140fe4fae96d160556262509';

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve static files for map frontend
app.use(express.static(__dirname));

/**
 * 1. Forward Geocoding: Search street/city/landmark
 * GET /api/map/search?q=Paris
 */
app.get('/api/map/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: req.query.limit || 10
            },
            headers: {
                'User-Agent': 'WeatherMapApp/1.0'
            }
        });

        const results = response.data.map(item => ({
            placeId: item.place_id,
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
            importance: item.importance,
            address: item.address,
            boundingBox: item.boundingbox
        }));

        res.json({
            query,
            total: results.length,
            results
        });
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Failed to fetch geocoding data', details: error.message });
    }
});

/**
 * 2. Reverse Geocoding: Coordinates -> Address
 * GET /api/map/reverse?lat=48.8566&lon=2.3522
 */
app.get('/api/map/reverse', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Both "lat" and "lon" parameters are required' });
    }

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat,
                lon,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'WeatherMapApp/1.0'
            }
        });

        res.json({
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            displayName: response.data.display_name,
            address: response.data.address
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error.message);
        res.status(500).json({ error: 'Failed to reverse geocode', details: error.message });
    }
});

/**
 * 3. Map Point Weather: Live weather at coordinates
 * GET /api/map/weather?lat=48.8566&lon=2.3522 or ?city=London
 */
app.get('/api/map/weather', async (req, res) => {
    const { lat, lon, city } = req.query;
    
    let queryParam = '';
    if (lat && lon) {
        queryParam = `${lat},${lon}`;
    } else if (city) {
        queryParam = city;
    } else {
        return res.status(400).json({ error: 'Provide either "lat" & "lon" or "city"' });
    }

    try {
        const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(queryParam)}&aqi=no`;
        const response = await axios.get(url);
        const d = response.data;

        res.json({
            location: {
                name: d.location?.name,
                region: d.location?.region,
                country: d.location?.country,
                lat: d.location?.lat,
                lon: d.location?.lon
            },
            weather: {
                main: d.current?.condition?.text,
                description: d.current?.condition?.text,
                iconUrl: d.current?.condition?.icon ? (d.current.condition.icon.startsWith('http') ? d.current.condition.icon : `https:${d.current.condition.icon}`) : ''
            },
            temperature: {
                current: Math.round(d.current?.temp_c),
                feelsLike: Math.round(d.current?.feelslike_c)
            },
            atmosphere: {
                humidity: d.current?.humidity,
                pressure: d.current?.pressure_mb,
                windSpeed: d.current?.wind_kph,
                windDegree: d.current?.wind_degree,
                windDir: d.current?.wind_dir,
                uv: d.current?.uv
            },
            timestamp: d.location?.localtime_epoch
        });
    } catch (error) {
        console.error('Weather error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch weather data',
            details: error.response?.data || error.message
        });
    }
});

/**
 * 4. Map Forecast: 5-day / hourly forecast for coordinates
 * GET /api/map/forecast?lat=48.8566&lon=2.3522 or ?city=London
 */
app.get('/api/map/forecast', async (req, res) => {
    const { lat, lon, city, days = 3 } = req.query;

    let queryParam = '';
    if (lat && lon) {
        queryParam = `${lat},${lon}`;
    } else if (city) {
        queryParam = city;
    } else {
        return res.status(400).json({ error: 'Provide either "lat" & "lon" or "city"' });
    }

    try {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(queryParam)}&days=${days}&aqi=no&alerts=no`;
        const response = await axios.get(url);
        const d = response.data;

        const forecastDays = (d.forecast?.forecastday || []).map(fDay => ({
            date: fDay.date,
            maxTemp: Math.round(fDay.day?.maxtemp_c),
            minTemp: Math.round(fDay.day?.mintemp_c),
            condition: fDay.day?.condition?.text,
            iconUrl: fDay.day?.condition?.icon ? (fDay.day.condition.icon.startsWith('http') ? fDay.day.condition.icon : `https:${fDay.day.condition.icon}`) : '',
            hours: (fDay.hour || []).filter((_, idx) => idx % 3 === 0).map(h => ({
                time: h.time?.split(' ')[1] || h.time,
                temp: Math.round(h.temp_c),
                condition: h.condition?.text,
                iconUrl: h.condition?.icon ? (h.condition.icon.startsWith('http') ? h.condition.icon : `https:${h.condition.icon}`) : ''
            }))
        }));

        res.json({
            city: d.location?.name,
            country: d.location?.country,
            coord: { lat: d.location?.lat, lon: d.location?.lon },
            currentTemp: Math.round(d.current?.temp_c),
            forecastDays
        });
    } catch (error) {
        console.error('Forecast error:', error.message);
        res.status(500).json({ error: 'Failed to fetch forecast', details: error.message });
    }
});

/**
 * 5. Weather Tile Layer URL provider
 * GET /api/map/layers
 */
app.get('/api/map/layers', (req, res) => {
    res.json({
        availableLayers: [
            {
                id: 'clouds',
                name: 'Cloud Cover',
                urlTemplate: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
            },
            {
                id: 'precipitation',
                name: 'Precipitation / Rain',
                urlTemplate: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
            },
            {
                id: 'temp',
                name: 'Temperature Heatmap',
                urlTemplate: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
            },
            {
                id: 'wind',
                name: 'Wind Speed',
                urlTemplate: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
            },
            {
                id: 'pressure',
                name: 'Atmospheric Pressure',
                urlTemplate: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
            }
        ]
    });
});

/**
 * 6. Navigation / Routing API: Supports Multiple Alternative Routes
 * GET /api/map/route?srcLat=...&srcLon=...&destLat=...&destLon=...
 */
app.get('/api/map/route', async (req, res) => {
    const { srcLat, srcLon, destLat, destLon, mode = 'driving' } = req.query;
    if (!srcLat || !srcLon || !destLat || !destLon) {
        return res.status(400).json({ error: 'Required: srcLat, srcLon, destLat, destLon' });
    }

    try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/${mode}/${srcLon},${srcLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
        const response = await axios.get(osrmUrl, {
            headers: { 'User-Agent': 'WeatherMapApp/1.0' },
            timeout: 9000
        });

        if (response.data.routes && response.data.routes.length > 0) {
            const routes = response.data.routes.map((route, index) => {
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationMin = Math.round(route.duration / 60);

                const steps = (route.legs[0]?.steps || []).map(st => ({
                    instruction: (st.maneuver?.type || 'head') + (st.maneuver?.modifier ? ' ' + st.maneuver.modifier : '') + (st.name ? ' onto ' + st.name : ''),
                    distance: st.distance > 1000 ? `${(st.distance/1000).toFixed(1)} km` : `${Math.round(st.distance)} m`,
                    duration: `${Math.round(st.duration)} sec`
                }));

                // Extract prominent road names for summary
                const roadNames = Array.from(new Set(steps.map(s => s.instruction.split('onto ')[1]).filter(Boolean))).slice(0, 2).join(', ');
                const label = index === 0 ? 'Fastest Route' : `Alternative ${index}`;

                return {
                    id: index,
                    label,
                    summary: roadNames ? `via ${roadNames}` : `Route option ${index + 1}`,
                    distanceKm: parseFloat(distanceKm),
                    durationMin,
                    durationFormatted: durationMin > 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin} mins`,
                    geometry: route.geometry,
                    steps: steps.slice(0, 20)
                };
            });

            return res.json({
                success: true,
                totalRoutes: routes.length,
                routes,
                source: { lat: parseFloat(srcLat), lon: parseFloat(srcLon) },
                destination: { lat: parseFloat(destLat), lon: parseFloat(destLon) }
            });
        }
    } catch (error) {
        console.warn('OSRM routing error, falling back to geodesic line:', error.message);
    }

    // Offline / Fallback straight-line calculation
    const sLat = parseFloat(srcLat), sLon = parseFloat(srcLon);
    const dLat = parseFloat(destLat), dLon = parseFloat(destLon);
    
    const R = 6371;
    const dLatRad = (dLat - sLat) * Math.PI / 180;
    const dLonRad = (dLon - sLon) * Math.PI / 180;
    const a = Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
              Math.cos(sLat * Math.PI / 180) * Math.cos(dLat * Math.PI / 180) *
              Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = (R * c).toFixed(1);
    const estTimeMin = Math.round(dist * 1.2);

    res.json({
        success: true,
        isFallback: true,
        totalRoutes: 1,
        routes: [{
            id: 0,
            label: 'Direct Route',
            summary: 'Geodesic Navigation Path',
            distanceKm: parseFloat(dist),
            durationMin: estTimeMin,
            durationFormatted: estTimeMin > 60 ? `${Math.floor(estTimeMin / 60)}h ${estTimeMin % 60}m` : `${estTimeMin} mins`,
            geometry: {
                type: 'LineString',
                coordinates: [[sLon, sLat], [dLon, dLat]]
            },
            steps: [{ instruction: 'Head directly towards destination', distance: `${dist} km`, duration: `${estTimeMin} mins` }]
        }],
        source: { lat: sLat, lon: sLon },
        destination: { lat: dLat, lon: dLon }
    });
});

/**
 * 7. Re-routing Engine: Calculate path to return to chosen route
 * GET /api/map/reroute?currLat=...&currLon=...&targetLat=...&targetLon=...
 */
app.get('/api/map/reroute', async (req, res) => {
    const { currLat, currLon, targetLat, targetLon } = req.query;
    if (!currLat || !currLon || !targetLat || !targetLon) {
        return res.status(400).json({ error: 'Required: currLat, currLon, targetLat, targetLon' });
    }

    try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${currLon},${currLat};${targetLon},${targetLat}?overview=full&geometries=geojson&steps=true`;
        const response = await axios.get(osrmUrl, { timeout: 6000 });
        if (response.data.routes && response.data.routes.length > 0) {
            const r = response.data.routes[0];
            const distKm = (r.distance / 1000).toFixed(1);
            const timeMin = Math.round(r.duration / 60);

            const steps = (r.legs[0]?.steps || []).map(st => ({
                instruction: (st.maneuver?.type || 'head') + (st.maneuver?.modifier ? ' ' + st.maneuver.modifier : '') + (st.name ? ' onto ' + st.name : ''),
                distance: st.distance > 1000 ? `${(st.distance/1000).toFixed(1)} km` : `${Math.round(st.distance)} m`
            }));

            return res.json({
                success: true,
                distanceKm: parseFloat(distKm),
                durationFormatted: timeMin > 0 ? `${timeMin} mins` : `${Math.round(r.duration)} sec`,
                geometry: r.geometry,
                steps: steps.slice(0, 10),
                rejoinPoint: { lat: parseFloat(targetLat), lon: parseFloat(targetLon) }
            });
        }
    } catch(err) {}

    // Fallback
    res.json({
        success: true,
        isFallback: true,
        distanceKm: 0.5,
        durationFormatted: '2 mins',
        geometry: {
            type: 'LineString',
            coordinates: [[parseFloat(currLon), parseFloat(currLat)], [parseFloat(targetLon), parseFloat(targetLat)]]
        },
        steps: [{ instruction: 'Turn around / head towards original route line', distance: '500 m' }],
        rejoinPoint: { lat: parseFloat(targetLat), lon: parseFloat(targetLon) }
    });
});

/**
 * 7. API Documentation / Status
 */
app.get('/api', (req, res) => {
    res.json({
        name: 'World Map & Weather REST API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            'GET /api/map/search?q={query}': 'Search streets, landmarks, and cities',
            'GET /api/map/reverse?lat={lat}&lon={lon}': 'Reverse geocode coordinates to street address',
            'GET /api/map/route?srcLat={lat}&srcLon={lon}&destLat={lat}&destLon={lon}': 'Calculate route from source to destination with turn-by-turn directions',
            'GET /api/map/weather?lat={lat}&lon={lon}': 'Live weather for map coordinates',
            'GET /api/map/forecast?lat={lat}&lon={lon}': '5-day / 3-hour weather forecast',
            'GET /api/map/layers': 'Get tile overlay URLs for clouds, rain, temp, and wind',
            'GET /world_street_map.html': 'Interactive World Street Map frontend application'
        }
    });
});

// Default root routes to the world street map
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'world_street_map.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Map & Weather API Server is running on port ${PORT}`);
    console.log(` API Docs: http://localhost:${PORT}/api`);
    console.log(` World Map UI: http://localhost:${PORT}/`);
    console.log(`===================================================`);
});
