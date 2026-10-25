const API_BASE_URL = "https://aurix-backend-jim2.onrender.com";

// =====================================================
// 1. TAB SWITCHING LOGIC
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
}

// =====================================================
// 2. INITIALIZE LIVE CHARTS (Chart.js)
// =====================================================
const timeLabels = ['10s', '8s', '6s', '4s', '2s', 'Now'];

// Chart 1: Telemetry & Failure Prob Stream
const ctxTelemetry = document.getElementById('telemetryChart').getContext('2d');
const telemetryChart = new Chart(ctxTelemetry, {
    type: 'line',
    data: {
        labels: [...timeLabels],
        datasets: [
            {
                label: 'Bus Voltage (kV)',
                data: [401.2, 402.0, 401.8, 402.5, 402.1, 402.5],
                borderColor: '#22d3ee',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Active Power (MW)',
                data: [152, 154, 153.5, 155, 154.8, 155.3],
                borderColor: '#a855f7',
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
            y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
        }
    }
});

// Chart 2: LSTM Failure Probability
const ctxLstm = document.getElementById('lstmFailureChart').getContext('2d');
const lstmChart = new Chart(ctxLstm, {
    type: 'line',
    data: {
        labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
        datasets: [{
            label: 'TX-1 Failure Probability (%)',
            data: [5, 7, 9, 12, 14, 15, 18],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
            y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
        }
    }
});

// Chart 3: Remaining Useful Life (RUL Degradation Curve)
const ctxRul = document.getElementById('rulChart').getContext('2d');
const rulChart = new Chart(ctxRul, {
    type: 'line',
    data: {
        labels: ['Now', '+30d', '+60d', '+90d', '+120d', '+150d', '+180d'],
        datasets: [{
            label: 'Asset Health Degradation Curve (%)',
            data: [92, 86, 79, 71, 62, 50, 38],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
            y: { min: 0, max: 100, ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
        }
    }
});

// =====================================================
// 3. ALERT LOG MANAGEMENT
// =====================================================
const initialAlerts = [
    { level: 'CRITICAL', color: 'rose', msg: 'High Temp TX-1 (85°C Threshold Near)', time: '14:32:10' },
    { level: 'WARNING', color: 'amber', msg: 'Breaker B2 Vibration Anomaly (12mm/s)', time: '13:45:02' },
    { level: 'INFO', color: 'cyan', msg: 'IEC 61850 GOOSE Packet Sync Verified', time: '13:10:00' }
];

function addAlert(level, color, msg) {
    const time = new Date().toLocaleTimeString();
    initialAlerts.unshift({ level, color, msg, time });
    if (initialAlerts.length > 6) initialAlerts.pop();
    renderAlerts();
}

function renderAlerts() {
    const container = document.getElementById('alert-log-list');
    container.innerHTML = initialAlerts.map(a => `
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-${a.color}-500/30 flex justify-between items-center text-xs">
            <div class="flex items-center space-x-2">
                <span class="px-1.5 py-0.5 rounded bg-${a.color}-500/20 text-${a.color}-400 font-bold text-[10px]">${a.level}</span>
                <span class="text-slate-200">${a.msg}</span>
            </div>
            <span class="text-slate-500 text-[10px]">${a.time}</span>
        </div>
    `).join('');
}
renderAlerts();

// =====================================================
// 4. REAL-TIME SCADA DATA STREAM (Every 2.5 Seconds)
// =====================================================
let isFaultInjected = false;

setInterval(() => {
    if (isFaultInjected) return;

    const voltage = (400 + (Math.random() * 4 - 1.5)).toFixed(1);
    const current = (208 + (Math.random() * 8 - 4)).toFixed(1);
    const power = ((voltage * current * 1.732 * 0.85) / 1000).toFixed(1);
    const freq = (49.95 + Math.random() * 0.1).toFixed(2);

    document.getElementById('val-voltage').innerText = voltage;
    document.getElementById('val-current').innerText = current;
    document.getElementById('val-power').innerText = power;
    document.getElementById('val-freq').innerText = `${freq} Hz`;

    const nowLabel = new Date().toLocaleTimeString().slice(3, 8);
    telemetryChart.data.labels.shift();
    telemetryChart.data.labels.push(nowLabel);
    telemetryChart.data.datasets[0].data.shift();
    telemetryChart.data.datasets[0].data.push(voltage);
    telemetryChart.data.datasets[1].data.shift();
    telemetryChart.data.datasets[1].data.push(power);
    telemetryChart.update();
}, 2500);

// =====================================================
// 5. 3D SIMULATOR & AI RUL PREDICTION ENGINE
// =====================================================
function runSimulation() {
    const load = parseFloat(document.getElementById('slider-load').value);
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const thd = parseFloat(document.getElementById('slider-thd').value);

    document.getElementById('lbl-sim-load').innerText = `${load}%`;
    document.getElementById('lbl-sim-temp').innerText = `${temp} °C`;
    document.getElementById('lbl-sim-thd').innerText = `${thd}%`;

    const hotSpot = (temp + (load * 0.15) + (thd * 0.8)).toFixed(1);
    const failureRisk = Math.min(99, Math.max(5, ((load - 50) * 0.5 + (temp - 55) * 1.1 + thd * 2.2))).toFixed(1);
    const rulDays = Math.max(3, Math.round(220 - (failureRisk * 2.1)));
    const healthT1 = Math.max(15, Math.round(100 - (failureRisk * 0.75)));

    document.getElementById('sim-out-hotspot').innerText = `${hotSpot} °C`;
    document.getElementById('sim-out-risk').innerText = `${failureRisk} %`;
    document.getElementById('sim-out-rul').innerText = `${rulDays} Days`;
    document.getElementById('svg-tx1-temp').innerText = `Oil Temp: ${temp} °C`;
    document.getElementById('svg-tx1-load').innerText = `Load: ${load}%`;

    document.getElementById('health-t1').innerText = `${healthT1}%`;
    document.getElementById('bar-health-t1').style.width = `${healthT1}%`;
    document.getElementById('tree-status-t1').innerText = `${healthT1}%`;
    document.getElementById('rul-badge').innerText = `Est. RUL: ${rulDays} Days`;

    const tx1Box = document.getElementById('iso-tx1-box');
    const powerLine = document.getElementById('iso-power-line');
    const twinPill = document.getElementById('twin-alert-pill');
    const sysBadge = document.getElementById('system-status-text');

    if (failureRisk > 60 || temp >= 90 || load >= 110) {
        isFaultInjected = true;
        tx1Box.setAttribute('stroke', '#f43f5e');
        tx1Box.setAttribute('fill', '#f43f5e');
        powerLine.setAttribute('stroke', '#f43f5e');
        twinPill.innerText = 'CRITICAL: OVERLOAD / THERMAL FAULT!';
        twinPill.className = 'text-xs bg-rose-500/20 border border-rose-500 text-rose-400 px-3 py-1 rounded-full font-bold animate-bounce';
        sysBadge.innerText = 'FAULT DETECTED: TX-1 ALERT';
        
        lstmChart.data.datasets[0].data = [15, 28, 45, 62, 78, 88, failureRisk];
        lstmChart.update();
    } else {
        isFaultInjected = false;
        tx1Box.setAttribute('stroke', '#10b981');
        tx1Box.setAttribute('fill', '#10b981');
        powerLine.setAttribute('stroke', '#22d3ee');
        twinPill.innerText = 'STATE: NORMAL OPERATION';
        twinPill.className = 'text-xs bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-3 py-1 rounded-full font-semibold';
        sysBadge.innerText = 'SCADA SYNC: STABLE';

        lstmChart.data.datasets[0].data = [5, 7, 9, 12, 14, 15, failureRisk];
        lstmChart.update();
    }
}

function injectCriticalFault() {
    document.getElementById('slider-load').value = 130;
    document.getElementById('slider-temp').value = 105;
    document.getElementById('slider-thd').value = 11.5;
    runSimulation();
    addAlert('CRITICAL', 'rose', 'AI Predictor: TX-1 RUL dropped < 15 Days! Auto-isolating CB-1.');
}

function resetSimulation() {
    document.getElementById('slider-load').value = 75;
    document.getElementById('slider-temp').value = 68;
    document.getElementById('slider-thd').value = 2.5;
    runSimulation();
    addAlert('INFO', 'emerald', 'Simulation reset. All EHV parameters nominal.');
}

// =====================================================
// 6. PYTHON FASTAPI BACKEND INTEGRATION (AUTO-DETECT)
// =====================================================
let backendConnected = false;

setInterval(async () => {
    if (isFaultInjected) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/telemetry`);
        if (!res.ok) return;
        const data = await res.json();
        backendConnected = true;

        document.getElementById('val-voltage').innerText = data.scada.voltage_kv;
        document.getElementById('val-current').innerText = data.scada.current_a;
        document.getElementById('val-power').innerText = data.scada.power_mw;
        document.getElementById('val-pf').innerText = data.scada.power_factor;
        document.getElementById('val-freq').innerText = `${data.scada.frequency_hz} Hz`;
        document.getElementById('system-status-text').innerText = "FASTAPI + ML ENGINE: LIVE";
    } catch (err) {
        backendConnected = false;
    }
}, 2500);

const originalRunSimulation = runSimulation;
runSimulation = async function () {
    originalRunSimulation();

    const load = parseFloat(document.getElementById('slider-load').value);
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const thd = parseFloat(document.getElementById('slider-thd').value);

    try {
        const res = await fetch(`${API_BASE_URL}/api/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ load_pct: load, oil_temp: temp, thd: thd })
        });
        if (!res.ok) return;
        const result = await res.json();
        const ai = result.ai_predictions;

        document.getElementById('sim-out-hotspot').innerText = `${ai.hotspot_temp_c} °C`;
        document.getElementById('sim-out-risk').innerText = `${ai.failure_prob_pct} %`;
        document.getElementById('sim-out-rul').innerText = `${ai.rul_days} Days`;
        document.getElementById('rul-badge').innerText = `ML RUL: ${ai.rul_days} Days`;
    } catch (e) {
        // Fallback
    }
};

// =====================================================
// 7. PDF / COMPLIANCE REPORT EXPORT FUNCTION
// =====================================================
async function downloadPDFReport() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/export-report`);
        if (!response.ok) throw new Error("Failed to generate report");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "AURIX_Substation_Compliance_Report.txt";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        
        addAlert('INFO', 'emerald', 'Compliance & Health Report downloaded successfully.');
    } catch (err) {
        alert("Make sure FastAPI backend is running to export report!");
    }
}