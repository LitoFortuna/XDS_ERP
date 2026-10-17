"use strict";
// Plantillas de email (HTML con estilos en línea y tablas, que es lo único que renderizan bien
// Gmail, Outlook y Apple Mail). Puras, para poder probarlas desde el vitest de la raíz.
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInstructorWelcomeEmail = exports.escapeHtml = exports.ERP_LOGIN_URL = void 0;
exports.ERP_LOGIN_URL = 'https://erp.xendance.space';
const LOGO_URL = 'https://erp.xendance.space/pwa-192x192.png';
const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
exports.escapeHtml = escapeHtml;
const FEATURES = [
    { icon: '✅', title: 'Pasa lista en un toque', text: 'Marca la asistencia de tus clases desde el móvil, sin papeles.' },
    { icon: '📊', title: 'Tu resumen', text: 'Asistencia por mes, tus alumnas más constantes y quién necesita un empujón.' },
    { icon: '🎂', title: 'Cumpleaños y eventos', text: 'No se te escapará ningún cumpleaños de tus alumnas ni los próximos eventos.' },
];
const buildInstructorWelcomeEmail = ({ name, email, password, loginUrl = exports.ERP_LOGIN_URL }) => {
    const firstName = name.trim().split(/\s+/)[0] || 'profe';
    const safeFirst = (0, exports.escapeHtml)(firstName);
    const safeEmail = (0, exports.escapeHtml)(email);
    const safePassword = (0, exports.escapeHtml)(password);
    const safeUrl = (0, exports.escapeHtml)(loginUrl);
    const featureRows = FEATURES.map(f => `
              <tr>
                <td width="48" valign="top" style="padding:10px 0;font-size:26px;line-height:30px;">${f.icon}</td>
                <td valign="top" style="padding:10px 0;">
                  <div style="font-size:15px;font-weight:700;color:#1f2937;">${(0, exports.escapeHtml)(f.title)}</div>
                  <div style="font-size:14px;line-height:20px;color:#6b7280;">${(0, exports.escapeHtml)(f.text)}</div>
                </td>
              </tr>`).join('');
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Tu acceso al ERP de Xen Dance Space</title>
<style>
  /* Los textos sobre fondo de color se fuerzan en el modo oscuro: Gmail (data-ogsc) y otros
     clientes oscurecen el texto blanco de la cabecera y del botón si no se les obliga. */
  .hdr-title, .btn-text { color: #ffffff !important; }
  .hdr-eyebrow { color: #f5d0fe !important; }
  @media (prefers-color-scheme: dark) {
    .hdr-title, .btn-text { color: #ffffff !important; }
    .hdr-eyebrow { color: #f5d0fe !important; }
  }
  [data-ogsc] .hdr-title, [data-ogsc] .btn-text { color: #ffffff !important; }
  [data-ogsc] .hdr-eyebrow { color: #f5d0fe !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f3e8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Ya tienes acceso a tu panel de profesor. Aquí están tus credenciales.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3e8ff" style="background-color:#f3e8ff;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(88,28,135,0.18);">

          <tr>
            <td align="center" bgcolor="#581c87" style="background-color:#581c87;background-image:linear-gradient(135deg,#581c87 0%,#9d174d 100%);padding:40px 24px 36px;">
              <img src="${LOGO_URL}" width="84" height="84" alt="Xen Dance Space" style="display:block;border:0;border-radius:20px;margin:0 auto 18px;">
              <div class="hdr-eyebrow" style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#f5d0fe;font-weight:700;">Xen Dance Space</div>
              <h1 class="hdr-title" style="margin:10px 0 0;font-size:28px;line-height:34px;color:#ffffff;font-weight:800;">¡Bienvenido/a al equipo digital, ${safeFirst}! 💃</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:25px;color:#374151;">
                Hola <strong>${safeFirst}</strong>, ya tienes acceso al <strong>ERP de Xen Dance Space</strong>. Es tu panel de profesor: desde ahí gestionas tus clases y pasas lista de forma rápida y cómoda.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf5ff;border:2px dashed #c084fc;border-radius:16px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7e22ce;font-weight:800;margin-bottom:16px;">🔑 Tus credenciales</div>
                    <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Usuario</div>
                    <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:16px;color:#111827;font-weight:700;word-break:break-all;margin-bottom:18px;">${safeEmail}</div>
                    <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Contraseña temporal</div>
                    <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:22px;letter-spacing:1px;color:#6b21a8;font-weight:800;background-color:#ffffff;border-radius:10px;padding:10px 14px;display:inline-block;border:1px solid #e9d5ff;">${safePassword}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#7e22ce" style="border-radius:14px;background-color:#7e22ce;background-image:linear-gradient(135deg,#7e22ce 0%,#db2777 100%);">
                    <a class="btn-text" href="${safeUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">Entrar a mi panel →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">O copia esta dirección: <a href="${safeUrl}" target="_blank" style="color:#7e22ce;">${safeUrl.replace(/^https?:\/\//, '')}</a></p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 4px;">
              <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;font-weight:800;margin-bottom:6px;">Qué vas a poder hacer</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${featureRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;line-height:20px;color:#92400e;">
                    <strong>Guarda este email en un lugar seguro</strong> y no compartas tu contraseña con nadie. Si la pierdes, pídele a la administración que te genere una nueva.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 34px;">
              <p style="margin:0;font-size:15px;line-height:23px;color:#374151;">¡Gracias por todo lo que aportas a la academia! 🫶<br><strong style="color:#7e22ce;">El equipo de Xen Dance Space</strong></p>
            </td>
          </tr>

          <tr>
            <td align="center" bgcolor="#faf5ff" style="background-color:#faf5ff;padding:18px 24px;font-size:12px;line-height:18px;color:#9ca3af;">
              Recibes este email porque la administración de Xen Dance Space te ha creado un acceso al ERP.<br>
              Si crees que es un error, simplemente ignóralo o responde a este mensaje.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const text = [
        `¡Bienvenido/a al equipo digital, ${firstName}!`,
        '',
        'Ya tienes acceso al ERP de Xen Dance Space, tu panel de profesor: pasa lista de tus clases, mira tu resumen de asistencia, tus alumnas, sus cumpleaños y los próximos eventos.',
        '',
        'TUS CREDENCIALES',
        `Usuario: ${email}`,
        `Contraseña temporal: ${password}`,
        '',
        `Entra aquí: ${loginUrl}`,
        '',
        'Guarda este email en un lugar seguro y no compartas tu contraseña. Si la pierdes, pídele a la administración que te genere una nueva.',
        '',
        '¡Gracias por todo lo que aportas a la academia!',
        'El equipo de Xen Dance Space',
    ].join('\n');
    return { subject: '🔑 Tu acceso al ERP de Xen Dance Space', html, text };
};
exports.buildInstructorWelcomeEmail = buildInstructorWelcomeEmail;
//# sourceMappingURL=emailTemplates.js.map