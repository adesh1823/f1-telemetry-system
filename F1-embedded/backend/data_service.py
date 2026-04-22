from datetime import datetime
import os
import pandas as pd
import requests

# Can be overridden via environment variables (set as HF Space secrets)
THINGSPEAK_CHANNEL_ID = os.environ.get("THINGSPEAK_CHANNEL_ID", "3352043")
THINGSPEAK_READ_KEY = os.environ.get("THINGSPEAK_READ_KEY", "2LNNU8X6OAW22BHE")

# In-memory mock data array for when real API fails or isn't configured
mock_data_store = []
mock_time_counter = datetime.now().timestamp()

def generate_mock_data(limit=10):
    """Generates mock telemetry data to ensure the UI works out-of-the-box."""
    global mock_time_counter
    import random
    import math
    
    data = []
    for _ in range(limit):
        # Sine wave base for speed + random noise
        base_speed = 60 + 20 * math.sin(mock_time_counter / 100)
        speed = max(0, min(200, base_speed + random.uniform(-5, 5)))
        
        # Determine acceleration based on speed change
        # Mock simple ax, ay, az
        ax = random.uniform(-2, 2)
        ay = random.uniform(-1, 1)
        az = random.uniform(9.0, 10.5) # gravity is 9.8
        
        temperature = random.uniform(25.0, 45.0)
        
        data.append({
            "created_at": datetime.fromtimestamp(mock_time_counter).isoformat() + "Z",
            "field1": str(temperature),
            "field2": "50.0", # humidity
            "field3": str(ay),
            "field4": str(ax),
            "field5": str(az),
            "field6": str(speed), # using speed mapped to RPM slot
            "field7": "1", # lapCount
            "field8": str(80.0 + random.uniform(-2, 2)) # tireTemp
        })
        mock_time_counter += 15 # 15 seconds per interval
        
    return data

def fetch_thingspeak_data(results=100) -> pd.DataFrame:
    """Fetches data from ThingSpeak. Falls back to mock data if not configured or failed."""
    API_URL = f"https://api.thingspeak.com/channels/{THINGSPEAK_CHANNEL_ID}/feeds.json"
    params = {"results": results}
    if THINGSPEAK_READ_KEY:
        params["api_key"] = THINGSPEAK_READ_KEY
    
    use_mock = (THINGSPEAK_CHANNEL_ID == "YOUR_CHANNEL_ID_HERE" or THINGSPEAK_CHANNEL_ID == "")
    
    if not use_mock:
        try:
            response = requests.get(API_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json().get("feeds", [])
            if not data:
                 use_mock = True
        except Exception as e:
            print("ThingSpeak fetch failed, falling back to mock. Error:", e)
            use_mock = True
            
    if use_mock:
        data = generate_mock_data(results)

    df = pd.DataFrame(data)
    
    if df.empty:
        return pd.DataFrame(columns=["timestamp", "speed", "ax", "ay", "az", "temperature", "humidity", "lap_count", "tire_temp"])
        
    # Map fields according to ESP32 code:
    # 1: temperature, 2: humidity, 3: latG (ay), 4: lonG (ax), 5: vertG (az), 6: RPM, 7: speedKmh
    rename_map = {
        "created_at": "timestamp",
        "field1": "temperature",
        "field2": "humidity",
        "field3": "ay",
        "field4": "ax",
        "field5": "az",
        "field6": "rpm",
        "field7": "speed_kmh"
    }
    df = df.rename(columns=rename_map)
    # Filter to only the columns we expect (some mock/initial points might lack them)
    expected_cols = ["timestamp", "temperature", "humidity", "ay", "ax", "az", "rpm", "speed_kmh"]
    for col in expected_cols:
        if col not in df.columns:
            df[col] = 0.0

    df = df[expected_cols]
    
    # Convert types
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    for col in expected_cols[1:]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        
    # Handle missing values by forward filling then backward filling
    df = df.ffill().bfill()
    df = df.fillna(0) # any remaining NaNs become 0
    
    return df
