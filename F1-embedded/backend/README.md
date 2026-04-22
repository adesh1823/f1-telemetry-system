---
title: F1 Telemetry Backend
emoji: 🏎️
colorFrom: blue
colorTo: red
sdk: docker
pinned: false
app_port: 7860
---

# F1 Telemetry Backend API

FastAPI backend for the F1 Embedded Telemetry System.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/data` | Latest raw telemetry from ThingSpeak |
| GET | `/metrics` | Aggregated RPM, speed & efficiency stats |
| GET | `/ai` | Neural driver behaviour classification |
| GET | `/predict` | Predicted next RPM value |
| POST | `/train` | Re-train models in background |

## Data Source

Live data is fetched from **ThingSpeak channel 3352043** via the public REST API.
The ESP32 microcontroller publishes the following fields every 15 s:

| Field | Sensor | Unit |
|-------|--------|------|
| field1 | DHT22 Temperature | °C |
| field2 | DHT22 Humidity | % |
| field3 | MPU6050 Lateral G (ay) | G |
| field4 | MPU6050 Longitudinal G (ax) | G |
| field5 | MPU6050 Vertical G (az) | G |
| field6 | Hall Effect RPM | RPM |
| field7 | Calculated Speed | km/h |

## Environment Variables

Set the following secrets in the HF Space settings if the ThingSpeak channel is private:

```
THINGSPEAK_READ_KEY=your_read_api_key
```
