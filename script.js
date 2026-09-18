// ============================================================
// Smart Environment IoT Dashboard
// ThingSpeak fields:
// Field 1 = Temperature
// Field 2 = Humidity
// Field 3 = Gas Sensor
// Field 4 = AQI
// ============================================================

// Put your ThingSpeak CHANNEL ID here.
// Example: const CHANNEL_ID = "1234567";
const CHANNEL_ID = "3496424";

// Public channel data does not require the Write API Key.
// If your channel is private, add a READ API KEY below.
const READ_API_KEY = "";

const RESULTS = 20;
const API_BASE = "https://api.thingspeak.com/channels";

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  $(id).textContent = value;
}

function aqiLabel(aqi) {
  if (aqi === null || Number.isNaN(aqi)) return "Awaiting data";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazard indicator";
}

function formatTime(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
}

function chartLabels(feeds) {
  return feeds.map(f => formatTime(f.created_at));
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } }
  },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 9 } } },
    y: { grid: { color: "#edf1f5" }, ticks: { font: { size: 9 } } }
  }
};

let environmentChart, gasChart, aqiChart;

function makeCharts() {
  environmentChart = new Chart($("environmentChart"), {
    type: "line",
    data: { labels: [], datasets: [
      { label: "Temperature (°C)", data: [], tension: .35, borderWidth: 2, pointRadius: 2 },
      { label: "Humidity (%)", data: [], tension: .35, borderWidth: 2, pointRadius: 2 }
    ]},
    options: chartOptions
  });

  gasChart = new Chart($("gasChart"), {
    type: "line",
    data: { labels: [], datasets: [
      { label: "Gas sensor (ADC)", data: [], tension: .35, borderWidth: 2, pointRadius: 2 }
    ]},
    options: chartOptions
  });

  aqiChart = new Chart($("aqiChart"), {
    type: "line",
    data: { labels: [], datasets: [
      { label: "AQI indicator", data: [], tension: .35, borderWidth: 2, pointRadius: 2 }
    ]},
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { ...chartOptions.scales.y, min: 0, max: 500 }
      }
    }
  });
}

function updateCharts(feeds) {
  const labels = chartLabels(feeds);

  environmentChart.data.labels = labels;
  environmentChart.data.datasets[0].data = feeds.map(f => Number(f.field1));
  environmentChart.data.datasets[1].data = feeds.map(f => Number(f.field2));
  environmentChart.update();

  gasChart.data.labels = labels;
  gasChart.data.datasets[0].data = feeds.map(f => Number(f.field3));
  gasChart.update();

  aqiChart.data.labels = labels;
  aqiChart.data.datasets[0].data = feeds.map(f => Number(f.field4));
  aqiChart.update();
}

async function loadData() {
  if (CHANNEL_ID === "YOUR_CHANNEL_ID") {
    setText("connectionText", "Add Channel ID in script.js");
    setText("lastUpdate", "Not configured");
    return;
  }

  try {
    let url = `${API_BASE}/${CHANNEL_ID}/feeds.json?results=${RESULTS}`;
    if (READ_API_KEY.trim()) url += `&api_key=${encodeURIComponent(READ_API_KEY.trim())}`;

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const feeds = (data.feeds || []).filter(f => f.field1 !== null);

    if (!feeds.length) throw new Error("No readings yet");

    const latest = feeds[feeds.length - 1];
    const temp = Number(latest.field1);
    const hum = Number(latest.field2);
    const gas = Number(latest.field3);
    const aqi = Number(latest.field4);

    setText("temperature", Number.isFinite(temp) ? temp.toFixed(1) : "--");
    setText("humidity", Number.isFinite(hum) ? hum.toFixed(1) : "--");
    setText("gas", Number.isFinite(gas) ? Math.round(gas) : "--");
    setText("aqi", Number.isFinite(aqi) ? Math.round(aqi) : "--");
    setText("lastUpdate", formatTime(latest.created_at));
    setText("connectionText", "Cloud connected");

    const badge = $("aqiStatus");
    const alert = $("alertState");
    const label = aqiLabel(aqi);
    badge.textContent = label;

    if (aqi > 150) {
      badge.style.background = "#fef2f2";
      badge.style.color = "#b91c1c";
      alert.textContent = "Alert active";
      alert.style.background = "#fef2f2";
      alert.style.color = "#b91c1c";
    } else {
      badge.style.background = "#ecfdf3";
      badge.style.color = "#15803d";
      alert.textContent = "Normal";
      alert.style.background = "#ecfdf3";
      alert.style.color = "#15803d";
    }

    updateCharts(feeds);
  } catch (error) {
    console.error(error);
    setText("connectionText", "Waiting for cloud data");
    setText("lastUpdate", "Connection issue");
  }
}

makeCharts();
loadData();

// Refresh every 20 seconds to match the ESP32 upload interval.
setInterval(loadData, 20000);
