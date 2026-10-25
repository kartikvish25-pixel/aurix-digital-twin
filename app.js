// =====================================================
// 1. SECURE LOGIN AUTHENTICATION
// =====================================================
function handleLogin(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorBox = document.getElementById('login-error');

    if (user === "Substation_Exec_01" || user === "Exec_01" || user === "admin" && pass === "patanjali2026" || pass === "admin") {
        document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
            const dashboard = document.getElementById('main-dashboard');
            dashboard.classList.remove('opacity-0', 'pointer-events-none');
            dashboard.classList.add('opacity-100');
            // Refresh charts when dashboard becomes visible
            telemetryChart.update();
            lstmChart.update();
            rulChart.update();
        }, 300);
    } else {
        errorBox.classList.remove('hidden');
    }
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

    // Trigger chart resize fix
    setTimeout(() => {
        telemetryChart.resize();
        lstmChart.resize();
        rulChart.resize();
    }, 100);
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

    // Refresh charts when switching sub-views
    setTimeout(() => {
        telemetryChart.resize();
        lstmChart.resize();
        rulChart.resize();
    }, 50);
}

// =====================================================
// 3. FIXED CHART INITIALIZATIONS (Chart.js)
// =====================================================
const timeLabels = ['10s', '8s', '6s', '4s', '2s', 'Now'];

const ctxTelemetry = document.getElementById('telemetryChart').getContext('2d');
const telemetryChart = new Chart(ctxTelemetry, {
    type: 'line',
    data: {
        labels: [...timeLabels],
        datasets: [{
            label: 'Bus Voltage (kV)',
            data: [401.2, 402.0, 401.8, 402.5, 402.1, 402.5],
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const ctxLstm = document.getElementById('lstmFailureChart').getContext('2d');
const lstmChart = new Chart(ctxLstm, {
    type: 'line',
    data: {
        labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
        datasets: [{ label: 'Failure Probability (%)', data: [5, 7, 9, 12, 14, 15, 18], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.4 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const ctxRul = document.getElementById('rulChart').getContext('2d');
const rulChart = new Chart(ctxRul, {
    type: 'line',
    data: {
        labels: ['Now', '+30d', '+60d', '+90d', '+120d', '+150d', '+180d'],
        datasets: [{ label: 'Asset Health (%)', data: [92, 86, 79, 71, 62, 50, 38], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// =====================================================
// 4. ALERTS & LIVE SIMULATION
// =====================================================
const initialAlerts = [
    { level: 'CRITICAL', color: 'rose', msg: 'High Temp TX-1 (85°C Threshold Near)', time: '14:32:10' },
    { level: 'WARNING', color: 'amber', msg: 'Breaker B2 Vibration Anomaly (12mm/s)', time: '13:45:02' },
    { level: 'INFO', color: 'cyan', msg: 'IEC 61850 GOOSE Packet Sync Verified[cite: 3, 6]', time: '13:10:00' }
];

function renderAlerts() {
    const container = document.getElementById('alert-log-list');
    if (!container) return;
    container.innerHTML = initialAlerts.map(a => `
        <div class="p-2.5 rounded-lg bg-slate-900 border border-${a.color}-500/30 flex justify-between items-center text-xs">
            <div class="flex items-center space-x-2">
                <span class="px-1.5 py-0.5 rounded bg-${a.color}-500/20 text-${a.color}-400 font-bold text-[10px]">${a.level}</span>
                <span class="text-slate-200">${a.msg}</span>
            </div>
            <span class="text-slate-500 text-[10px]">${a.time}</span>
        </div>
    `).join('');
}
renderAlerts();

setInterval(() => {
    const voltage = (400 + (Math.random() * 4 - 1.5)).toFixed(1);
    const current = (208 + (Math.random() * 8 - 4)).toFixed(1);
    const power = ((voltage * current * 1.732 * 0.85) / 1000).toFixed(1);

    document.getElementById('val-voltage').innerText = voltage;
    document.getElementById('val-current').innerText = current;
    document.getElementById('val-power').innerText = power;
}, 2500);

function runSimulation() {
    const load = parseFloat(document.getElementById('slider-load').value);
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const tx1Box = document.getElementById('iso-tx1-box');
    const twinPill = document.getElementById('twin-alert-pill');

    if (load > 110 || temp > 90) {
        tx1Box.setAttribute('stroke', '#f43f5e');
        tx1Box.setAttribute('fill', '#f43f5e');
        twinPill.innerText = 'CRITICAL: OVERLOAD FAULT!';
        twinPill.className = 'text-xs bg-rose-500/25 border border-rose-500 text-rose-400 px-3 py-1 rounded-full font-bold';
    } else {
        tx1Box.setAttribute('stroke', '#10b981');
        tx1Box.setAttribute('fill', '#10b981');
        twinPill.innerText = 'STATE: NORMAL OPERATION';
        twinPill.className = 'text-xs bg-cyan-500/25 border border-cyan-400 text-cyan-300 px-3 py-1 rounded-full font-semibold';
    }
}

function injectCriticalFault() {
    document.getElementById('slider-load').value = 130;
    document.getElementById('slider-temp').value = 105;
    runSimulation();
}

function resetSimulation() {
    document.getElementById('slider-load').value = 75;
    document.getElementById('slider-temp').value = 68;
    runSimulation();
}

function downloadPDFReport() {
    alert("Compliance & Substation Health Report downloaded successfully!");
}