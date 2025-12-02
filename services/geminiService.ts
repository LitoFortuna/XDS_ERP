
// Función segura para obtener respuesta llamando al proxy de Vercel
export async function obtenerRespuestaGemini(promptUsuario: string) {
  try {
    // Obtenemos el secreto de las variables de entorno de Vite (Frontend)
    // Nota: Asegúrate de tener VITE_APP_SECRET en tu archivo .env local y en las variables de entorno de construcción
    const appSecret = (import.meta as any).env.VITE_APP_SECRET || '';

    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': appSecret, // Enviamos la llave para pasar el filtro de seguridad
      },
      body: JSON.stringify({
        prompt: promptUsuario,
        modelName: "gemini-2.5-flash"
      }),
    });

    if (!response.ok) {
       if (response.status === 401) {
         throw new Error('Error de autorización: Verifica VITE_APP_SECRET');
       }
       throw new Error('Error en la petición al proxy');
    }

    const data = await response.json();
    return data.text; 

  } catch (error) {
    console.error("Error:", error);
    return "Hubo un error al conectar con el servidor o autorización denegada.";
  }
}