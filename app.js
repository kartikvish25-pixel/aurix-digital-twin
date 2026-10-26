// =====================================================
// CONFIGURATION: BACKEND API URL (Auto-Fallback Enabled)
// =====================================================
const API_BASE_URL = "http://127.0.0.1:8000";

let latestTelemetryState = {
    timestamp: new Date().toLocaleTimeString(),
    scada: { voltage_kv: 402.5, current_a: 210.8, power_mw: 125.3, power_factor: 0.86, frequency_hz: 50.00 },
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
let peakVoltage = 402.5;
let peakPower = 125.3;

// Live IST Clock in Top Header
setInterval(() => {
    const clockEl = document.getElementById('live-ist-clock');
    if (clockEl) clockEl.innerText = `${new Date().toLocaleTimeString()} IST`;
}, 1000);

// =====================================================
// 1. SECURE LOGIN AUTHENTICATION
// =====================================================
function quickFillLogin() {
    document.getElementById('login-user').value = "Exec_01";
    document.getElementById('login-pass').value = "patanjali2026";
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
        document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
            const dashboard = document.getElementById('main-dashboard');
            dashboard.classList.remove('opacity-0', 'pointer-events-none');
            dashboard.classList.add('opacity-100');
            resizeAllCharts();
        }, 300);
    } else {
        errorBox.classList.remove('hidden');
    }
}

function resizeAllCharts() {
    telemetryChart.resize();
    harmonicFftChart.resize();
    lstmChart.resize();
    rulChart.resize();
    healthRadarChart.resize();
}

// =====================================================
// 2. MAIN TAB & SUB-VIEW SIDEBAR NAVIGATION
// =====================================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('block');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab');
        btn.classList.add('text-slate-400');
    });

    document.getElementById(`view-${tabName}`).classList.remove('hidden');
    document.getElementById(`view-${tabName}`).classList.add('block');
    
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.add('active-tab');
    activeBtn.classList.remove('text-slate-400');

    setTimeout(resizeAllCharts, 100);
}

function toggleSidebar(tabPrefix) {
    const sidebar = document.getElementById(`sidebar-${tabPrefix}`);
    const content = document.getElementById(`content-${tabPrefix}`);
    const toggleTxt = document.getElementById(`toggle-txt-${tabPrefix}`);

    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('lg:col-span-3');
        content.classList.remove('lg:col-span-12');
        content.classList.add('lg:col-span-9');
        toggleTxt.innerText = "Hide Menu";
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('lg:col-span-3');
        content.classList.remove('lg:col-span-9');
        content.classList.add('lg:col-span-12');
        toggleTxt.innerText = "Show Menu";
    }
    setTimeout(resizeAllCharts, 100);
}

function switchSubView(tabPrefix, subViewName) {
    const parentTab = document.getElementById(`view-${tabPrefix}`);
    parentTab.querySelectorAll('.sub-section').forEach(sub => {
        sub.classList.add('hidden');
        sub.classList.remove('block');
    });

    parentTab.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.classList.remove('active-sub');
        btn.classList.add('text-slate-300', 'hover:bg-slate-700/50');
    });

    const targetSub = document.getElementById(`sub-view-${subViewName}`);
    if (targetSub) {
        targetSub.classList.remove('hidden');
        targetSub.classList.add('block');
    }

    const activeSubBtn = document.getElementById(`sub-btn-${subViewName}`);
    if (activeSubBtn) {
        activeSubBtn.classList.add('active-sub');
        activeSubBtn.classList.remove('text-slate-300', 'hover:bg-slate-700/50');
    }

    setTimeout(resizeAllCharts, 50);
}

function toggleChartPause() {
    isChartPaused = !isChartPaused;
    const btn = document.getElementById('btn-pause-chart');
    if (btn) {
        btn.innerHTML = isChartPaused
            ? `<i class="fa-solid fa-play text-emerald-400"></i> Resume Stream`
            : `<i class="fa-solid fa-pause"></i> Pause Stream`;
    }
}

// =====================================================
// 3. UPGRADED CHART INITIALIZATIONS (Chart.js)
// =====================================================
const timeLabels = ['18s', '15s', '12s', '9s', '6s', '3s', 'Now'];

// A. Dual-Axis Live SCADA Waveform Chart
const ctxTelemetry = document.getElementById('telemetryChart').getContext('2d');
const gradCyan = ctxTelemetry.createLinearGradient(0, 0, 0, 300);
gradCyan.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
gradCyan.addColorStop(1, 'rgba(34, 211, 238, 0.0)');

