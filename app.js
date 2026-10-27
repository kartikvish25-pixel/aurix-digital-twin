const API_BASE_URL = "http://127.0.0.1:8000";

let latestTelemetryState = {
    timestamp: "8:35:30 AM",
    scada: { voltage_kv: 400.4, current_a: 212.7, power_mw: 126.9, power_factor: 0.86, frequency_hz: 50.02, total_load_mw: 687.3, reactive_mvar: 112.6 },
    ai_predictions: { hotspot_temp_c: 80.4, failure_prob_pct: 12.4, rul_days: 198, health_index_pct: 92, is_anomaly: false, fault_classification: "Normal Operating State", severity: "NORMAL", recommended_action: "No Immediate Maintenance Required" }
};

let isChartPaused = false;
let isManualSimulationActive = false;

function openLoginModal() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function handleLogin(event) {
    event.preventDefault();
    document.getElementById('login-overlay').classList.add('hidden');
    resizeAllCharts();
}

function switchMainView(viewName) {
    document.querySelectorAll('.main-view-section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.remove('active-sidebar-link');
        btn.classList.add('text-slate-400');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.add('active-sidebar-link');
        activeNav.classList.remove('text-slate-400');
    }
    setTimeout(resizeAllCharts, 80);
}

function resizeAllCharts() {
    if (typeof telemetryChart !== 'undefined') telemetryChart.resize();
    if (typeof harmonicFftChart !== 'undefined') harmonicFftChart.resize();
    if (typeof lstmChart !== 'undefined') lstmChart.resize();
    if (typeof rulChart !== 'undefined') rulChart.resize();
    if (typeof healthRadarChart !== 'undefined') healthRadarChart.resize();
}

// Chart Initializations
const ctxTelemetry = document.getElementById('telemetryChart').getContext('2d');
const telemetryChart = new Chart(ctxTelemetry, {
    type: 'line',
    data: {
        labels: ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00'],
        datasets: [{ label: 'Voltage (kV)', data: [355, 345, 362, 340, 358, 400.4], borderColor: '#3b82f6', tension: 0.4 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const harmonicFftChart = new Chart(document.getElementById('harmonicFftChart').getContext('2d'), {
    type: 'bar',
    data: { labels: ['1st', '3rd', '5th', '7th'], datasets: [{ label: 'Harmonic %', data: [100, 1.8, 1.4, 0.9], backgroundColor: '#3b82f6' }] },
    options: { responsive: true, maintainAspectRatio: false }
});

const lstmChart = new Chart(document.getElementById('lstmFailureChart').getContext('2d'), {
    type: 'line',
    data: { labels: ['Now', 'Day 10', 'Day 20', 'Day 30'], datasets: [{ label: 'Failure Prob %', data: [8, 12, 16, 21], borderColor: '#f59e0b', fill: true }] },
    options: { responsive: true, maintainAspectRatio: false }
});

// What-If Simulation Engine & Interactive 2D SLD / 3D Yard Trigger
async function runSimulation() {
    isManualSimulationActive = true;
    const load = parseFloat(document.getElementById('slider-load').value);
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const thd = parseFloat(document.getElementById('slider-thd').value);

    document.getElementById('lbl-load').innerText = `${load}%`;
    document.getElementById('lbl-temp').innerText = `${temp}°C`;
    document.getElementById('lbl-thd').innerText = `${thd}%`;
    document.getElementById('iso-tx1-temp-label').textContent = `${temp}°C`;

    const failure_prob = +Math.min(99.0, Math.max(2.0, (load - 50) * 0.45 + (temp - 55) * 1.15 + (thd * 2.1))).toFixed(1);
    const hotspot_temp = +(temp + (load * 0.16) + (thd * 0.85)).toFixed(1);
    const rul_days = Math.max(3, Math.floor(225 - (failure_prob * 2.15)));

    let severity = "NORMAL";
    if (temp >= 90 || failure_prob > 70 || load > 110) severity = "CRITICAL";
    else if (thd >= 7.0 || load >= 100) severity = "WARNING";

    document.getElementById('sim-out-hotspot').innerText = `${hotspot_temp}°C`;
    document.getElementById('sim-out-risk').innerText = `${failure_prob}%`;
    document.getElementById('sim-out-rul').innerText = `${rul_days} Days`;

    const tx1Box = document.getElementById('iso-tx1-box');
    const twinPill = document.getElementById('twin-alert-pill');
    const sldBreaker1 = document.getElementById('sld-breaker-1');
    const sldCb1Txt = document.getElementById('sld-cb1-txt');
    const sldStatusTag = document.getElementById('sld-status-tag');

    if (severity === "CRITICAL") {
        if (tx1Box) { tx1Box.setAttribute('stroke', '#f43f5e'); tx1Box.setAttribute('fill', '#f43f5e'); }
        if (twinPill) { twinPill.innerText = 'CRITICAL OVERLOAD!'; twinPill.className = 'text-xs bg-rose-500/25 border border-rose-500 text-rose-400 px-3 py-1 rounded-full font-bold animate-pulse'; }
        if (sldBreaker1) sldBreaker1.setAttribute('fill', '#f43f5e');
        if (sldCb1Txt) { sldCb1Txt.textContent = 'CB-1 (TRIPPED)'; sldCb1Txt.setAttribute('fill', '#fda4af'); }
        if (sldStatusTag) { sldStatusTag.innerText = 'CRITICAL: TX-1 OVERLOAD / CB-1 TRIPPED'; sldStatusTag.className = 'text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold'; }
    } else {
        if (tx1Box) { tx1Box.setAttribute('stroke', '#10b981'); tx1Box.setAttribute('fill', '#10b981'); }
        if (twinPill) { twinPill.innerText = 'STATE: NORMAL'; twinPill.className = 'text-xs bg-cyan-500/25 border border-cyan-400 text-cyan-300 px-3 py-1 rounded-full font-semibold'; }
        if (sldBreaker1) sldBreaker1.setAttribute('fill', '#10b981');
        if (sldCb1Txt) { sldCb1Txt.textContent = 'CB-1 (CLOSED)'; sldCb1Txt.setAttribute('fill', '#e2e8f0'); }
        if (sldStatusTag) { sldStatusTag.innerText = 'All Feeders Energized'; sldStatusTag.className = 'text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold'; }
    }
}

function toggleManualBreakerCB1() {
    const currentTemp = parseFloat(document.getElementById('slider-temp').value);
    if (currentTemp >= 90) {
        document.getElementById('slider-temp').value = 68;
        document.getElementById('slider-load').value = 75;
    } else {
        document.getElementById('slider-temp').value = 104;
        document.getElementById('slider-load').value = 132;
    }
    runSimulation();
}

function injectCriticalFault() {
    document.getElementById('slider-load').value = 132;
    document.getElementById('slider-temp').value = 104;
    document.getElementById('slider-thd').value = 9.5;
    runSimulation();
}

function downloadPDFReport() {
    const content = `AURIX Substation Compliance Report\nTimestamp: ${new Date().toLocaleString()}\nStatus: Operational`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURIX_Report_${Date.now()}.txt`;
    a.click();
    a.remove();
}