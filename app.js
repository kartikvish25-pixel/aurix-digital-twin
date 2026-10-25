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
}

// Chart Initializations
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
        datasets: [{ label: 'Failure Probability (%)', data: [5, 7, 9, 12, 14, 15, 18], borderColor: '#f59e0b', fill: true }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const ctxRul = document.getElementById('rulChart').getContext('2d');
const rulChart = new Chart(ctxRul, {
    type: 'line',
    data: {
        labels: ['Now', '+30d', '+60d', '+90d', '+120d', '+150d', '+180d'],
        datasets: [{ label: 'Asset Health (%)', data: [92, 86, 79, 71, 62, 50, 38], borderColor: '#10b981', fill: true }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Alert Logs
const initialAlerts = [
    { level: 'INFO', color: 'cyan', msg: 'Firebase Cloud: Worker ID Substation_Exec_01 authenticated.', time: '14:30:00' },
    { level: 'INFO', color: 'emerald', msg: 'ML Bot active: Monitoring real-time sensor streams.', time: '14:30:05' }
];

function renderAlerts() {
    const container = document.getElementById('alert-log-list');
    if (!container) return;
    container.innerHTML = initialAlerts.map(a => `
        <div class="p-3 rounded-xl bg-slate-900 border border-${a.color}-500/30 flex justify-between items-center text-sm">
            <div class="flex items-center space-x-3">
                <span class="px-2 py-1 rounded bg-${a.color}-500/20 text-${a.color}-400 font-bold text-xs">${a.level}</span>
                <span class="text-slate-200">${a.msg}</span>
            </div>
            <span class="text-slate-500 text-xs">${a.time}</span>
        </div>
    `).join('');
}
renderAlerts();

// Manual Problem Trigger Buttons
function triggerProblem(type) {
    const reportBox = document.getElementById('bot-report-box');
    const badge = document.getElementById('bot-status-badge');
    const time = new Date().toLocaleTimeString();

    if (type === 'oil_leak') {
        badge.className = "text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full border border-rose-500/40 animate-pulse";
        badge.innerText = "CRITICAL: OIL LEAK DETECTED!";
        reportBox.innerHTML = `
            <div class="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 text-rose-200 space-y-2">
                <p class="font-bold text-rose-400">ML Bot Alert [${time}]: Oil level dropped to 38%!</p>
                <p><strong>Problem:</strong> Transformer oil leakage detected via Firebase Cloud sensor threshold check[cite: 3].</p>
                <p><strong>Solution:</strong> Isolate Transformer TX-1, inspect valves, and top up dielectric insulating oil.</p>
            </div>
        `;
        initialAlerts.unshift({ level: 'CRITICAL', color: 'rose', msg: 'ML Bot: Oil leakage detected in TX-1.', time: time });
    } else if (type === 'high_temp') {
        badge.className = "text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/40 animate-pulse";
        badge.innerText = "WARNING: THERMAL SPIKE!";
        reportBox.innerHTML = `
            <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 text-amber-200 space-y-2">
                <p class="font-bold text-amber-400">ML Bot Alert [${time}]: Temperature reached 94.5 °C!</p>
                <p><strong>Problem:</strong> Thermal overload exceeding threshold limits.</p>
                <p><strong>Solution:</strong> Turn on auxiliary cooling fans and distribute load.</p>
            </div>
        `;
        initialAlerts.unshift({ level: 'WARNING', color: 'amber', msg: 'ML Bot: High temperature thermal spike observed.', time: time });
    } else if (type === 'wire_melt') {
        badge.className = "text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/40 animate-pulse";
        badge.innerText = "CRITICAL: WIRE RESISTANCE HIGH!";
        reportBox.innerHTML = `
            <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-500/50 text-purple-200 space-y-2">
                <p class="font-bold text-purple-400">ML Bot Alert [${time}]: High resistance heating detected!</p>
                <p><strong>Problem:</strong> Terminal connection resistance increased, causing wire heating and melting risk[cite: 3].</p>
                <p><strong>Solution:</strong> Cut power to feeder line, tighten loose clamps, and replace insulation wiring.</p>
            </div>
        `;
        initialAlerts.unshift({ level: 'CRITICAL', color: 'purple', msg: 'ML Bot: Wire resistance/melting risk detected.', time: time });
    }
    renderAlerts();
}

function runSimulation() {
    const load = document.getElementById('slider-load').value;
    document.getElementById('val-voltage').innerText = (400 + (load * 0.05)).toFixed(1);
}

function injectCriticalFault() {
    document.getElementById('slider-load').value = 130;
    runSimulation();
    initialAlerts.unshift({ level: 'CRITICAL', color: 'rose', msg: 'Manual Overload Fault Injected via Simulation!', time: new Date().toLocaleTimeString() });
    renderAlerts();
}

function resetSimulation() {
    document.getElementById('slider-load').value = 75;
    runSimulation();
}

function downloadPDFReport() {
    alert("Compliance & Firebase Health Report generated successfully!");
}