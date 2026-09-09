//const baseUrl = "https://carapi-bubsbkembycqg9ed.australiaeast-01.azurewebsites.net";
const baseUrl = "http://localhost:7071";
const deviceId = "FWD899";

// DOM Elements
const chargingButton = document.getElementById("batteryToggleButton");
const chargingStatusLabel = document.getElementById("chargingStatusLabel");
const batteryLevelLabel = document.getElementById("batteryLevelLabel");


let isCharging = false;

// initiall data fetch and polling setup
fetchInitialStatus();
getCarChargingStatus(deviceId);
getCarBatteryLevel(deviceId);

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
    }
}