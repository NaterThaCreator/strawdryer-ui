// control.js - FORCE SEND VERSION

const WORKER_URL = "https://rapid-star-f817.fieldsnathanj.workers.dev"; 

// --- UI Elements ---
const blades = document.getElementById('fanBlades');
const label = document.getElementById('statusLabel');
const workerDot = document.getElementById('workerDot'); 
const deviceDot = document.getElementById('deviceDot'); 
const timeReadout = document.getElementById('timeReadout'); 
const slider = document.getElementById('slider'); 
let countdownInterval = null;
let timeLeftSeconds = 0;

// 1. Worker Health Check
function pollWorkerHealth() {
    fetch(WORKER_URL + '?command=HEALTH_CHECK') 
        .then(r => r.ok ? workerDot.classList.add('connected') : workerDot.classList.remove('connected'))
        .catch(() => workerDot.classList.remove('connected'));
}

// 2. ESP32 Status Check (Visual Only - Won't block buttons)
function pollDeviceStatus() {
    fetch(WORKER_URL + '?command=GET_STATUS') 
        .then(r => r.json())
        .then(data => {
            if (data.value === "ONLINE") {
                deviceDot.classList.add('connected');
                if (label.innerText === "DEVICE OFFLINE") setStandbyUI();
            } else {
                deviceDot.classList.remove('connected');
            }
        })
        .catch(() => deviceDot.classList.remove('connected'));
}

// 3. Command Sender - NO SAFETY LOCKS
function sendCommand(command) {
    // We send the command NO MATTER WHAT the dots say.
    const fetchURL = `${WORKER_URL}?command=${command}`;
    
    label.innerText = `SENDING ${command}...`;
    label.style.color = "var(--primary)";

    fetch(fetchURL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        })
        .then(() => {
            if (command === 'ON') {
                setRunningUI(parseInt(slider.value));
            } else {
                setStandbyUI();
            }
        })
        .catch(error => {
            label.innerText = "SEND FAILED";
            label.style.color = "var(--danger)";
            stopCountdown();
        });
}

// 4. UI Logic
function setRunningUI(durationMinutes) {
    blades.classList.add('spinning');
    label.innerText = "SYSTEM ENGAGED";
    label.style.color = "var(--primary)";
    timeLeftSeconds = durationMinutes * 60;
    startCountdown();
}

function setStandbyUI() {
    blades.classList.remove('spinning');
    label.innerText = "SYSTEM STANDBY";
    label.style.color = "var(--text)";
    stopCountdown();
    timeReadout.innerText = parseInt(slider.value) + "m";
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        timeLeftSeconds--;
        if (timeLeftSeconds <= 0) {
            sendCommand('OFF'); 
            return;
        }
        const m = Math.floor(timeLeftSeconds / 60);
        const s = timeLeftSeconds % 60;
        label.innerText = `ENGAGED - ${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
}

// 5. Init
setInterval(pollWorkerHealth, 5000);   
setInterval(pollDeviceStatus, 5000);   
document.addEventListener('DOMContentLoaded', () => {
    pollWorkerHealth(); 
    pollDeviceStatus();
    setStandbyUI();
});