const gradPurple = ctxTelemetry.createLinearGradient(0, 0, 0, 300);
gradPurple.addColorStop(0, 'rgba(168, 85, 247, 0.30)');
gradPurple.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

const telemetryChart = new Chart(ctxTelemetry, {
    type: 'line',
    data: {
        labels: [...timeLabels],
        datasets: [
            {
                label: 'Bus Voltage (kV)',
                data: [401.2, 402.0, 401.8, 402.5, 402.1, 401.9, 402.5],
                borderColor: '#22d3ee',
                backgroundColor: gradCyan,
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#083344',
                pointBorderColor: '#22d3ee',
                tension: 0.4,
                fill: true,
                yAxisID: 'yVoltage'
            },
            {
                label: 'Active Power (MW)',
                data: [122.0, 124.5, 123.1, 125.8, 124.9, 126.0, 125.3],
                borderColor: '#a855f7',
                backgroundColor: gradPurple,
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#3b0764',
                pointBorderColor: '#a855f7',
                tension: 0.4,
                fill: true,
                yAxisID: 'yPower'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 8 } },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(34, 211, 238, 0.4)',
                borderWidth: 1
            }
        },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(30, 41, 59, 0.6)' } },
            yVoltage: {
                type: 'linear',
                position: 'left',
                suggestedMin: 396,
                suggestedMax: 406,
                title: { display: true, text: 'Bus Voltage (kV)', color: '#22d3ee', font: { size: 11 } },
                ticks: { color: '#22d3ee' },
                grid: { color: 'rgba(30, 41, 59, 0.6)' }
            },
            yPower: {
                type: 'linear',
                position: 'right',
                suggestedMin: 110,
                suggestedMax: 145,
                title: { display: true, text: 'Active Power (MW)', color: '#a855f7', font: { size: 11 } },
                ticks: { color: '#a855f7' },
                grid: { drawOnChartArea: false }
            }
        }
    }
});

