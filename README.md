# 🌤️ Weather App

A mobile weather application built with **React Native and Expo** that provides real-time weather information using the **OpenWeather API**.

The app allows users to search for locations and view current weather conditions through a simple and user-friendly interface.

## ✨ Features

- 🌍 Search weather by city/location
- 🌡️ Display current temperature
- ☁️ Show weather conditions
- 💧 Humidity information
- 💨 Wind speed information
- 🌅 Weather details in a clean mobile interface
- 🔐 API key managed securely using environment variables
- 📱 Built with React Native and Expo

## 🛠️ Technologies Used

- **React Native**
- **Expo**
- **JavaScript**
- **OpenWeather API**
- **Node.js**
- **npm**
- **Git & GitHub**

## 📂 Project Structure

```text
weaderAppCurrent/
│
├── .env.example
├── .gitignore
├── App.js
├── App.test.js
├── LICENSE
├── README.md
├── app.json
├── babel.config.js
├── package.json
├── package-lock.json
├── server.js
│
├── Screens/
│   └── ...
│
├── utils/
│   └── weatherApiKey.js
│
├── assets/
│   └── ...
│
└── world_street_map.html
```

## 🔑 API Configuration

This project uses the **OpenWeather API** to retrieve weather information.

For security, the API key should **not** be committed to GitHub.

### 1. Create a `.env` file

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

### 2. Configure `.gitignore`

Make sure `.env` is included in `.gitignore`:

```gitignore
.env
node_modules/
```

### 3. Environment Example

The repository contains `.env.example` as a template:

```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

Replace the placeholder with your own OpenWeather API key in your local `.env` file.

## 🚀 Installation

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- Expo CLI / Expo development environment
- Git

### Clone the repository

```bash
git clone https://github.com/sujith2325/wheatherAppCurrent.git
```

Move into the project directory:

```bash
cd wheatherAppCurrent
```

### Install dependencies

```bash
npm install
```

### Configure the API key

Create `.env`:

```env
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
```

### Start the application

```bash
npx expo start
```

You can then run the application using:

- 📱 Expo Go
- 🤖 Android Emulator
- 🍎 iOS Simulator
- 🌐 Web browser, depending on project configuration

## 🔒 Security

Never commit your real API key to GitHub.

The following file should remain local:

```text
.env
```

Use `.env.example` to show other developers which environment variables are required without exposing sensitive credentials.

If an API key is accidentally pushed to GitHub, revoke the exposed key and create a new one.

## 📸 Screenshots

Add screenshots of the application here:

```text
screenshots/
├── home.png
├── weather.png
└── search.png
```

Example:

![Weather App](screenshots/home.png)

## 🧪 Testing

Run the test suite using:

```bash
npm test
```

## 📦 Build

For Expo projects, you can create production builds using Expo Application Services (EAS).

Install EAS CLI if required:

```bash
npm install -g eas-cli
```

Then:

```bash
eas build
```

## 🔮 Future Improvements

- 📍 Automatic GPS-based weather detection
- 📅 5-day weather forecast
- ⭐ Favorite locations
- 🌙 Dark mode
- 🌧️ Weather alerts
- 🗺️ Interactive weather map
- 📊 Detailed weather statistics
- 🔔 Weather notifications

## 👨‍💻 Author

**Sujith Kumar**

GitHub:  
https://github.com/sujith2325

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more information.
