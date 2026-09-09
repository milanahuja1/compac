//TODO:
// add in POST endpoint to toggle charging state
// add in POST endpoint for battery scheduling
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Devices;
using Microsoft.Azure.Devices.Shared; 

public static class CarController
{
    private static readonly string iotHubConnectionString = Environment.GetEnvironmentVariable("IotHubConnectionString");
    private static readonly ServiceClient serviceClient = ServiceClient.CreateFromConnectionString(iotHubConnectionString);
    private static readonly RegistryManager registryManager = RegistryManager.CreateFromConnectionString(iotHubConnectionString);

    [Function("GetChargingStatus")]
    public static async Task<IActionResult> GetChargingStatus(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "car/{deviceId}/status")] HttpRequest req, 
        string deviceId)
    {
        try
        {
            var twin = await registryManager.GetTwinAsync(deviceId);
            if (twin == null)
            {
                return new NotFoundObjectResult(new { error = "Car not found" });
            }

            bool isCharging = false;
            
            
            if (twin.Properties.Desired.Contains("chargingStatus"))
            {
                isCharging = twin.Properties.Desired["chargingStatus"];
            }
            
            else if (twin.Properties.Reported.Contains("chargingStatus"))
            {
                isCharging = twin.Properties.Reported["chargingStatus"];
            }

            return new OkObjectResult(new { chargingStatus = isCharging });
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult(new { error = "Failed to communicate with IoT Hub", details = ex.Message });
        }
    }

    [Function("GetBatteryLevel")]
    public static async Task<IActionResult> GetBatteryLevel(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "car/{deviceId}/battery")] HttpRequest req, 
        string deviceId, FunctionContext executionContext)
  {
    try
    {
      var iotHubConnectionString = Environment.GetEnvironmentVariable("IotHubConnectionString");
      if (string.IsNullOrEmpty(iotHubConnectionString))
      {
        return new ObjectResult(new { error = "Server configuration error" }) { StatusCode = 500 };
      }
      using var registryManager = RegistryManager.CreateFromConnectionString(iotHubConnectionString);
      var twin = await registryManager.GetTwinAsync(deviceId);
      if (twin == null){
        return new NotFoundObjectResult(new { error = "Car not found" });
      }
      int batteryLevel = -1;
      if (twin.Properties.Reported.Contains("batteryLevel"))
        {
        batteryLevel = twin.Properties.Reported["batteryLevel"];
        }
        return new OkObjectResult(new { batteryLevel = batteryLevel });

      } catch (Exception ex)
      {
        return new ObjectResult(new { error = "Failed to communicate with IoT Hub", details = ex.Message }) { StatusCode = 500 };
      }
    }

    [Function("ToggleCharging")]
    public static async Task<IActionResult> ToggleCharging(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "car/{deviceId}/toggleCharging/{isCharging:bool}")] HttpRequest req, 
        string deviceId, 
        bool isCharging)
    {
        try
        {
            // Select the Direct Method name based on the boolean passed in the URL
            string methodName = isCharging ? "StartCharging" : "StopCharging";

            var methodInvocation = new CloudToDeviceMethod(methodName)
            {
                ResponseTimeout = TimeSpan.FromSeconds(30)
            };

    
            var response = await serviceClient.InvokeDeviceMethodAsync(deviceId, methodInvocation);

            if (response.Status == 200)
            {
                return new OkObjectResult(new 
                { 
                    success = true, 
                    chargingStatus = isCharging,
                    deviceResponse = response.GetPayloadAsJson() 
                });
            }

            return new ObjectResult(new 
            { 
                error = "Device returned an unsuccessful status code", 
                statusCode = response.Status 
            }) { StatusCode = response.Status };
        }
        catch (Exception ex)
        {
            return new ObjectResult(new { error = "Failed to communicate with IoT Hub", details = ex.Message }) 
            { 
                StatusCode = 500 
            };
        }
    }
  }
