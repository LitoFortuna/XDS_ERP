// Función segura para obtener respuesta llamando al proxy de Vercel
export async function obtenerRespuestaGemini(promptUsuario: string) {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptUsuario,
        modelName: "gemini-2.5-flash" // Usamos el modelo más reciente recomendado
      }),
    });

    if (!response.ok) throw new Error('Error en la petición al proxy');

    const data = await response.json();
    return data.text; // Aquí tienes tu respuesta de la IA

  } catch (error) {
    console.error("Error:", error);
    return "Hubo un error al conectar con el servidor.";
  }
}