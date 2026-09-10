class Car
{
    private readonly object _lock = new object();

    // charge rate in seconds
    int CHARGE_RATE = 5;
    private string rego;
    private int batteryLevel;
    private bool isCharging;
    private TimeOnly? scheduledStartTime;

    public Car(string rego)
    {
        this.rego = rego;
        this.batteryLevel = 100;
        this.isCharging = false;
    }

    public void StartCharging()
    {
        lock (_lock)
        {
            this.isCharging = true;
        }
    }

    public void StopCharging()
    {
        lock (_lock)
        {
            this.isCharging = false;
        }
    }

    public void IncrementBatteryLevel()
    {
        lock (_lock)
        {
            if (isCharging && batteryLevel < 100)
            {
                batteryLevel++;
            }
        }
    }

    public void DecrementBatteryLevel()
    {
        lock (_lock)
        {
            if (!isCharging && batteryLevel > 0)
            {
                batteryLevel--;
            }
        }
    }

    public string GetRego()
    
        { return rego; }
    



    public int GetBatteryLevel()
    {
        lock (_lock)
        {
            return batteryLevel;
        }
    }

    public bool GetIsCharging()
    {
        lock (_lock)
        {
            return isCharging;
        }
    }

    public void SetChargingStatus(bool status)
    {
        lock (_lock)
        {
            this.isCharging = status;
        }
    }

    public void SetScheduledStartTime(TimeOnly? time)
    {
        lock (_lock)
        {
            this.scheduledStartTime = time;
        }
    }

    public TimeOnly? GetScheduledStartTime()
    {
        lock (_lock)
        {
            return scheduledStartTime;
        }
    }
}