# Smart Environment IoT Dashboard

A professional front-end dashboard for the Smart Environment & AQI Monitoring System.

## ThingSpeak setup

1. Open `script.js`.
2. Replace:
   `const CHANNEL_ID = "YOUR_CHANNEL_ID";`
   with your ThingSpeak Channel ID.
3. If the channel is public, leave:
   `const READ_API_KEY = "";`
   unchanged.
4. If the channel is private, paste the ThingSpeak Read API Key into `READ_API_KEY`.
5. Open `index.html` in a browser.

## Field mapping

- Field 1: Temperature
- Field 2: Humidity
- Field 3: Gas Sensor
- Field 4: AQI

## Demo

Run the ESP32/Wokwi simulation first so ThingSpeak receives readings.
Then open the dashboard. It refreshes every 20 seconds.

Wokwi: https://wokwi.com/projects/475347579030088705
Dashboard: https://reyan-khan1811.github.io/smart-environment-dashboard/

## Important

The displayed AQI is the project's educational indicator derived from the simulated gas-sensor analog reading. It is not a calibrated regulatory AQI measurement.
