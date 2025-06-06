const firebaseConfig = {
  apiKey: "AIzaSyD_Uyasq_6UAtW-oQE_K1xzKjl3U9Sgnbc",
  authDomain: "tempcontrolst.firebaseapp.com",
  databaseURL:
    "https://tempcontrolst-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tempcontrolst",
  storageBucket: "tempcontrolst.appspot.com",
  messagingSenderId: "1096581937068",
  appId: "1:1096581937068:web:40cd8dd3ddbf778cb12c09",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const currentDataRef = database.ref("/currentData");
const controlsRef = database.ref("/controls");
const historyRef = database.ref("/history");

let tempChart, pressureChart;
const maxDataPoints = 60;

function updateNewTargetValue(value) {
  document.getElementById("newTargetValue").textContent = value;
}
function submitTargetValue(value) {
  controlsRef.update({ targetValue: value });
}
function autoModeButtonFunction() {
  const currentMode = document.getElementById("autoModeButtonDemo").textContent;
  controlsRef.update({ autoMode: currentMode === "ON" ? "OFF" : "ON" });
}
function heaterButtonFunction() {
  const isAutoMode =
    document.getElementById("autoModeButtonDemo").textContent === "ON";
  if (!isAutoMode) {
    const currentState =
      document.getElementById("heaterButtonDemo").textContent;
    controlsRef.update({ heaterState: currentState === "ON" ? "OFF" : "ON" });
  }
}

function initChart(chartId, label, color) {
  const ctx = document.getElementById(chartId).getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: label,
          data: [],
          borderColor: color,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: { beginAtZero: false, ticks: { color: "#e0e6f0" } },
        x: { ticks: { color: "#e0e6f0" } },
      },
      plugins: {
        legend: { labels: { color: "#e0e6f0" } },
        annotation: { annotations: { targetLine: { display: false } } },
      },
    },
  });
}

function addDataToChart(chart, label, data) {
  if (!chart) return;
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(data);
  if (chart.data.labels.length > maxDataPoints) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

currentDataRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data && typeof data.temperature !== "undefined") {
    document.getElementById(
      "temperatureValue"
    ).textContent = `${data.temperature.toFixed(2)} °C`;
    document.getElementById(
      "pressureValue"
    ).textContent = `${data.pressure.toFixed(2)} hPa`;
  }
});

controlsRef.on("value", (snapshot) => {
  const controls = snapshot.val() || {};
  const autoMode = controls.autoMode || "OFF";
  const heaterState = controls.heaterState || "OFF";
  const targetValue = parseFloat(controls.targetValue || "25");

  document.getElementById("autoModeButtonDemo").textContent = autoMode;
  document.getElementById("autoModeButton").value =
    autoMode === "ON" ? "Turn OFF" : "Turn ON";
  document.getElementById("heaterButtonDemo").textContent = heaterState;
  document.getElementById("heaterButtonDemo2").textContent = heaterState;
  document.getElementById("heaterButton").value =
    heaterState === "ON" ? "Turn OFF" : "Turn ON";
  document.getElementById("currentTargetValue").textContent = targetValue;
  document.getElementById("newTargetValue").textContent = targetValue;
  document.getElementById("mySlider").value = targetValue;

  const autoModeBlock = document.getElementById("autoMode");
  const manualModeBlock = document.getElementById("manualMode");
  const heaterState2block = document.getElementById("heaterState2");

  if (autoMode === "ON") {
    manualModeBlock.style.display = "none";
    autoModeBlock.style.display = "flex";
    heaterState2block.style.display = "flex";
    if (tempChart) {
      tempChart.options.plugins.annotation.annotations.targetLine = {
        type: "line",
        yMin: targetValue,
        yMax: targetValue,
        borderColor: "red",
        borderWidth: 2,
        display: true,
        label: { content: "Target", enabled: true, position: "start" },
      };
      tempChart.update();
    }
  } else {
    manualModeBlock.style.display = "flex";
    autoModeBlock.style.display = "none";
    heaterState2block.style.display = "none";
    if (
      tempChart &&
      tempChart.options.plugins.annotation.annotations.targetLine
    ) {
      tempChart.options.plugins.annotation.annotations.targetLine.display = false;
      tempChart.update();
    }
  }
});

window.onload = function () {
  console.log("Window loaded. Initializing charts...");
  tempChart = initChart("tempChart", "Temperature (°C)", "#1f4eff");
  pressureChart = initChart("pressureChart", "Pressure (hPa)", "#17c0eb");

  console.log("Fetching initial history...");
  historyRef.limitToLast(maxDataPoints).once("value", (snapshot) => {
    console.log("Initial history received:", snapshot.val());
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data && data.timestamp) {
        const time = new Date(data.timestamp).toLocaleTimeString();
        addDataToChart(tempChart, time, data.temperature);
        addDataToChart(pressureChart, time, data.pressure);
      }
    });

    console.log("Setting up listener for new data...");
    historyRef.limitToLast(1).on("child_added", (snapshot) => {
      const data = snapshot.val();
      console.log("New child added:", data);
      if (data && data.timestamp) {
        const lastLabel =
          tempChart.data.labels[tempChart.data.labels.length - 1];
        const newTime = new Date(data.timestamp).toLocaleTimeString();
        if (lastLabel !== newTime) {
          addDataToChart(tempChart, newTime, data.temperature);
          addDataToChart(pressureChart, newTime, data.pressure);
        }
      }
    });
  });
};
