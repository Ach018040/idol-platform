import pandas as pd
from sklearn.linear_model import LogisticRegression
import json

# Load exported emotion_logs CSV
# You should export from Supabase to CSV first

df = pd.read_csv("emotion_logs.csv")

# Feature engineering
X = df[["energy", "pleasantness", "risk_score"]]

y = (df["risk_level"] == "high").astype(int)

# Train model
model = LogisticRegression()
model.fit(X, y)

# Save model weights
model_data = {
    "coef": model.coef_.tolist(),
    "intercept": model.intercept_.tolist()
}

with open("fan_risk_model.json", "w") as f:
    json.dump(model_data, f)

print("Model trained and saved.")
