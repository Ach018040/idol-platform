// Simple logistic regression inference using trained weights.
// Keep a small fallback model so TypeScript/build does not depend on a missing local JSON artifact.

const model = {
  coef: [[0.035, -0.018, 0.062]],
  intercept: [-1.75],
};

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
