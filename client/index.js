const baseUrl = "https://carapi-bubsbkembycqg9ed.australiaeast-01.azurewebsites.net";
//const baseUrl = "http://localhost:7071";
const deviceId = "FWD899";

// DOM Elements
const chargingButton = document.getElementById("batteryToggleButton");
const chargingStatusLabel = document.getElementById("chargingStatusLabel");
const batteryLevelLabel = document.getElementById("batteryLevelLabel");
const scheduleHourInput = document.getElementById("scheduleHourInput");
const scheduleMinuteInput = document.getElementById("scheduleMinuteInput");
const saveScheduleButton = document.getElementById("saveScheduleButton");
const scheduleStatusLabel = document.getElementById("scheduleStatusLabel");


let isCharging = false;

// initiall data fetch and polling setup
fetchInitialStatus();
getCarChargingStatus(deviceId);
getCarBatteryLevel(deviceId);
populateTimeDropdowns();
getCarChargingSchedule(deviceId);

setInterval(() => {
    getCarChargingStatus(deviceId);
    getCarBatteryLevel(deviceId);
}, 3000);

async function fetchInitialStatus() {
    try {
        
        const response = await fetch(`${baseUrl}/api/car/${deviceId}/status`);
        const data = await response.json();
        
        if (response.ok) {
            isCharging = data.chargingStatus;
            updateButtonUI();
        }
    } catch (error) {
        console.error('Failed to fetch initial charging status:', error);
    }
}

function updateButtonUI() {
    if (isCharging) {
        chargingButton.textContent = 'Stop Charging';
    } else {
        chargingButton.textContent = 'Start Charging';
    }
}
saveScheduleButton.addEventListener("click", async () => {
    // cmbine the values  dropdowns into time format
    const scheduleTime = `${scheduleHourInput.value}:${scheduleMinuteInput.value}`;

    try {
        saveScheduleButton.disabled = true;
        saveScheduleButton.textContent = "Saving...";

        const response = await fetch(`${baseUrl}/api/car/${deviceId}/schedule`, {
            method: 'PATCH', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scheduleTime: scheduleTime
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            scheduleStatusLabel.textContent = `Schedule saved for ${scheduleTime}!`;
            scheduleStatusLabel.style.color = "green";
        } else {
            throw new Error(result.error || "Failed to save schedule");
        }
    } catch (error) {
        console.error("Error setting schedule:", error);
        scheduleStatusLabel.textContent = "Error saving schedule.";
        scheduleStatusLabel.style.color = "red";
    } finally {
        saveScheduleButton.disabled = false;
        saveScheduleButton.textContent = "Save Schedule";
    }
});

chargingButton.addEventListener('click', async () => {
    const targetState = !isCharging;

    try {
        chargingButton.disabled = true; 
        chargingButton.textContent = 'Updating...';

        const response = await fetch(`${baseUrl}/api/car/${deviceId}/toggleCharging/${targetState}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            isCharging = targetState; 
        } else {
            console.error('Failed to toggle charging:', result.error);
        }
    } catch (error) {
        console.error('Network error while toggling charging:', error);
    } finally {
        chargingButton.disabled = false;
        updateButtonUI(); 
    }
});

async function getCarChargingStatus(deviceId) {
    const apiUrl = `${baseUrl}/api/car/${deviceId}/status`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        
        chargingStatusLabel.textContent = data.chargingStatus ? "Currently Charging" : "Not Charging";
        
        return data.chargingStatus;

    } catch (error) {
        console.error("Failed to fetch charging status:", error);
        chargingStatusLabel.textContent = "Error fetching status";
        return null;
    }
}

async function getCarBatteryLevel(id) {
    const apiUrl = `${baseUrl}/api/car/${id}/battery`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        
        batteryLevelLabel.textContent = `${data.batteryLevel}%`;
        
        return data.batteryLevel;

    } catch (error) {
        console.error("Failed to fetch battery level:", error);
        batteryLevelLabel.textContent = "Error";
        return null;
    }}
    function populateTimeDropdowns() {
    
    for (let i = 0; i < 24; i++) {
        const hourStr = String(i).padStart(2, '0');
        const option = document.createElement('option');
        option.value = hourStr;
        option.textContent = hourStr;
        scheduleHourInput.appendChild(option);
    }

    
    for (let i = 0; i < 60; i += 5) {
        const minStr = String(i).padStart(2, '0');
        const option = document.createElement('option');
        option.value = minStr;
        option.textContent = minStr;
        scheduleMinuteInput.appendChild(option);
    }}


    async function getCarChargingSchedule(id) {
    const apiUrl = `${baseUrl}/api/car/${id}/schedule`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        
        
        if (data.scheduleTime) {
            // 
            const parts = data.scheduleTime.split(':');
            if (parts.length >= 2) {
                scheduleHourInput.value = parts[0];
                scheduleMinuteInput.value = parts[1];
            }
            scheduleStatusLabel.textContent = `Active schedule: ${parts[0]}:${parts[1]}`;
            scheduleStatusLabel.style.color = "green";
        } else {
            scheduleStatusLabel.textContent = "No active schedule set.";
            scheduleStatusLabel.style.color = "gray";
        }
        
        return data.scheduleTime;

    } catch (error) {
        console.error("Failed to fetch schedule:", error);
        scheduleStatusLabel.textContent = "Error loading schedule";
        scheduleStatusLabel.style.color = "red";
        return null;
    }
}

