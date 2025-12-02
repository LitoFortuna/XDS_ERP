import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo POST permitido' });
  }

  try {
    // 1. Aquí Vercel lee la llave segura que guardaste en la Fase 1
    // Nota: Asegúrate de configurar GOOGLE_API_KEY en las variables de entorno de Vercel
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    
    // 2. Obtenemos el prompt que enviaste desde el frontend
    const { prompt, modelName } = req.body;

    // 3. Usamos la librería de Google (lado servidor)
    const response = await ai.models.generateContent({
      model: modelName || "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    // 4. Enviamos solo el texto resultante al frontend
    res.status(200).json({ text });

  } catch (error) {
    console.error("Error en proxy:", error);
    res.status(500).json({ error: error.message });
  }
}