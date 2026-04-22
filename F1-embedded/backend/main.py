from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any
import numpy as np

from data_service import fetch_thingspeak_data
from ml_service import ml_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-train models on mock/live data so dashboard works immediately
    print("Pre-training models on startup...")
    df = fetch_thingspeak_data(results=200)
    success = ml_engine.train_mock(df)
    if success:
        print("Models successfully pre-trained.")
    else:
        print("Model pre-training failed (insufficient data).")
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title="Vehicle Telemetry API", lifespan=lifespan)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified for now to rule out CORS as the cause of "Failed to fetch"
    allow_credentials=False, # Credentials must be False if using wildcard origin
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/data")
def get_data() -> Dict[str, Any]:
    """Returns the latest telemetry data points."""
    df = fetch_thingspeak_data(results=20)
    
    # Calculate acceleration magnitude for the frontend
    if not df.empty:
         df['acc_mag'] = np.sqrt(df['ax']**2 + df['ay']**2 + df['az']**2)
    else:
         df['acc_mag'] = []
         
    return {
        "status": "success",
        "data": df.to_dict(orient="records")
    }

@app.get("/metrics")
def get_metrics() -> Dict[str, Any]:
    """Returns aggregated ride performance metrics."""
    df = fetch_thingspeak_data(results=50) # Fetch more for aggregates
    
    if df.empty:
        return {
            "avg_rpm": 0.0,
            "max_rpm": 0.0,
            "avg_speed_kmh": 0.0,
            "efficiency_score": 0
        }

    avg_rpm = df['rpm'].mean()
    max_rpm = df['rpm'].max()
    avg_speed_kmh = df['speed_kmh'].mean()

    # Efficiency score based on jerk/smoothness
    acc_mag = np.sqrt(df['ax']**2 + df['ay']**2 + df['az']**2)
    jerk = acc_mag.diff().abs().mean()
    efficiency = max(0, min(100, 100 - (jerk * 5)))

    return {
        "avg_rpm": round(float(avg_rpm), 1),
        "max_rpm": round(float(max_rpm), 1),
        "avg_speed_kmh": round(float(avg_speed_kmh), 1),
        "efficiency_score": round(float(efficiency if not np.isnan(efficiency) else 100))
    }

@app.get("/ai")
def get_ai_insights() -> Dict[str, Any]:
    """Returns AI model predictions on latest data."""
    df = fetch_thingspeak_data(results=10)
    insights = ml_engine.get_insights(df)
    
    return {
        "driver_behavior": insights["behavior"],
        "anomaly_status": insights["anomaly_status"],
    }

@app.get("/predict")
def get_prediction() -> Dict[str, Any]:
    """Returns predicted next speed."""
    df = fetch_thingspeak_data(results=10)
    insights = ml_engine.get_insights(df)
    
    return {
        "predicted_speed": insights["predicted_speed"]
    }

@app.post("/train")
def trigger_training(background_tasks: BackgroundTasks):
    """Triggers model training using collected dataset."""
    def train_task():
        df = fetch_thingspeak_data(results=500)
        ml_engine.train_mock(df)
        print("Background training completed.")
            
    background_tasks.add_task(train_task)
    return {"status": "Training started in background"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
