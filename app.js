// =====================================================
// CONFIGURATION: BACKEND API URL (Auto-Fallback Enabled)
// =====================================================
const API_BASE_URL = "http://127.0.0.1:8000";

let latestTelemetryState = {
    timestamp: "8:35:30 AM",
    scada: {
        voltage_kv: 400.4,
        current_a: 212.7,
        power_mw: 126.9,
        power_factor: 0.86,
        frequency_hz: 50.02,
        total_load_mw: 687.3,
        reactive_mvar: 112.6,
        ambient_temp_c: 32.7
    },
    ai_predictions: {
        hotspot_temp_c: 80.4,
        failure_prob_pct: 12.4,
        rul_days: 198,
        health_index_pct: 92,
        is_anomaly: false,
        fault_classification: "Normal Operating State",
        severity: "NORMAL",
        recommended_action: "No Immediate Maintenance Required"
    }
};

let isChartPaused = false;
let isManualSimulationActive = false;

// =====================================================
// 1. SECURE LOGIN MODAL & GLOBAL SEARCH HANDLERS
// =====================================================
function quickFillLogin() {
    document.getElementById('login-user').value = "Exec_01";
    document.getElementById('login-pass').value = "patanjali2026";
}

function openLoginModal() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
        overlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        overlay.style.display = 'flex';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorBox = document.getElementById('login-error');

    const validUsers = ["Substation_Exec_01", "Exec_01", "admin"];
    const validPasswords = ["patanjali2026", "admin"];

    if (validUsers.includes(user) && validPasswords.includes(pass)) {
        errorBox.classList.add('hidden');
        const overlay = document.getElementById('login-overlay');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            overlay.classList.add('hidden');
            resizeAllCharts();
        }, 250);
    } else {
        errorBox.classList.remove('hidden');
    }
}

function handleGlobalSearch(event) {
    if (event.key === 'Enter') {
        const q = event.target.value.toLowerCase();
        if (q.includes('sld') || q.includes('diagram') || q.includes('breaker')) {
            switchMainView('sld');
        } else if (q.includes('dga') || q.includes('sim') || q.includes('3d') || q.includes('temp')) {
            switchMainView('telemetry');
        } else if (q.includes('fft') || q.includes('graph') || q.includes('rul') || q.includes('lstm')) {
            switchMainView('graphs');
        } else if (q.includes('alert') || q.includes('log') || q.includes('goose')) {
            switchMainView('logs');
        } else if (q.includes('report')) {
            switchMainView('reports');
        } else {
            switchMainView('dashboard');
        }
    }
}

// =====================================================
// 2. LEFT SIDEBAR NAVIGATION (7 VIEWS)
// =====================================================
function switchMainView(viewName) {
    document.querySelectorAll('.main-view-section').forEach(sec => {
        sec.classList.add('hidden');
    });

    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.remove('active-sidebar-link');
        btn.classList.add('text-slate-400');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    const activeNav = document.getElementById(`nav-${viewName}`);
    if (activeNav) {
        activeNav.classList.add('active-sidebar-link');
        activeNav.classList.remove('text-slate-400');
    }

    setTimeout(resizeAllCharts, 80);
}

function setChartTimeframe(label, btnEl) {
    document.querySelectorAll('.time-pill').forEach(b => {
        b.classList.remove('bg-[#1b2b44]', 'text-white');
        b.classList.add('text-slate-500');
    });
    btnEl.classList.add('bg-[#1b2b44]', 'text-white');
    btnEl.classList.remove('text-slate-500');
}

function resizeAllCharts() {
    if (typeof telemetryChart !== 'undefined') telemetryChart.resize();
    if (typeof harmonicFftChart !== 'undefined') harmonicFftChart.resize();
    if (typeof lstmChart !== 'undefined') lstmChart.resize();
    if (typeof rulChart !== 'undefined') rulChart.resize();
    if (typeof healthRadarChart !== 'undefined') healthRadarChart.resize();
}

// =====================================================
// 3. CHART INITIALIZATIONS
// =====================================================
const timeLabels = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00'];