// B. Harmonic Distortion FFT Spectrum Bar Chart
const ctxFft = document.getElementById('harmonicFftChart').getContext('2d');
const harmonicFftChart = new Chart(ctxFft, {
    type: 'bar',
    data: {
        labels: ['1st (50Hz Fund.)', '3rd (150Hz)', '5th (250Hz)', '7th (350Hz)', '9th (450Hz)', '11th (550Hz)', '13th (650Hz)'],
        datasets: [{
            label: 'Harmonic Magnitude (% of Fundamental)',
            data: [100, 1.8, 1.4, 0.9, 0.5, 0.3, 0.2],
            backgroundColor: [
                'rgba(34, 211, 238, 0.7)',
                'rgba(168, 85, 247, 0.75)',
                'rgba(245, 158, 11, 0.75)',
                'rgba(245, 158, 11, 0.75)',
                'rgba(16, 185, 129, 0.75)',
                'rgba(16, 185, 129, 0.75)',
                'rgba(16, 185, 129, 0.75)'
            ],
            borderColor: '#a855f7',
            borderWidth: 1,
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(30, 41, 59, 0.5)' } },
            y: {
                type: 'logarithmic',
                title: { display: true, text: 'Log Magnitude (%)', color: '#94a3b8' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(30, 41, 59, 0.5)' }
            }
        }
    }
});

// C. LSTM 30-Day Failure Probability Forecast (With Critical Threshold Line)
const ctxLstm = document.getElementById('lstmFailureChart').getContext('2d');
const lstmChart = new Chart(ctxLstm, {
    type: 'line',
    data: {
        labels: ['Now', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
        datasets: [
            {
                label: 'Predicted Failure Probability (%)',
                data: [8, 10, 12, 14, 16, 18, 21],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.16)',
                borderWidth: 2.5,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Auto-Trip Danger Threshold (70%)',
                data: [70, 70, 70, 70, 70, 70, 70],
                borderColor: '#f43f5e',
                borderWidth: 1.8,
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#cbd5e1', usePointStyle: true } } },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
            y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
        }
    }
});

// D. RUL Asset Health Degradation Curve (With Overhaul Threshold Line)
const ctxRul = document.getElementById('rulChart').getContext('2d');
const rulChart = new Chart(ctxRul, {
    type: 'line',
    data: {
        labels: ['Now', '+30d', '+60d', '+90d', '+120d', '+150d', '+180d'],
        datasets: [
            {
                label: 'Asset Health Index (%)',
                data: [92, 88, 83, 77, 70, 62, 54],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                borderWidth: 2.5,
                pointRadius: 4,
                fill: true,
                tension: 0.35
            },
            {
                label: 'Mandatory Overhaul Limit (40%)',
                data: [40, 40, 40, 40, 40, 40, 40],
                borderColor: '#f43f5e',
                borderWidth: 1.8,
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#cbd5e1', usePointStyle: true } } },
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
            y: { min: 0, max: 100, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
        }
    }
});

// E. 5-Axis Transformer Health Radar Chart
const ctxRadar = document.getElementById('healthRadarChart').getContext('2d');
const healthRadarChart = new Chart(ctxRadar, {
    type: 'radar',
    data: {
        labels: [
            'Thermal Integrity',
            'Dielectric Insulation',
            'SF6 Breaker Contacts',
            'DGA Oil Purity',
            'Harmonic Immunity'
        ],
        datasets: [
            {
                label: 'TX-1 Live Digital Twin State',
                data: [91, 94, 88, 92, 90],
                backgroundColor: 'rgba(34, 211, 238, 0.22)',
                borderColor: '#22d3ee',
                pointBackgroundColor: '#22d3ee',
                borderWidth: 2.5
            },
            {
                label: 'IEEE Nominal Baseline',
                data: [95, 95, 95, 95, 95],
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderColor: '#10b981',
                borderDash: [4, 4],
                pointRadius: 2,
                borderWidth: 1.5
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e2e8f0' } } },
        scales: {
            r: {
                min: 0,
                max: 100,
                angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
                grid: { color: 'rgba(148, 163, 184, 0.2)' },
                pointLabels: { color: '#cbd5e1', font: { size: 11, weight: 'bold' } },
                ticks: { display: false }
            }
        }
    }
});

// Function to dynamically update AI Graphs (LSTM, RUL, Radar, FFT) on Simulation / Live State
function updateDynamicAIGraphs(ai, loadPct = 75, thdPct = 2.5) {
    const baseFail = ai.failure_prob_pct;
    const baseHealth = ai.health_index_pct;

    // 1. Update LSTM 30-Day Forecast Curve
    const lstmCurve = [
        baseFail,
        Math.min(99, +(baseFail * 1.08 + 1.2).toFixed(1)),
        Math.min(99, +(baseFail * 1.16 + 2.5).toFixed(1)),
        Math.min(99, +(baseFail * 1.25 + 4.0).toFixed(1)),
        Math.min(99, +(baseFail * 1.35 + 5.8).toFixed(1)),
        Math.min(99, +(baseFail * 1.45 + 7.5).toFixed(1)),
        Math.min(99, +(baseFail * 1.55 + 9.5).toFixed(1))
    ];
    lstmChart.data.datasets[0].data = lstmCurve;
    lstmChart.data.datasets[0].borderColor = ai.severity === 'CRITICAL' ? '#f43f5e' : (ai.severity === 'WARNING' ? '#f59e0b' : '#22d3ee');
    lstmChart.data.datasets[0].backgroundColor = ai.severity === 'CRITICAL' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.16)';
    lstmChart.update('none');

    // 2. Update RUL 180-Day Degradation Curve
    const dropRate = ai.severity === 'CRITICAL' ? 11.5 : (ai.severity === 'WARNING' ? 7.5 : 5.2);
    const rulCurve = [
        baseHealth,
        Math.max(5, Math.round(baseHealth - dropRate * 1)),
        Math.max(5, Math.round(baseHealth - dropRate * 2.1)),
        Math.max(5, Math.round(baseHealth - dropRate * 3.3)),
        Math.max(5, Math.round(baseHealth - dropRate * 4.6)),
        Math.max(5, Math.round(baseHealth - dropRate * 6.0)),
        Math.max(5, Math.round(baseHealth - dropRate * 7.5))
    ];
    rulChart.data.datasets[0].data = rulCurve;
    rulChart.data.datasets[0].borderColor = ai.severity === 'CRITICAL' ? '#f43f5e' : '#10b981';
    rulChart.update('none');

    // 3. Update 5-Axis Radar Chart
    const thermalScore = Math.max(15, Math.min(98, Math.round(115 - (ai.hotspot_temp_c - 60) * 1.3)));
    const dielectricScore = Math.max(20, Math.round(baseHealth * 0.98));
    const contactScore = Math.max(25, Math.round(100 - (loadPct - 60) * 0.55));
    const dgaScore = Math.max(15, Math.round(100 - baseFail * 0.85));
    const harmonicScore = Math.max(15, Math.round(100 - thdPct * 6.5));

    healthRadarChart.data.datasets[0].data = [thermalScore, dielectricScore, contactScore, dgaScore, harmonicScore];
    healthRadarChart.data.datasets[0].borderColor = ai.severity === 'CRITICAL' ? '#f43f5e' : '#22d3ee';
    healthRadarChart.data.datasets[0].backgroundColor = ai.severity === 'CRITICAL' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(34, 211, 238, 0.22)';
    healthRadarChart.update('none');

    // 4. Update FFT Harmonic Spectrum
    harmonicFftChart.data.datasets[0].data = [
        100,
        +(thdPct * 0.72).toFixed(2),
        +(thdPct * 0.56).toFixed(2),
        +(thdPct * 0.36).toFixed(2),
        +(thdPct * 0.20).toFixed(2),
        +(thdPct * 0.12).toFixed(2),
        +(thdPct * 0.08).toFixed(2)
    ];
    harmonicFftChart.update('none');

    const thdEl = document.getElementById('chart-thd-val');
    if (thdEl) thdEl.innerText = `${thdPct} %`;
}

// =====================================================
// 4. ALERTS & IEC 61850 GOOSE SNIFFER MANAGEMENT
// =====================================================
let alertsList = [
    { level: 'CRITICAL', color: 'rose', msg: 'High Temp TX-1 (85°C Threshold Near)', time: '14:32:10' },
    { level: 'WARNING', color: 'amber', msg: 'Breaker B2 Vibration Anomaly (12mm/s)', time: '13:45:02' },
    { level: 'INFO', color: 'cyan', msg: 'IEC 61850 GOOSE Packet Sync Verified', time: '13:10:00' }
];

let goosePackets = [];

function renderAlerts() {
    const container = document.getElementById('alert-log-list');
    const badge = document.getElementById('alert-count-badge');
    if (badge) badge.innerText = alertsList.length;
    if (!container) return;

    if (alertsList.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">No unacknowledged alarms in queue.</div>`;
        return;
    }

    container.innerHTML = alertsList.map(a => `
        <div class="p-3 rounded-lg bg-slate-900 border border-${a.color}-500/30 flex justify-between items-center text-xs">
            <div class="flex items-center space-x-2.5">
                <span class="px-2 py-0.5 rounded bg-${a.color}-500/20 text-${a.color}-400 font-bold text-[10px]">${a.level}</span>
                <span class="text-slate-200">${a.msg}</span>
            </div>
            <span class="text-slate-500 text-[10px] font-mono">${a.time}</span>
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
    streamEl.innerHTML = goosePackets.map(p => `<div class="text-emerald-400/90">${p}</div>`).join('');
}

renderAlerts();

// =====================================================
// 5. LIVE TELEMETRY STREAM (FASTAPI + FALLBACK)
// =====================================================
let isManualSimulationActive = false;

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
        const voltage = +(399.0 + Math.random() * 4.2).toFixed(1);
        const current = +(205.0 + Math.random() * 12.0).toFixed(1);
        const pf = +(0.85 + Math.random() * 0.04).toFixed(2);
        const freq = +(49.96 + Math.random() * 0.08).toFixed(2);
        const power = +((voltage * current * 1.732 * pf) / 1000).toFixed(1);

        latestTelemetryState.timestamp = new Date().toLocaleTimeString();
        latestTelemetryState.scada = {
            voltage_kv: voltage,
            current_a: current,
            power_mw: power,
            power_factor: pf,
            frequency_hz: freq
        };
        updateDashboardUI(latestTelemetryState, false);
    }
}

function updateDashboardUI(data, isBackendConnected) {
    const { scada, ai_predictions } = data;

    document.getElementById('last-sync-time').innerText = data.timestamp;
    document.getElementById('system-status-text').innerText = isBackendConnected
        ? "SCADA + AI API: ONLINE"
        : "SCADA EDGE SIM: ACTIVE";

    const latencyEl = document.getElementById('goose-latency');
    if (latencyEl) latencyEl.innerText = `${Math.floor(9 + Math.random() * 6)} ms`;

    document.getElementById('val-voltage').innerText = scada.voltage_kv;
    document.getElementById('val-current').innerText = scada.current_a;
    document.getElementById('val-power').innerText = scada.power_mw;
    document.getElementById('val-pf').innerText = scada.power_factor;
    document.getElementById('val-freq').innerText = `${scada.frequency_hz} Hz`;

    const mvarEl = document.getElementById('val-mvar');
    if (mvarEl) mvarEl.innerText = (scada.power_mw * 0.48).toFixed(1);

    // Track Peak Stats for Oscilloscope Header
    if (scada.voltage_kv > peakVoltage) peakVoltage = scada.voltage_kv;
    if (scada.power_mw > peakPower) peakPower = scada.power_mw;
    const pkVEl = document.getElementById('chart-peak-v');
    const pkMwEl = document.getElementById('chart-peak-mw');
    if (pkVEl) pkVEl.innerText = `${peakVoltage} kV`;
    if (pkMwEl) pkMwEl.innerText = `${peakPower} MW`;

    // 3-Phase R-Y-B Symmetrical Values
    const phaseV = (scada.voltage_kv / 1.732).toFixed(1);
    const rEl = document.getElementById('ryb-r');
    const yEl = document.getElementById('ryb-y');
    const bEl = document.getElementById('ryb-b');
    if (rEl) rEl.innerText = `${phaseV} kV | ${(scada.current_a - 0.3).toFixed(1)} A`;
    if (yEl) yEl.innerText = `${(phaseV - 0.2).toFixed(1)} kV | ${(scada.current_a + 0.4).toFixed(1)} A`;
    if (bEl) bEl.innerText = `${(+phaseV + 0.2).toFixed(1)} kV | ${scada.current_a} A`;

    document.getElementById('bar-voltage').style.width = `${Math.min(100, (scada.voltage_kv / 420) * 100)}%`;
    document.getElementById('bar-current').style.width = `${Math.min(100, (scada.current_a / 350) * 100)}%`;
    document.getElementById('bar-power').style.width = `${Math.min(100, (scada.power_mw / 200) * 100)}%`;
    document.getElementById('bar-pf').style.width = `${Math.min(100, scada.power_factor * 100)}%`;

    // Sync Live Readings on 2D SLD IED Callout Box
    const sldBusKv = document.getElementById('sld-bus-kv');
    const sldTx1Mw = document.getElementById('sld-tx1-mw');
    const sldTx1Amp = document.getElementById('sld-tx1-amp');
    if (sldBusKv) sldBusKv.textContent = `V: ${scada.voltage_kv} kV | ${scada.frequency_hz}Hz`;
    if (sldTx1Mw) sldTx1Mw.textContent = `${scada.power_mw} MW`;
    if (sldTx1Amp) sldTx1Amp.textContent = `${scada.current_a} A`;

    pushGoosePacket(scada);

    if (!isChartPaused) {
        telemetryChart.data.labels.shift();
        telemetryChart.data.labels.push(data.timestamp);
        telemetryChart.data.datasets[0].data.shift();
        telemetryChart.data.datasets[0].data.push(scada.voltage_kv);
        telemetryChart.data.datasets[1].data.shift();
        telemetryChart.data.datasets[1].data.push(scada.power_mw);
        telemetryChart.update('none');
    }

    if (ai_predictions) {
        updateAIPanel(ai_predictions);
    }
}

function updateAIPanel(ai) {
    document.getElementById('ai-health-idx').innerText = `${ai.health_index_pct}%`;
    document.getElementById('ai-hotspot-temp').innerText = `${ai.hotspot_temp_c} °C`;
    document.getElementById('ai-fail-prob').innerText = `${ai.failure_prob_pct}%`;
    document.getElementById('ai-rul-days').innerText = `${ai.rul_days} Days`;

    const sldTx1Temp = document.getElementById('sld-tx1-temp');
    if (sldTx1Temp) sldTx1Temp.textContent = `${ai.hotspot_temp_c} °C`;

    // Update DGA Gas ppm dynamically based on failure risk
    const riskFactor = ai.failure_prob_pct / 12.0;
    const h2 = Math.round(35 * riskFactor);
    const ch4 = Math.round(24 * riskFactor);
    const c2h4 = Math.round(16 * riskFactor);
    const c2h2 = +(0.6 * riskFactor).toFixed(1);

    const elH2 = document.getElementById('dga-h2');
    const elCh4 = document.getElementById('dga-ch4');
    const elC2h4 = document.getElementById('dga-c2h4');
    const elC2h2 = document.getElementById('dga-c2h2');
    if (elH2) {
        elH2.innerText = `${h2} ppm`;
        document.getElementById('bar-dga-h2').style.width = `${Math.min(100, h2 / 3)}%`;
        elCh4.innerText = `${ch4} ppm`;
        document.getElementById('bar-dga-ch4').style.width = `${Math.min(100, ch4 / 2.5)}%`;
        elC2h4.innerText = `${c2h4} ppm`;
        document.getElementById('bar-dga-c2h4').style.width = `${Math.min(100, c2h4 / 2)}%`;
        elC2h2.innerText = `${c2h2} ppm`;
        document.getElementById('bar-dga-c2h2').style.width = `${Math.min(100, c2h2 * 12)}%`;
    }

    document.getElementById('ai-fault-title').innerText = `Diagnostic State: ${ai.fault_classification}`;
    document.getElementById('ai-fault-action').innerText = `Recommended Action: ${ai.recommended_action}`;

    const badge = document.getElementById('ai-severity-badge');
    if (ai.severity === "CRITICAL") {
        badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse";
        badge.innerText = "SEVERITY: CRITICAL";
    } else if (ai.severity === "WARNING") {
        badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40";
        badge.innerText = "SEVERITY: WARNING";
    } else {
        badge.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
        badge.innerText = "SEVERITY: NORMAL";
    }
}

setInterval(fetchLiveTelemetry, 2500);

// =====================================================
// 6. 3D TWIN SIMULATOR, CLICKABLE SLD & WHAT-IF ENGINE
// =====================================================
async function runSimulation() {
    isManualSimulationActive = true;

    const load = parseFloat(document.getElementById('slider-load').value);
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const thd = parseFloat(document.getElementById('slider-thd').value);

    document.getElementById('lbl-load').innerText = `${load}%`;
    document.getElementById('lbl-temp').innerText = `${temp} °C`;
    document.getElementById('lbl-thd').innerText = `${thd}%`;
    
    const tempLabel = document.getElementById('iso-tx1-temp-label');
    if (tempLabel) tempLabel.textContent = `${temp}°C`;

    let aiResult;

    try {
        const res = await fetch(`${API_BASE_URL}/api/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ load_pct: load, oil_temp: temp, thd: thd })
        });
        if (!res.ok) throw new Error("Fallback to local ML math");
        const data = await res.json();
        aiResult = data.ai_predictions;
    } catch (e) {
        const vibration = +(3.0 + (load * 0.04) + (thd * 0.6)).toFixed(2);
        const failure_prob = +Math.min(99.0, Math.max(2.0, (load - 50) * 0.45 + (temp - 55) * 1.15 + (thd * 2.1) + (vibration * 1.2))).toFixed(1);
        const rul_days = Math.max(3, Math.floor(225 - (failure_prob * 2.15)));
        const health_index = Math.max(12, Math.floor(100 - (failure_prob * 0.78)));
        const hotspot_temp = +(temp + (load * 0.16) + (thd * 0.85)).toFixed(1);

        let fault_class = "Normal Operating State";
        let severity = "NORMAL";
        let action = "No Immediate Maintenance Required. Cooling bank on standby.";

        if (temp >= 90 || failure_prob > 70 || load > 110) {
            fault_class = "Thermal Overload / DGA Gas Spike (TX-1)";
            severity = "CRITICAL";
            action = "Trigger CB-1 Auto-Trip & Activate Standby Cooling Bank Immediately!";
        } else if (thd >= 7.0 || load >= 100) {
            fault_class = "Harmonic Resonance / Core Saturation";
            severity = "WARNING";
            action = "Switch Harmonic Filter Bank & Inspect Breaker B2 Contacts.";
        }

        aiResult = {
            hotspot_temp_c: hotspot_temp,
            failure_prob_pct: failure_prob,
            rul_days: rul_days,
            health_index_pct: health_index,
            fault_classification: fault_class,
            severity: severity,
            recommended_action: action
        };
    }

    latestTelemetryState.ai_predictions = aiResult;
    updateAIPanel(aiResult);
    updateDynamicAIGraphs(aiResult, load, thd);

    const simHotspot = document.getElementById('sim-out-hotspot');
    const simRisk = document.getElementById('sim-out-risk');
    const simRul = document.getElementById('sim-out-rul');
    const simAction = document.getElementById('sim-action-box');

    if (simHotspot) simHotspot.innerText = `${aiResult.hotspot_temp_c} °C`;
    if (simRisk) simRisk.innerText = `${aiResult.failure_prob_pct} %`;
    if (simRul) simRul.innerText = `${aiResult.rul_days} Days`;
    if (simAction) simAction.innerText = `${aiResult.fault_classification}: ${aiResult.recommended_action}`;

    // 3D Yard & 2D SLD Elements
    const tx1Box = document.getElementById('iso-tx1-box');
    const inner1 = document.getElementById('iso-tx1-inner1');
    const inner2 = document.getElementById('iso-tx1-inner2');
    const twinPill = document.getElementById('twin-alert-pill');
    const sldBreaker1 = document.getElementById('sld-breaker-1');
    const sldCb1Txt = document.getElementById('sld-cb1-txt');
    const sldTx1Top = document.getElementById('sld-tx1-top');
    const sldTx1Bot = document.getElementById('sld-tx1-bot');
    const sldStatusTag = document.getElementById('sld-status-tag');

    // Animated Flow Lines for TX-1
    const flowLines = [
        document.getElementById('sld-flow-tx1-in'),
        document.getElementById('sld-flow-tx1-out'),
        document.getElementById('iso-flow-1'),
        document.getElementById('iso-flow-2')
    ];

    if (aiResult.severity === "CRITICAL") {
        if (tx1Box) {
            tx1Box.setAttribute('stroke', '#f43f5e');
            tx1Box.setAttribute('fill', '#f43f5e');
        }
        if (inner1) inner1.setAttribute('stroke', '#f43f5e');
        if (inner2) inner2.setAttribute('stroke', '#f43f5e');
        if (twinPill) {
            twinPill.innerText = 'CRITICAL: OVERLOAD FAULT!';
            twinPill.className = 'text-xs bg-rose-500/25 border border-rose-500 text-rose-400 px-3 py-1 rounded-full font-bold animate-pulse';
        }
        if (sldBreaker1) sldBreaker1.setAttribute('fill', '#f43f5e');
        if (sldCb1Txt) {
            sldCb1Txt.textContent = 'CB-1 (TRIPPED)';
            sldCb1Txt.setAttribute('fill', '#fda4af');
        }
        if (sldTx1Top) sldTx1Top.setAttribute('stroke', '#f43f5e');
        if (sldTx1Bot) sldTx1Bot.setAttribute('stroke', '#f43f5e');
        if (sldStatusTag) {
            sldStatusTag.innerText = 'CRITICAL: TX-1 OVERLOAD / CB-1 TRIPPED';
            sldStatusTag.className = 'text-xs bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full font-bold animate-pulse';
        }
        flowLines.forEach(l => l && l.classList.add('power-flow-stopped'));
    } else if (aiResult.severity === "WARNING") {
        if (tx1Box) {
            tx1Box.setAttribute('stroke', '#f59e0b');
            tx1Box.setAttribute('fill', '#f59e0b');
        }
        if (inner1) inner1.setAttribute('stroke', '#f59e0b');
        if (inner2) inner2.setAttribute('stroke', '#f59e0b');
        if (twinPill) {
            twinPill.innerText = 'WARNING: ELEVATED STRESS';
            twinPill.className = 'text-xs bg-amber-500/25 border border-amber-400 text-amber-300 px-3 py-1 rounded-full font-semibold';
        }
        if (sldBreaker1) sldBreaker1.setAttribute('fill', '#f59e0b');
        if (sldCb1Txt) {
            sldCb1Txt.textContent = 'CB-1 (ALARM)';
            sldCb1Txt.setAttribute('fill', '#fcd34d');
        }
        if (sldTx1Top) sldTx1Top.setAttribute('stroke', '#f59e0b');
        if (sldTx1Bot) sldTx1Bot.setAttribute('stroke', '#f59e0b');
        if (sldStatusTag) {
            sldStatusTag.innerText = 'WARNING: HARMONIC / THERMAL STRESS';
            sldStatusTag.className = 'text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-semibold';
        }
        flowLines.forEach(l => l && l.classList.remove('power-flow-stopped'));
    } else {
        if (tx1Box) {
            tx1Box.setAttribute('stroke', '#10b981');
            tx1Box.setAttribute('fill', '#10b981');
        }
        if (inner1) inner1.setAttribute('stroke', '#10b981');
        if (inner2) inner2.setAttribute('stroke', '#10b981');
        if (twinPill) {
            twinPill.innerText = 'STATE: NORMAL OPERATION';
            twinPill.className = 'text-xs bg-cyan-500/25 border border-cyan-400 text-cyan-300 px-3 py-1 rounded-full font-semibold';
        }
        if (sldBreaker1) sldBreaker1.setAttribute('fill', '#10b981');
        if (sldCb1Txt) {
            sldCb1Txt.textContent = 'CB-1 (CLOSED)';
            sldCb1Txt.setAttribute('fill', '#e2e8f0');
        }
        if (sldTx1Top) sldTx1Top.setAttribute('stroke', '#22d3ee');
        if (sldTx1Bot) sldTx1Bot.setAttribute('stroke', '#10b981');
        if (sldStatusTag) {
            sldStatusTag.innerText = 'All Feeders Energized';
            sldStatusTag.className = 'text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-semibold';
        }
        flowLines.forEach(l => l && l.classList.remove('power-flow-stopped'));
    }
}

function toggleManualBreakerCB1() {
    const currentTemp = parseFloat(document.getElementById('slider-temp').value);
    if (currentTemp >= 90) {
        resetSimulation();
    } else {
        injectCriticalFault();
    }
}

function injectCriticalFault() {
    document.getElementById('slider-load').value = 132;
    document.getElementById('slider-temp').value = 104;
    document.getElementById('slider-thd').value = 9.5;
    runSimulation();
    addAlert('CRITICAL', 'rose', 'Simulated Fault Injected: TX-1 Thermal Overload (104°C) & CB-1 Trip');
}

function resetSimulation() {
    isManualSimulationActive = false;
    document.getElementById('slider-load').value = 75;
    document.getElementById('slider-temp').value = 68;
    document.getElementById('slider-thd').value = 2.5;
    runSimulation();
    isManualSimulationActive = false;
    addAlert('INFO', 'cyan', 'Simulation Reset to Nominal Operating Parameters');
}

function generateCMMSTicket() {
    const ai = latestTelemetryState.ai_predictions;
    const ticketId = `WO-${Math.floor(10000 + Math.random() * 90000)}`;
    addAlert('INFO', 'cyan', `CMMS Work Order ${ticketId} Dispatched: ${ai.recommended_action}`);
    alert(`CMMS Work Order Generated!\n\nTicket ID: ${ticketId}\nAsset: 400/220kV ICT TX-1 (315 MVA)\nSeverity: ${ai.severity}\nAction: ${ai.recommended_action}`);
}

// =====================================================
// 7. REAL COMPLIANCE REPORT DOWNLOAD
// =====================================================
async function downloadPDFReport() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/export-report`);
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "AURIX_Substation_Compliance_Report.txt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
        }
    } catch (err) {}

    const { scada, ai_predictions, timestamp } = latestTelemetryState;
    const reportContent = `====================================================================
      AURIX HACKATHON 2026 - TEAM PATANJALI (IILM UNIVERSITY)
      AI/ML ENABLED DIGITAL TWIN FOR EHV 400/220 kV SUBSTATION
      OFFICIAL ASSET HEALTH & COMPLIANCE REPORT
====================================================================
Timestamp: ${timestamp}
Framework Standards: IEC 61850 (Substation Interoperability)
                     IEC 62443 (Industrial Cyber-Security)

--------------------------------------------------------------------
1. REAL-TIME SCADA TELEMETRY (OPC-UA / MQTT)
--------------------------------------------------------------------
- Bus Voltage (EHV): ${scada.voltage_kv} kV (Nominal: 400 kV)
- Line Current     : ${scada.current_a} A
- Active Power Flow: ${scada.power_mw} MW
- Power Factor     : ${scada.power_factor}
- Frequency        : ${scada.frequency_hz} Hz

--------------------------------------------------------------------
2. AI/ML ANALYTICS & DIAGNOSTICS (Random Forest / LSTM)
--------------------------------------------------------------------
- Transformer T1 Health Index : ${ai_predictions.health_index_pct}%
- Winding Hot-Spot Temp       : ${ai_predictions.hotspot_temp_c} °C
- Failure Probability         : ${ai_predictions.failure_prob_pct}%
- Estimated Remaining Life    : ${ai_predictions.rul_days} Days

--------------------------------------------------------------------
3. FAULT CLASSIFICATION & CMMS ACTION PLAN
--------------------------------------------------------------------
- Diagnostic Classification   : ${ai_predictions.fault_classification}
- Severity Level              : ${ai_predictions.severity}
- Recommended Maintenance     : ${ai_predictions.recommended_action}

====================================================================
Generated automatically by AURIX Digital Twin Engine v1.0.0
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