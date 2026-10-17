"use strict";
// Lógica pura (sin Firebase) de los recordatorios de clase, separada de index.ts para poder
// probarla desde el vitest de la raíz (src/utils/classReminders.test.ts).
Object.defineProperty(exports, "__esModule", { value: true });
exports.classesDueNow = exports.reminderSendMinute = exports.getMadridNow = exports.parseHHMM = exports.MIN_USEFUL_LEAD_MINUTES = exports.RUN_INTERVAL_MINUTES = exports.EARLIEST_REMINDER_MINUTE = exports.REMINDER_LEAD_MINUTES = void 0;
/** Cuánto antes de empezar la clase se avisa. */
exports.REMINDER_LEAD_MINUTES = 120;
/** No se manda ningún aviso antes de esta hora (minutos desde medianoche): las 08:00. */
exports.EARLIEST_REMINDER_MINUTE = 8 * 60;
/** Cada cuánto corre la función programada (debe coincidir con el cron de index.ts). */
exports.RUN_INTERVAL_MINUTES = 15;
/** Si tras ajustar a las 08:00 quedan menos minutos que estos hasta la clase, no se avisa. */
exports.MIN_USEFUL_LEAD_MINUTES = 30;
const parseHHMM = (value) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    if (!match)
        return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};
exports.parseHHMM = parseHHMM;
// Día, hora y fecha en Madrid, independientemente de la zona horaria del servidor (las funciones
// corren en UTC, así que new Date().getHours() daría la hora equivocada).
const getMadridNow = (date) => {
    const parts = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => { var _a; return ((_a = parts.find(p => p.type === type)) === null || _a === void 0 ? void 0 : _a.value) || ''; };
    const weekday = get('weekday');
    return {
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        minutes: Number(get('hour')) * 60 + Number(get('minute')),
        dateIso: `${get('year')}-${get('month')}-${get('day')}`,
    };
};
exports.getMadridNow = getMadridNow;
// Minuto del día en el que debe salir el aviso de una clase, o null si no procede (clase
// demasiado temprano para avisar sin madrugar a la alumna).
const reminderSendMinute = (startMinute) => {
    const sendMinute = Math.max(startMinute - exports.REMINDER_LEAD_MINUTES, exports.EARLIEST_REMINDER_MINUTE);
    return startMinute - sendMinute >= exports.MIN_USEFUL_LEAD_MINUTES ? sendMinute : null;
};
exports.reminderSendMinute = reminderSendMinute;
// Clases cuyo aviso toca en esta ejecución: su minuto de envío cae en (ahora - intervalo, ahora],
// así cada clase cae en exactamente una ejecución del cron.
const classesDueNow = (classes, now) => classes.filter(c => {
    var _a;
    if (c.deletedAt || !((_a = c.days) === null || _a === void 0 ? void 0 : _a.includes(now.weekday)))
        return false;
    const start = (0, exports.parseHHMM)(c.startTime);
    if (start === null)
        return false;
    const sendMinute = (0, exports.reminderSendMinute)(start);
    return sendMinute !== null && sendMinute <= now.minutes && sendMinute > now.minutes - exports.RUN_INTERVAL_MINUTES;
});
exports.classesDueNow = classesDueNow;
//# sourceMappingURL=classReminders.js.map