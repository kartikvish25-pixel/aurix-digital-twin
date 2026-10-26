import numpy as np
import random
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, IsolationForest

class SubstationDigitalTwinAI:
    def __init__(self):
        self.rul_model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.anomaly_model = IsolationForest(contamination=0.1, random_state=42)
        self._train_initial_models()

    def _train_initial_models(self):
        np.random.seed(42)
        n_samples = 600

        load = np.random.uniform(40, 140, n_samples)
        temp = np.random.uniform(45, 115, n_samples)
        thd = np.random.uniform(1.0, 15.0, n_samples)
        vibration = np.random.uniform(2.0, 18.0, n_samples)

        X = np.column_stack((load, temp, thd, vibration))

        risk_target = np.clip(
            (load - 50) * 0.45 + (temp - 55) * 1.15 + (thd * 2.1) + (vibration * 1.2),
            2.0, 99.0
        )

        self.rul_model.fit(X, risk_target)
        self.anomaly_model.fit(X)

    def get_live_scada_telemetry(self):
        voltage = round(random.uniform(398.5, 403.5), 1)
        current = round(random.uniform(204.0, 218.0), 1)
        pf = round(random.uniform(0.84, 0.89), 2)
        freq = round(random.uniform(49.94, 50.05), 2)
        power = round((voltage * current * 1.732 * pf) / 1000, 1)

        load_pct = round(random.uniform(70, 80), 1)
        oil_temp = round(random.uniform(64, 72), 1)
        thd = round(random.uniform(2.0, 3.2), 1)

        ai_metrics = self.predict_health(load_pct, oil_temp, thd)

        return {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "scada": {
                "voltage_kv": voltage,
                "current_a": current,
                "power_mw": power,
                "power_factor": pf,
                "frequency_hz": freq
            },
            "ai_predictions": ai_metrics
        }

    def predict_health(self, load_pct: float, oil_temp: float, thd: float):
        vibration = round(3.0 + (load_pct * 0.04) + (thd * 0.6), 2)
        features = np.array([[load_pct, oil_temp, thd, vibration]])

        failure_prob = float(np.clip(self.rul_model.predict(features)[0], 2.0, 99.0))
        failure_prob = round(failure_prob, 1)

        is_anomaly = int(self.anomaly_model.predict(features)[0]) == -1

        rul_days = max(3, int(225 - (failure_prob * 2.15)))
        health_index = max(12, int(100 - (failure_prob * 0.78)))
        hotspot_temp = round(oil_temp + (load_pct * 0.16) + (thd * 0.85), 1)

        if oil_temp >= 90 or failure_prob > 70:
            fault_class = "Thermal Overload / DGA Gas Spike (TX-1)"
            severity = "CRITICAL"
            action = "Trigger CB-1 Auto-Trip & Activate Standby Cooling Bank"
        elif thd >= 7.0 or load_pct >= 105:
            fault_class = "Harmonic Resonance / Core Saturation"
            severity = "WARNING"
            action = "Switch Capacitor Bank & Inspect Breaker B2 Contacts"
        elif is_anomaly:
            fault_class = "Minor Telemetry Drift Detected"
            severity = "WARNING"
            action = "Schedule Predictive Diagnostic Check"
        else:
            fault_class = "Normal Operating State"
            severity = "NORMAL"
            action = "No Immediate Maintenance Required"

        return {
            "hotspot_temp_c": hotspot_temp,
            "failure_prob_pct": failure_prob,
            "rul_days": rul_days,
            "health_index_pct": health_index,
            "is_anomaly": is_anomaly,
            "fault_classification": fault_class,
            "severity": severity,
            "recommended_action": action
        }

ai_engine = SubstationDigitalTwinAI()