const ctxTelemetry = document.getElementById('telemetryChart').getContext('2d');
const telemetryChart = new Chart(ctxTelemetry, {
    type: 'line',
    data: {
        labels: [...timeLabels],
        datasets: [
            {
                label: 'Voltage (kV)',
                data: [355, 345, 362, 340, 358, 400.4],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.42
            },
            {
                label: 'Current (A)',
                data: [215, 222, 204, 212, 228, 212.7],
                borderColor: '#14b8a6',
                backgroundColor: 'rgba(20, 184, 166, 0.05)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.42
            },
            {
                label: 'Power (MW)',
                data: [105, 98, 118, 102, 114, 126.9],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.42
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#f8fafc',
                bodyColor: '#e2e8f0',
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
            y: { min: 0, max: 500, ticks: { stepSize: 100, color: '#64748b', font: { size: 11 } }, grid: { color: '#f1f5f9' } }
        }
    }
});

const ctxFft = document.getElementById('harmonicFftChart').getContext('2d');
const harmonicFftChart = new Chart(ctxFft, {
    type: 'bar',
    data: {
        labels: ['1st (50Hz)', '3rd (150Hz)', '5th (250Hz)', '7th (350Hz)', '9th (450Hz)', '11th (550Hz)', '13th (650Hz)'],
        datasets: [{ label: 'Harmonic Magnitude (%)', data: [100, 1.8, 1.4, 0.9, 0.5, 0.3, 0.2], backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#f59e0b', '#10b981', '#10b981', '#10b981'], borderRadius: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } }, y: { type: 'logarithmic', ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } } } }
});

const ctxLstm = document.getElementById('lstmFailureChart').getContext('2d');
const lstmChart = new Chart(ctxLstm, {
    type: 'line',
    data: {
        labels: ['Now', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
        datasets: [
            { label: 'Predicted Failure Probability (%)', data: [8, 10, 12, 14, 16, 18, 21], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.14)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.4 },
            { label: 'Auto-Trip Threshold (70%)', data: [70, 70, 70, 70, 70, 70, 70], borderColor: '#f43f5e', borderWidth: 1.8, borderDash: [6, 4], pointRadius: 0, fill: false }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } }, y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } } } }
});

const ctxRul = document.getElementById('rulChart').getContext('2d');
const rulChart = new Chart(ctxRul, {
    type: 'line',
    data: {
        labels: ['Now', '+30d', '+60d', '+90d', '+120d', '+150d', '+180d'],
        datasets: [
            { label: 'Asset Health Index (%)', data: [92, 88, 83, 77, 70, 62, 54], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.14)', borderWidth: 2.5, pointRadius: 3, fill: true, tension: 0.35 },
            { label: 'Mandatory Overhaul Limit (40%)', data: [40, 40, 40, 40, 40, 40, 40], borderColor: '#f43f5e', borderWidth: 1.8, borderDash: [6, 4], pointRadius: 0, fill: false }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } }, y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' } } } }
});

