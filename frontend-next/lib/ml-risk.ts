// Simple logistic regression inference using trained weights

import model from "../../public/data/fan_risk_model.json";

export function predictRiskML(features: { energy: number; pleasantness: number; risk_score: number }) {
  const coef = model.coef[0];
  const intercept = model.intercept[0];

  const z = coef[0]*features.energy + coef[1]*features.pleasantness + coef[2]*features.risk_score + intercept;
  const prob = 1 / (1 + Math.exp(-z));

  return {
    probability: prob,
    predicted: prob > 0.5 ? "high" : "low"
  };
}
