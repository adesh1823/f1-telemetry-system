import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Input, LSTM
import os

# Suppress annoying TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

class MLEngine:
    def __init__(self):
        self.classification_model = None
        self.anomaly_model = None
        self.prediction_model = None
        self.feature_means = None
        self.feature_stds = None
        
        # Try to build models (will have random weights until trained)
        self._build_models()
        self.is_trained = False
        
    def _build_models(self):
        # 1. Driver Behavior Classification (Input: 7 features, Output: 3 classes)
        # Features: speed_mean, speed_std, ax_mean, ay_mean, az_mean, acc_mag_mean, jerk
        self.classification_model = Sequential([
            Input(shape=(7,)),
            Dense(32, activation='relu'),
            Dense(16, activation='relu'),
            Dense(3, activation='softmax')
        ])
        self.classification_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        
        # 2. Anomaly Detection (Autoencoder, Input: 7 features)
        anomaly_input = Input(shape=(7,))
        encoded = Dense(4, activation='relu')(anomaly_input)
        decoded = Dense(7, activation='linear')(encoded)
        self.anomaly_model = Model(anomaly_input, decoded)
        self.anomaly_model.compile(optimizer='adam', loss='mse')
        
        # 3. Speed Prediction (Dense, Input: last 5 speed values)
        self.prediction_model = Sequential([
            Input(shape=(5,)),
            Dense(16, activation='relu'),
            Dense(8, activation='relu'),
            Dense(1)
        ])
        self.prediction_model.compile(optimizer='adam', loss='mse')

    def engineer_features(self, df: pd.DataFrame, window_size=5) -> pd.DataFrame:
        """Computes derived features using a sliding window."""
        if len(df) < window_size:
            return pd.DataFrame()
            
        features = []
        for i in range(len(df) - window_size + 1):
            window = df.iloc[i : i + window_size]
            
            acc_mag = np.sqrt(window['ax']**2 + window['ay']**2 + window['az']**2)
            
            f = {
                'timestamp': window.iloc[-1]['timestamp'],  # attach to the final timestamp
                'speed_mean': window['rpm'].mean(),
                'speed_max': window['rpm'].max(),
                'speed_std': window['rpm'].std(),
                'ax_mean': window['ax'].mean(),
                'ay_mean': window['ay'].mean(),
                'az_mean': window['az'].mean(),
                'acc_mag_mean': acc_mag.mean(),
                'jerk': acc_mag.diff().fillna(0).mean(),
                'braking_events': (window['ax'] < -1.0).sum(),  # rough threshold
                'last_speed': window.iloc[-1]['rpm']
            }
            # Keep past 5 speeds for prediction
            for j in range(5):
                f[f'speed_t-{4-j}'] = window.iloc[j]['rpm'] if j < len(window) else 0

            features.append(f)
            
        return pd.DataFrame(features)

    def generate_labels(self, df_features: pd.DataFrame) -> pd.DataFrame:
        """Rules-based labeling for mock training data."""
        labels = []
        for _, row in df_features.iterrows():
            if row['braking_events'] > 2 or row['jerk'] < -3:
                labels.append([0, 0, 1])  # Braking
            elif row['acc_mag_mean'] > 12 or row['speed_std'] > 10:
                labels.append([0, 1, 0])  # Aggressive
            else:
                labels.append([1, 0, 0])  # Smooth
        
        # Add columns for smooth, aggressive, braking as one-hot
        y = np.array(labels)
        df_labels = pd.DataFrame(y, columns=['lbl_smooth', 'lbl_aggressive', 'lbl_braking'])
        return pd.concat([df_features.reset_index(drop=True), df_labels], axis=1)

    def train_mock(self, df_raw: pd.DataFrame):
        """Train models on fetched data to ensure they work out of the box."""
        df_feat = self.engineer_features(df_raw, window_size=5)
        if len(df_feat) < 10:
            return False # Not enough data
            
        df_labeled = self.generate_labels(df_feat)
        
        feature_cols = ['speed_mean', 'speed_std', 'ax_mean', 'ay_mean', 'az_mean', 'acc_mag_mean', 'jerk']
        X = df_labeled[feature_cols].values.astype(np.float32)
        X = np.nan_to_num(X)
        
        # Normalize
        self.feature_means = X.mean(axis=0)
        self.feature_stds = X.std(axis=0) + 1e-8
        X_norm = (X - self.feature_means) / self.feature_stds
        
        y_class = df_labeled[['lbl_smooth', 'lbl_aggressive', 'lbl_braking']].values
        
        # 1. Train Classification
        self.classification_model.fit(X_norm, y_class, epochs=10, batch_size=8, verbose=0)
        
        # 2. Train Anomaly Autoencoder (using smooth data as 'normal')
        smooth_mask = df_labeled['lbl_smooth'] == 1
        X_normal = X_norm[smooth_mask]
        if len(X_normal) > 5:
            self.anomaly_model.fit(X_normal, X_normal, epochs=10, batch_size=8, verbose=0)
            
        # 3. Train Speed Prediction
        speed_cols = [f'speed_t-{i}' for i in range(4, 0, -1)] + ['last_speed'] # 5 columns
        X_speed = df_labeled[speed_cols].values
        
        # Target: shift speeds by 1 (next speed)
        # For simplicity in mock, predict next speed by just using the current shifted window
        y_speed = np.roll(df_labeled['last_speed'].values, -1)
        y_speed[-1] = y_speed[-2] # fix last element
        
        self.prediction_model.fit(X_speed, y_speed, epochs=10, batch_size=8, verbose=0)
        
        self.is_trained = True
        return True
        
    def get_insights(self, df_raw: pd.DataFrame):
        """Run ML predictions on the latest data sequence."""
        if not self.is_trained or len(df_raw) < 5:
            return {
                "behavior": "Unknown",
                "anomaly_status": "Normal",
                "predicted_speed": 0.0
            }
            
        # Get latest window
        df_window = df_raw.tail(5)
        df_feat = self.engineer_features(df_window, window_size=5)
        
        if df_feat.empty:
            return {"behavior": "Unknown", "anomaly_status": "Normal", "predicted_speed": 0.0}
            
        latest_features = df_feat.iloc[-1]
        
        feature_cols = ['speed_mean', 'speed_std', 'ax_mean', 'ay_mean', 'az_mean', 'acc_mag_mean', 'jerk']
        X = latest_features[feature_cols].values.reshape(1, -1).astype(np.float32)
        X = np.nan_to_num(X)
        X_norm = (X - self.feature_means) / self.feature_stds
        
        # Behavior Prediction
        pred_class = self.classification_model.predict(X_norm, verbose=0)[0]
        classes = ["Smooth", "Aggressive", "Braking"]
        behavior = classes[np.argmax(pred_class)]
        
        # Anomaly Detection
        reconstructed = self.anomaly_model.predict(X_norm, verbose=0)
        mse = np.mean(np.power(X_norm - reconstructed, 2))
        anomaly_threshold = 2.0 # Arbitrary for mock
        anomaly_status = "Critical" if mse > anomaly_threshold else "Normal"
        
        # Speed Prediction
        speed_cols = [f'speed_t-{i}' for i in range(4, -1, -1)]
        speeds = []
        for col in speed_cols:
             val = latest_features[col] if col in latest_features else latest_features.get('last_speed', 0)
             speeds.append(val)
        X_speed = np.array(speeds).reshape(1, -1)
        # Fallback due to missing columns in generic feature gen
        X_speed = np.array([df_window['rpm'].values]).reshape(1, 5).astype(np.float32)
        
        pred_speed = self.prediction_model.predict(X_speed, verbose=0)[0][0]
        pred_speed = max(0.0, float(pred_speed))
        
        return {
            "behavior": behavior,
            "anomaly_status": anomaly_status,
            "predicted_speed": round(pred_speed, 1),
            "reconstruction_error": float(mse)
        }

ml_engine = MLEngine()
