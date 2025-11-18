import { GoogleGenAI } from "@google/genai";

// Fix: API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// La función para generar descripciones de clases ya no es necesaria con el nuevo diseño.
// Se puede añadir nueva funcionalidad de IA aquí en el futuro.