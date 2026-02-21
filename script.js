// WeatherService Class
class WeatherService {
    constructor() {
        this.apiKey = sessionStorage.getItem('weatherApiKey');
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    setApiKey(key) {
        this.apiKey = key;
        sessionStorage.setItem('weatherApiKey', key);
    }

    getApiKey() {
        return this.apiKey;
    }

    async getCurrentWeather(city) {
        if (!this.apiKey) throw new Error('API Key is missing');
        const response = await fetch(`${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`);
        if (!response.ok) {
            if (response.status === 401) throw new Error('Invalid API Key. Please refresh and enter a valid key.');
            if (response.status === 404) throw new Error('City not found');
            throw new Error('Failed to fetch weather data');
        }
        return await response.json();
    }

    async getForecast(city) {
        if (!this.apiKey) throw new Error('API Key is missing');
        const response = await fetch(`${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        return await response.json();
    }

    async getCurrentWeatherByCoords(lat, lon) {
        if (!this.apiKey) throw new Error('API Key is missing');
        const response = await fetch(`${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        return await response.json();
    }

    async getForecastByCoords(lat, lon) {
        if (!this.apiKey) throw new Error('API Key is missing');
        const response = await fetch(`${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`);
        if (!response.ok) throw new Error('Failed to fetch forecast data');
        return await response.json();
    }
}

// UIController Class
class UIController {
    constructor() {
        this.unit = 'metric'; // 'metric' (C) or 'imperial' (F)
        this.modal = new bootstrap.Modal(document.getElementById('apiKeyModal'));

        // DOM Elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('currentLocationBtn');
        this.unitToggle = document.getElementById('unitToggle');
        this.alertContainer = document.getElementById('alertContainer');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.weatherDisplay = document.getElementById('weatherDisplay');

        // Current Weather Elements
        this.cityName = document.getElementById('cityName');
        this.currentDate = document.getElementById('currentDate');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.temperature = document.getElementById('temperature');
        this.tempUnit = document.getElementById('tempUnit');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.windUnit = document.getElementById('windUnit');

        // Forecast Grid
        this.forecastGrid = document.getElementById('forecastGrid');

        // Background mapping
        this.bgClasses = ['bg-clear', 'bg-clouds', 'bg-rain', 'bg-drizzle', 'bg-thunderstorm', 'bg-snow', 'bg-mist', 'bg-fog', 'bg-haze', 'bg-default'];
    }

    showModal() {
        this.modal.show();
    }

    hideModal() {
        this.modal.hide();
    }

    showLoading() {
        this.loadingSpinner.classList.remove('d-none');
        this.weatherDisplay.classList.add('d-none');
        this.alertContainer.innerHTML = '';
    }

    hideLoading() {
        this.loadingSpinner.classList.add('d-none');
        this.weatherDisplay.classList.remove('d-none');
    }

    showError(message) {
        this.loadingSpinner.classList.add('d-none');
        this.alertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    clearError() {
        this.alertContainer.innerHTML = '';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    convertTemp(tempC) {
        if (this.unit === 'imperial') {
            return Math.round((tempC * 9/5) + 32);
        }
        return Math.round(tempC);
    }

    displayCurrentWeather(data) {
        this.cityName.textContent = `${data.name}, ${data.sys.country}`;
        this.currentDate.textContent = this.formatDate(data.dt);
        this.temperature.textContent = this.convertTemp(data.main.temp);
        this.tempUnit.textContent = this.unit === 'imperial' ? '°F' : '°C';
        this.weatherDescription.textContent = data.weather[0].description;
        this.humidity.textContent = data.main.humidity;

        let speed = data.wind.speed;
        let unit = 'm/s';
        if (this.unit === 'imperial') {
            speed = (speed * 2.23694).toFixed(1);
            unit = 'mph';
        }
        this.windSpeed.textContent = speed;
        this.windUnit.textContent = unit;

        const iconCode = data.weather[0].icon;
        this.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        this.updateBackground(data.weather[0].main);
    }

    displayForecast(data) {
        this.forecastGrid.innerHTML = '';

        // Filter for one forecast per day (e.g., closest to 12:00 PM)
        const dailyData = [];
        const seenDates = new Set();

        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!seenDates.has(date) && item.dt_txt.includes("12:00:00")) {
                seenDates.add(date);
                dailyData.push(item);
            }
        });

        // Fallback if we don't pick up enough days via 12:00 PM rule
        if (dailyData.length < 5) {
             seenDates.clear();
             dailyData.length = 0;
             data.list.forEach(item => {
                const date = new Date(item.dt * 1000).toDateString();
                if (!seenDates.has(date)) {
                    seenDates.add(date);
                    dailyData.push(item);
                }
             });
        }

        dailyData.slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = this.convertTemp(day.main.temp);
            const iconCode = day.weather[0].icon;

            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="card h-100 text-center py-3">
                    <div class="card-body">
                        <h5 class="card-title">${dayName}</h5>
                        <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="Icon">
                        <p class="card-text fw-bold">${temp}${this.unit === 'imperial' ? '°F' : '°C'}</p>
                        <p class="card-text small">${day.weather[0].main}</p>
                    </div>
                </div>
            `;
            this.forecastGrid.appendChild(col);
        });
    }

    updateBackground(weatherMain) {
        // Clear existing bg classes
        document.body.classList.remove(...this.bgClasses);

        let bgClass = 'bg-default';
        const condition = weatherMain.toLowerCase();

        if (condition.includes('clear')) bgClass = 'bg-clear';
        else if (condition.includes('cloud')) bgClass = 'bg-clouds';
        else if (condition.includes('rain')) bgClass = 'bg-rain';
        else if (condition.includes('drizzle')) bgClass = 'bg-drizzle';
        else if (condition.includes('thunderstorm')) bgClass = 'bg-thunderstorm';
        else if (condition.includes('snow')) bgClass = 'bg-snow';
        else if (['mist', 'fog', 'haze'].some(c => condition.includes(c))) bgClass = 'bg-mist';

        document.body.classList.add(bgClass);
    }

    setUnit(isFahrenheit) {
        this.unit = isFahrenheit ? 'imperial' : 'metric';
    }
}

// Main App Logic
document.addEventListener('DOMContentLoaded', () => {
    const weatherService = new WeatherService();
    const ui = new UIController();

    let currentWeatherData = null;
    let forecastData = null;

    // Check API Key
    if (!weatherService.getApiKey()) {
        ui.showModal();
    }

    // Save API Key
    document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
        const key = document.getElementById('apiKeyInput').value.trim();
        if (key) {
            weatherService.setApiKey(key);
            ui.hideModal();
        } else {
            alert('Please enter a valid API Key');
        }
    });

    // Search Weather
    ui.searchBtn.addEventListener('click', () => {
        const city = ui.cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });

    ui.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = ui.cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });

    // Use Current Location
    ui.locationBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            ui.showLoading();
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    ui.showError('Unable to retrieve your location. Please check browser permissions.');
                }
            );
        } else {
            ui.showError('Geolocation is not supported by your browser.');
        }
    });

    // Unit Toggle
    ui.unitToggle.addEventListener('change', () => {
        const isFahrenheit = ui.unitToggle.checked;
        ui.setUnit(isFahrenheit);

        if (currentWeatherData && forecastData) {
            ui.displayCurrentWeather(currentWeatherData);
            ui.displayForecast(forecastData);
        }
    });

    async function fetchWeather(city) {
        ui.showLoading();
        ui.clearError();
        try {
            const [weather, forecast] = await Promise.all([
                weatherService.getCurrentWeather(city),
                weatherService.getForecast(city)
            ]);
            currentWeatherData = weather;
            forecastData = forecast;
            ui.displayCurrentWeather(weather);
            ui.displayForecast(forecast);
            ui.hideLoading();
        } catch (error) {
            ui.showError(error.message);
        }
    }

    async function fetchWeatherByCoords(lat, lon) {
        ui.showLoading();
        ui.clearError();
        try {
            const [weather, forecast] = await Promise.all([
                weatherService.getCurrentWeatherByCoords(lat, lon),
                weatherService.getForecastByCoords(lat, lon)
            ]);
            currentWeatherData = weather;
            forecastData = forecast;
            ui.displayCurrentWeather(weather);
            ui.displayForecast(forecast);
            ui.hideLoading();
        } catch (error) {
            ui.showError(error.message);
        }
    }
});
