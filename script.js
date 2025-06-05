let tempChart, pressureChart;
const maxDataPoints = 61;
const temperatureValues = [],
  pressureValues = [];

function updateNewTargetValue(value) {
  document.getElementById("newTargetValue").textContent = value;
}

//Оновлення значень
function checkForValueUpdate() {
  fetch("/gettemp")
    .then((res) => res.text())
    .then((temp) => {
      document.getElementById("temperatureValue").textContent = temp + " °C";
    });
  fetch("/getpress")
    .then((res) => res.text())
    .then((press) => {
      document.getElementById("pressureValue").textContent = press + " hPa";
    });
  fetch("/gettargetvalue")
    .then((res) => res.text())
    .then((val) => {
      const targetVal = parseFloat(val.trim());
      document.getElementById("currentTargetValue").textContent = targetVal;

      fetch("/getautomode")
        .then((res) => res.text())
        .then((state) => {
          const mode = state.trim();
          document.getElementById("autoModeButtonDemo").textContent = mode;
          document.getElementById("autoModeButton").value =
            mode === "ON" ? "Turn OFF" : "Turn ON";

          const autoModeBlock = document.getElementById("autoMode");
          const manualModeBlock = document.getElementById("manualMode");
          const heaterState2block = document.getElementById("heaterState2");

          if (mode === "ON") {
            if (manualModeBlock) manualModeBlock.style.display = "none";
            if (autoModeBlock) autoModeBlock.style.display = "flex";
            if (heaterState2block) heaterState2block.style.display = "flex";

            if (
              tempChart &&
              tempChart.options.plugins.annotation.annotations.targetLine
            ) {
              tempChart.options.plugins.annotation.annotations.targetLine.yMin =
                targetVal;
              tempChart.options.plugins.annotation.annotations.targetLine.yMax =
                targetVal;
              tempChart.options.plugins.annotation.annotations.targetLine.display = true;
              tempChart.update();
            }
          } else {
            if (manualModeBlock) manualModeBlock.style.display = "flex";
            if (autoModeBlock) autoModeBlock.style.display = "none";
            if (heaterState2block) heaterState2block.style.display = "none";

            if (
              tempChart &&
              tempChart.options.plugins.annotation.annotations.targetLine
            ) {
              tempChart.options.plugins.annotation.annotations.targetLine.display = false;
              tempChart.update();
            }
          }
        });
    });

  fetch("/getheaterstate")
    .then((res) => res.text())
    .then((state) => {
      document.getElementById("heaterButtonDemo").textContent = state.trim();
      document.getElementById("heaterButtonDemo2").textContent = state.trim();
      document.getElementById("heaterButton").value =
        state.trim() === "ON" ? "Turn OFF" : "Turn ON";
    });
  fetch("/getautomode")
    .then((res) => res.text())
    .then((state) => {
      const mode = state.trim();
      document.getElementById("autoModeButtonDemo").textContent = mode;
      document.getElementById("autoModeButton").value =
        mode === "ON" ? "Turn OFF" : "Turn ON";

      // Показ/приховування блоків
      const autoModeBlock = document.getElementById("autoMode");
      const manualModeBlock = document.getElementById("manualMode");
      const heaterState2block = document.getElementById("heaterState2");

      if (mode === "ON") {
        if (manualModeBlock) manualModeBlock.style.display = "none";
        if (autoModeBlock) autoModeBlock.style.display = "flex";
        if (heaterState2block) heaterState2block.style.display = "flex";
      } else if (mode === "OFF") {
        if (manualModeBlock) manualModeBlock.style.display = "flex";
        if (autoModeBlock) autoModeBlock.style.display = "none";
        if (heaterState2block) heaterState2block.style.display = "none";
      }
    });
}

function heaterButtonFunction(value) {
  fetch(`/postHeaterButton/?value=${value === "Turn ON" ? "ON" : "OFF"}`);
}

function autoModeButtonFunction(value) {
  fetch(`/postAutoModeButton/?value=${value === "Turn ON" ? "ON" : "OFF"}`);
}

function initChart() {
  const ctx = document.getElementById("tempChart").getContext("2d");
  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from(
        { length: maxDataPoints },
        (_, i) => `-${maxDataPoints - 1 - i}`
      ),
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          borderColor: "#1b48c2",
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: {
          beginAtZero: false,
        },
      },
      plugins: {
        annotation: {
          annotations: {
            targetLine: {
              type: "line",
              yMin: null, // will be updated dynamically
              yMax: null,
              borderColor: "red",
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                enabled: true,
                content: "Target",
                position: "start",
                backgroundColor: "rgba(255, 99, 132, 0.8)",
              },
              display: false,
            },
          },
        },
      },
    },
  });
}

function initPressureChart() {
  const ctx = document.getElementById("pressureChart").getContext("2d");
  pressureChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from(
        { length: maxDataPoints },
        (_, i) => `-${maxDataPoints - 1 - i}`
      ),
      datasets: [
        {
          label: "Pressure (hPa)",
          data: [],
          borderColor: "#1b48c2",
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: { y: { beginAtZero: false } },
    },
  });
}

function addTemperatureData(temp) {
  temperatureValues.push(temp);
  if (temperatureValues.length > maxDataPoints) temperatureValues.shift();
  tempChart.data.datasets[0].data = [...temperatureValues];
  tempChart.update();
}

function addPressureData(press) {
  pressureValues.push(press);
  if (pressureValues.length > maxDataPoints) pressureValues.shift();
  pressureChart.data.datasets[0].data = [...pressureValues];
  pressureChart.update();
}

async function fetchSensorData() {
  try {
    const res = await fetch("/data");
    const json = await res.json();

    temperatureValues.length = 0;
    pressureValues.length = 0;

    temperatureValues.push(...json.temperature);
    pressureValues.push(...json.pressure);

    tempChart.data.datasets[0].data = [...temperatureValues];
    pressureChart.data.datasets[0].data = [...pressureValues];
    tempChart.update();
    pressureChart.update();
  } catch (err) {
    console.error("Sensor data fetch error:", err);
  }
}

window.onload = function () {
  checkForValueUpdate();
  initChart();
  initPressureChart();
  setInterval(fetchSensorData, 1000);
  setInterval(checkForValueUpdate, 1000);
};
