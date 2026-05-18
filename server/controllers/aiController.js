const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const disclaimer = 'This is AI-generated and not a final medical diagnosis.';

const validateRequest = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map((error) => error.msg).join(', '), 400);
  }
};

const fallbackDiagnosis = (reason) => ({
  possibleConditions: [
    {
      name: 'Clinical review required',
      explanation: 'The AI service is unavailable, so no condition suggestions were generated.',
    },
  ],
  riskLevel: 'unknown',
  suggestedTests: ['Consult a licensed clinician for assessment and appropriate testing.'],
  lifestyleRecommendations: ['Rest, stay hydrated, and monitor symptoms until reviewed by a clinician.'],
  preventiveAdvice: ['Seek urgent care if symptoms are severe, worsening, or include emergency warning signs.'],
  disclaimer,
  source: 'fallback',
  fallbackReason: reason,
});

const buildPrompt = ({ symptoms, age, gender, medicalHistory }) => `
Act like a medical assistant, not a real doctor.
Analyze the patient information and return only valid JSON. Do not include markdown fences.

Patient:
- Symptoms: ${symptoms}
- Age: ${age}
- Gender: ${gender}
- Medical history: ${medicalHistory || 'Not provided'}

Return this exact JSON shape:
{
  "possibleConditions": [
    {
      "name": "condition name",
      "explanation": "short reason this may fit the symptoms"
    }
  ],
  "riskLevel": "low | moderate | high | emergency",
  "suggestedTests": ["test 1", "test 2"],
  "lifestyleRecommendations": ["recommendation 1", "recommendation 2"],
  "preventiveAdvice": ["advice 1", "advice 2"],
  "disclaimer": "${disclaimer}"
}

Rules:
- Include 2 to 5 possible conditions.
- Keep content concise and clinically cautious.
- Do not claim certainty.
- Always include the disclaimer exactly as provided.
- If symptoms suggest an emergency, set riskLevel to "emergency" and advise urgent medical care.
`;

const parseJsonResponse = (text) => {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned);
};

const normalizeDiagnosis = (diagnosis) => ({
  possibleConditions: Array.isArray(diagnosis.possibleConditions) ? diagnosis.possibleConditions : [],
  riskLevel: diagnosis.riskLevel || 'unknown',
  suggestedTests: Array.isArray(diagnosis.suggestedTests) ? diagnosis.suggestedTests : [],
  lifestyleRecommendations: Array.isArray(diagnosis.lifestyleRecommendations)
    ? diagnosis.lifestyleRecommendations
    : [],
  preventiveAdvice: Array.isArray(diagnosis.preventiveAdvice) ? diagnosis.preventiveAdvice : [],
  disclaimer,
  source: 'gemini',
});

exports.generateDiagnosis = asyncHandler(async (req, res) => {
  validateRequest(req);

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      diagnosis: fallbackDiagnosis('GEMINI_API_KEY is not configured'),
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(buildPrompt(req.body));
    const responseText = result.response.text();
    const diagnosis = normalizeDiagnosis(parseJsonResponse(responseText));

    return res.status(200).json({
      success: true,
      diagnosis,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      diagnosis: fallbackDiagnosis(error.message || 'Gemini API request failed'),
    });
  }
});
