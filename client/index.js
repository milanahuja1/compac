//const baseUrl = "https://carapi-bubsbkembycqg9ed.australiaeast-01.azurewebsites.net";
const baseUrl = "http://localhost:7071"
const button = document.getElementById("chargingButton");
const chargingStatusLabel = document.getElementById("chargingStatusLabel");
const batteryLevelLabel = document.getElementById("batteryLevelLabel");
button.addEventListener("click", () => {button.textContent = "Charging";});
const deviceId = "C5MCB";
getCarChargingStatus(deviceId);
getCarBatteryLevel(deviceId);

setInterval(() => {
    getCarChargingStatus(deviceId);
    getCarBatteryLevel(deviceId);
    
}, 3000);

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
    }}

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