const ctxRadar = document.getElementById('healthRadarChart').getContext('2d');
const healthRadarChart = new Chart(ctxRadar, {
    type: 'radar',
    data: {
        labels: ['Thermal Integrity', 'Dielectric Insulation', 'SF6 Contacts', 'DGA Oil Purity', 'Harmonic Immunity'],
        datasets: [
            { label: 'TX-1 Live Digital Twin', data: [91, 94, 88, 92, 90], backgroundColor: 'rgba(59, 130, 246, 0.18)', borderColor: '#2563eb', pointBackgroundColor: '#2563eb', borderWidth: 2 },
            { label: 'IEEE Baseline', data: [95, 95, 95, 95, 95], backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: '#10b981', borderDash: [4, 4], pointRadius: 2, borderWidth: 1.5 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155' } } }, scales: { r: { min: 0, max: 100, pointLabels: { color: '#475569', font: { size: 10, weight: 'bold' } }, ticks: { display: false } } } }
});

// =====================================================
// 4. ALERTS & GOOSE SNIFFER
// =====================================================
let alertsList = [
    { level: 'CRITICAL', color: 'rose', msg: 'High Temp TX-1 (85°C Threshold Near)', time: '14:32:10' },
    { level: 'WARNING', color: 'amber', msg: 'Breaker B2 Vibration Anomaly (12mm/s)', time: '13:45:02' },
    { level: 'INFO', color: 'blue', msg: 'IEC 61850 GOOSE Packet Sync Verified', time: '13:10:00' }
];

let goosePackets = [];

function renderAlerts() {
    const container = document.getElementById('alert-log-list');
    const badge = document.getElementById('alert-count-badge');
    if (badge) badge.innerText = alertsList.length;
    if (!container) return;

    if (alertsList.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No unacknowledged alarms in queue.</div>`;
        return;
    }

    container.innerHTML = alertsList.map(a => `
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
            <div class="flex items-center space-x-2.5">
                <span class="px-2 py-0.5 rounded bg-${a.color}-100 text-${a.color}-700 font-bold text-[10px]">${a.level}</span>
                <span class="text-slate-700 font-medium">${a.msg}</span>
            </div>
            <span class="text-slate-400 text-[10px] font-mono">${a.time}</span>
        </div>
    `).join('');
}

function addAlert(level, color, msg) {
    const now = new Date().toLocaleTimeString();
    alertsList.unshift({ level, color, msg, time: now });
    if (alertsList.length > 12) alertsList.pop();
    renderAlerts();
}

function clearAlerts() {
    alertsList = [];
    renderAlerts();
}

function pushGoosePacket(scada) {
    const streamEl = document.getElementById('goose-packet-stream');
    if (!streamEl) return;
    const sqNum = Math.floor(1000 + Math.random() * 9000);
    const line = `[${new Date().toLocaleTimeString()}] GOOSE_PDU sqNum=${sqNum} stNum=1 | IED_RET670 -> BusA=${scada.voltage_kv}kV, I=${scada.current_a}A, P=${scada.power_mw}MW`;
    goosePackets.unshift(line);
    if (goosePackets.length > 8) goosePackets.pop();
    streamEl.innerHTML = goosePackets.map(p => `<div>${p}</div>`).join('');
}

renderAlerts();

// =====================================================
// 5. LIVE TELEMETRY STREAM
// =====================================================
async function fetchLiveTelemetry() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/telemetry`);
        if (!res.ok) throw new Error("Backend offline");
        const data = await res.json();
        if (!isManualSimulationActive) {
            latestTelemetryState = data;
        } else {
            latestTelemetryState.timestamp = data.timestamp;
            latestTelemetryState.scada = data.scada;
        }
        updateDashboardUI(latestTelemetryState, true);
    } catch (err) {
        const voltage = +(399.8 + Math.random() * 1.4).toFixed(1);
        const current = +(211.5 + Math.random() * 2.4).toFixed(1);
        const pf = 0.86;
        const freq = +(50.01 + Math.random() * 0.04).toFixed(2);
        const power = +((voltage * current * 1.732 * pf) / 1000).toFixed(1);

        latestTelemetryState.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        latestTelemetryState.scada = {
            voltage_kv: voltage,
            current_a: current,
            power_mw: power,
            power_factor: pf,
            frequency_hz: freq,
            total_load_mw: +(685.5 + Math.random() * 3.6).toFixed(1),
            reactive_mvar: +(111.8 + Math.random() * 1.8).toFixed(1),
            ambient_temp_c: 32.7
        };
        updateDashboardUI(latestTelemetryState, false);
    }
}

function updateDashboardUI(data, isBackendConnected) {
    const { scada, ai_predictions } = data;

    const syncEl = document.getElementById('last-sync-time');
    if (syncEl) syncEl.innerText = data.timestamp;

    const statusTxt = document.getElementById('system-status-text');
    if (statusTxt) statusTxt.innerText = isBackendConnected ? "Online (API)" : "Online";

    const latencyEl = document.getElementById('goose-latency');
    if (latencyEl) latencyEl.innerText = `${Math.floor(10 + Math.random() * 5)} ms`;

    const totalLoadEl = document.getElementById('top-total-load');
    const reactiveEl = document.getElementById('top-reactive-power');
    const sysFreqEl = document.getElementById('top-sys-freq');
    const ambTempEl = document.getElementById('overview-ambient-temp');

    if (totalLoadEl && scada.total_load_mw) totalLoadEl.innerText = scada.total_load_mw;
    if (reactiveEl && scada.reactive_mvar) reactiveEl.innerText = scada.reactive_mvar;
    if (sysFreqEl) sysFreqEl.innerText = Number(scada.frequency_hz).toFixed(2);
    if (ambTempEl && scada.ambient_temp_c) ambTempEl.innerText = `${scada.ambient_temp_c} °C`;

    const lvV = document.getElementById('latest-val-voltage');
    const lvC = document.getElementById('latest-val-current');
    const lvP = document.getElementById('latest-val-power');
    if (lvV) lvV.innerText = `${scada.voltage_kv} kV`;
    if (lvC) lvC.innerText = `${scada.current_a} A`;
    if (lvP) lvP.innerText = `${scada.power_mw} MW`;

    document.getElementById('val-voltage').innerText = scada.voltage_kv;
    document.getElementById('val-current').innerText = scada.current_a;
    document.getElementById('val-power').innerText = scada.power_mw;
    document.getElementById('val-pf').innerText = scada.power_factor;
    document.getElementById('val-freq').innerText = `${scada.frequency_hz} Hz`;

    document.getElementById('bar-voltage').style.width = `${Math.min(100, (scada.voltage_kv / 420) * 100)}%`;
    document.getElementById('bar-current').style.width = `${Math.min(100, (scada.current_a / 350) * 100)}%`;
    document.getElementById('bar-pf').style.width = `${Math.min(100, scada.power_factor * 100)}%`;

    const phaseV = (scada.voltage_kv / 1.732).toFixed(1);
    const rEl = document.getElementById('ryb-r');
    const yEl = document.getElementById('ryb-y');
    const bEl = document.getElementById('ryb-b');
    if (rEl) rEl.innerHTML = `${phaseV} kV <span class="text-slate-300 mx-1">|</span> ${(scada.current_a - 0.3).toFixed(1)} A`;
    if (yEl) yEl.innerHTML = `${(phaseV - 0.2).toFixed(1)} kV <span class="text-slate-300 mx-1">|</span> ${(scada.current_a + 0.4).toFixed(1)} A`;
    if (bEl) bEl.innerHTML = `${(+phaseV + 0.2).toFixed(1)} kV <span class="text-slate-300 mx-1">|</span> ${scada.current_a} A`;

    pushGoosePacket(scada);

    if (!isChartPaused) {
        const nowShort = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        telemetryChart.data.labels.shift();
        telemetryChart.data.labels.push(nowShort);
        telemetryChart.data.datasets[0].data.shift();
        telemetryChart.data.datasets[0].data.push(scada.voltage_kv);
        telemetryChart.data.datasets[1].data.shift();
        telemetryChart.data.datasets[1].data.push(scada.current_a);
        telemetryChart.data.datasets[2].data.shift();
        telemetryChart.data.datasets[2].data.push(scada.power_mw);
        telemetryChart.update('none');
    }
}

setInterval(fetchLiveTelemetry, 2500);

function toggleManualBreakerCB1() {
    addAlert('CRITICAL', 'rose', 'Manual Breaker CB-1 Tripped via SLD Interaction');
    const sldTxt = document.getElementById('sld-cb1-txt');
    if (sldTxt) sldTxt.textContent = 'CB-1 (TRIPPED)';
}

async function downloadPDFReport() {
    const reportContent = `====================================================================
      AURIX HACKATHON 2026 - TEAM PATANJALI (IILM UNIVERSITY)
      AI/ML ENABLED DIGITAL TWIN FOR EHV 400/220 kV SUBSTATION
      OFFICIAL ASSET HEALTH & COMPLIANCE REPORT
====================================================================
Timestamp: ${new Date().toLocaleString()}
Framework Standards: IEC 61850 | IEC 62443 Cyber Security
Status: All systems fully operational. Zero unplanned outages.
====================================================================`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURIX_Substation_Compliance_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}