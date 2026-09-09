// See https://aka.ms/new-console-template for more information
using Microsoft.Azure.Devices.Client;
using System.Text;
using Microsoft.Azure.Devices.Shared;
using Microsoft.Extensions.Configuration;
class Program
{
  private static Car car;
    private static DeviceClient deviceClient;
    private static string connectionString;
    static async Task Main(string[] args)
    {
    var configuration = new ConfigurationBuilder()
      .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), ".."))
      .AddJsonFile("secrets.json", optional: false, reloadOnChange: true)
      .Build();


    string connectionString = configuration["IoTHubConnectionString"];


        car = new Car("FWD899");
        deviceClient = DeviceClient.CreateFromConnectionString(connectionString, TransportType.Mqtt);
        
        await deviceClient.SetMethodHandlerAsync("StartCharging", HandleStartCharging, null);
        await deviceClient.SetMethodHandlerAsync("StopCharging", HandleStopCharging, null);

        _ = Task.Run(async () =>
{
    while (true)
    {
        try
        {
          
                if (car.GetIsCharging() && car.GetBatteryLevel() < 100)
                {
                    car.IncrementBatteryLevel();
                    Console.WriteLine($"Car {car.GetRego()} is charging. Battery level: {car.GetBatteryLevel()}%");
                }
                else if (!car.GetIsCharging() && car.GetBatteryLevel() > 0)
                {
                    car.DecrementBatteryLevel();
                    Console.WriteLine($"Car {car.GetRego()} is discharging. Battery level: {car.GetBatteryLevel()}%");
                }
            

            //  sync  updated state to azure twin.
            var reportedProperties = new TwinCollection();
            reportedProperties["chargingStatus"] = car.GetIsCharging(); 
            reportedProperties["batteryLevel"] = car.GetBatteryLevel();

            await deviceClient.UpdateReportedPropertiesAsync(reportedProperties);
            Console.WriteLine($"[Sync] Battery: {car.GetBatteryLevel()}% | Charging: {car.GetIsCharging()}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error syncing twin: {ex.Message}");
        }

        //loop every 5 seconds
        await Task.Delay(5000); 
    }
});
_ = Task.Run(async () =>
{
    Console.WriteLine("\n=== Simulator Started ===");
    Console.WriteLine("Type 'start', 'stop', or 'exit' and press Enter.\n");
    
    while (true)
    {
        
        Console.Write("> ");
        string input = Console.ReadLine()?.Trim().ToLower();

        if (input == "start")
        {
            await SetAndSyncChargingStateAsync(true);
            Console.WriteLine("[Command] Started charging.");
        }
        else if (input == "stop")
        {
            await SetAndSyncChargingStateAsync(false);
            Console.WriteLine("[Command] Stopped charging.");
        }
        else if (input == "exit")
        {
            Environment.Exit(0);
        }
        else if (!string.IsNullOrEmpty(input))
        {
            Console.WriteLine($"Unknown command: '{input}'");
        }
    }
});

        await Task.Delay(-1);

    }

    private static async Task SetAndSyncChargingStateAsync(bool isCharging)
{
    
    if (isCharging)
    {
        car.StartCharging();
    }
    else
    {
        car.StopCharging();
    }

    
    try
    {
        var reportedProperties = new TwinCollection();
        reportedProperties["chargingStatus"] = isCharging;
        reportedProperties["batteryLevel"] = car.GetBatteryLevel();
        
        await deviceClient.UpdateReportedPropertiesAsync(reportedProperties);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"\n[Error] Failed to sync to Azure: {ex.Message}");
    }
}
private static async Task<MethodResponse> HandleStartCharging(MethodRequest methodRequest, object userContext)
{
    await SetAndSyncChargingStateAsync(true);

    byte[] responseBytes = Encoding.UTF8.GetBytes("{\"status\": \"success\"}");
    return new MethodResponse(responseBytes, 200);
}

private static async Task<MethodResponse> HandleStopCharging(MethodRequest methodRequest, object userContext)
{
    await SetAndSyncChargingStateAsync(false);

    byte[] responseBytes = Encoding.UTF8.GetBytes("{\"status\": \"success\"}");
    return new MethodResponse(responseBytes, 200);
}

}
