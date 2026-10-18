"use strict";
// Lógica pura (sin Firebase) del acceso de profesores al ERP, separada de index.ts para poder
// probarla desde el vitest de la raíz (src/utils/teacherData.test.ts).
//
// Modelo de seguridad: un profesor NO lee Firestore directamente (las reglas siguen cerradas para
// alumnas, pagos, etc.). Todo lo suyo pasa por las Cloud Functions teacherOverview y
// teacherSaveAttendance, que usan estas funciones para devolver solo lo mínimo de SUS clases.
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentInstructorIds = exports.mergePresent = exports.composeNotes = exports.toTeacherEvent = exports.validateAttendanceInput = exports.MAX_BACKDATE_DAYS = exports.toTeacherClass = exports.toTeacherStudent = exports.isStudentInScope = exports.teacherGroupScope = exports.classInstructorIds = exports.chunk = exports.ADMIN_EMAILS = void 0;
/** Mismos administradores que firestore.rules (isAdmin) y userProfileService.ts. */
exports.ADMIN_EMAILS = ['raulfdz3@gmail.com', 'info@xendance.space'];
const chunk = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size)
        chunks.push(items.slice(i, i + size));
    return chunks;
};
exports.chunk = chunk;
// Todos los profesores de una clase: el principal, instructorIds y los de cada grupo.
const classInstructorIds = (raw) => {
    const groups = Array.isArray(raw === null || raw === void 0 ? void 0 : raw.groups) ? raw.groups : [];
    const ids = [
        raw === null || raw === void 0 ? void 0 : raw.instructorId,
        ...(Array.isArray(raw === null || raw === void 0 ? void 0 : raw.instructorIds) ? raw.instructorIds : []),
        ...groups.flatMap(g => (Array.isArray(g === null || g === void 0 ? void 0 : g.instructorIds) ? g.instructorIds : [])),
    ].filter((id) => typeof id === 'string' && id.length > 0);
    return [...new Set(ids)];
};
exports.classInstructorIds = classInstructorIds;
// Grupos de la clase que lleva este profesor. null = no ve por grupos (la clase no tiene grupos, o
// él figura como principal sin estar en ninguno): ve a todas las alumnas de la clase.
const teacherGroupScope = (raw, instructorId) => {
    const groups = Array.isArray(raw === null || raw === void 0 ? void 0 : raw.groups) ? raw.groups : [];
    if (groups.length === 0)
        return null;
    const mine = groups.filter(g => Array.isArray(g === null || g === void 0 ? void 0 : g.instructorIds) && g.instructorIds.includes(instructorId)).map(g => String(g.id));
    return mine.length > 0 ? mine : null;
};
exports.teacherGroupScope = teacherGroupScope;
// ¿Entra la alumna en lo que ve el profesor de esta clase? Quien no tiene grupo asignado lo ven
// todos los profesores de la clase, para que nadie quede sin lista.
const isStudentInScope = (rawStudent, classId, scope) => {
    var _a;
    if (scope === null)
        return true;
    const groupId = (_a = rawStudent === null || rawStudent === void 0 ? void 0 : rawStudent.classGroups) === null || _a === void 0 ? void 0 : _a[classId];
    return !groupId || scope.includes(String(groupId));
};
exports.isStudentInScope = isStudentInScope;
// Vista reducida de una alumna para un profesor: sin teléfono, email, cuotas, notas ni método de
// pago. `scopeByClass` tiene SUS clases (classId -> grupos que lleva, o null si ve toda la clase).
// Devuelve null si no es una alumna activa de alguna de sus clases/grupos.
const toTeacherStudent = (raw, id, scopeByClass) => {
    if (!raw || raw.deletedAt || raw.active === false)
        return null;
    const enrolled = Array.isArray(raw.enrolledClassIds)
        ? raw.enrolledClassIds.filter((c) => typeof c === 'string' && scopeByClass.has(c) && (0, exports.isStudentInScope)(raw, c, scopeByClass.get(c)))
        : [];
    if (enrolled.length === 0)
        return null;
    return {
        id,
        name: String(raw.name || ''),
        birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : undefined,
        enrollmentDate: typeof raw.enrollmentDate === 'string' ? raw.enrollmentDate : undefined,
        active: true,
        enrolledClassIds: enrolled,
    };
};
exports.toTeacherStudent = toTeacherStudent;
// Sin tarifas (baseRate) ni nada económico.
const toTeacherClass = (raw, id, instructorId) => ({
    id,
    name: String(raw.name || ''),
    category: String(raw.category || ''),
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    startTime: String(raw.startTime || ''),
    endTime: String(raw.endTime || ''),
    capacity: Number(raw.capacity) || 0,
    groupName: (() => {
        const scope = instructorId ? (0, exports.teacherGroupScope)(raw, instructorId) : null;
        if (!scope)
            return undefined;
        const names = raw.groups.filter(g => scope.includes(String(g.id))).map(g => String(g.name || '')).filter(Boolean);
        return names.length > 0 ? names.join(' + ') : undefined;
    })(),
});
exports.toTeacherClass = toTeacherClass;
exports.MAX_BACKDATE_DAYS = 60;
const isRealIsoDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        return false;
    const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return d.getUTCFullYear() === Number(match[1]) && d.getUTCMonth() === Number(match[2]) - 1 && d.getUTCDate() === Number(match[3]);
};
const daysBetween = (fromIso, toIso) => Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);
// Valida lo que envía el profesor. No se puede pasar lista de días futuros ni de hace más de 60
// días (las correcciones antiguas las hace la administración).
const validateAttendanceInput = (input, todayIso) => {
    const classId = typeof (input === null || input === void 0 ? void 0 : input.classId) === 'string' ? input.classId.trim() : '';
    if (!classId)
        return { ok: false, message: 'Falta la clase.' };
    const date = typeof (input === null || input === void 0 ? void 0 : input.date) === 'string' ? input.date : '';
    if (!isRealIsoDate(date))
        return { ok: false, message: 'La fecha no es válida.' };
    const age = daysBetween(date, todayIso);
    if (age < 0)
        return { ok: false, message: 'No se puede pasar lista de un día futuro.' };
    if (age > exports.MAX_BACKDATE_DAYS)
        return { ok: false, message: `Solo se puede pasar lista de los últimos ${exports.MAX_BACKDATE_DAYS} días. Para fechas anteriores contacta con administración.` };
    if (!Array.isArray(input === null || input === void 0 ? void 0 : input.presentStudentIds) || input.presentStudentIds.some((s) => typeof s !== 'string' || !s)) {
        return { ok: false, message: 'La lista de asistentes no es válida.' };
    }
    const presentStudentIds = [...new Set(input.presentStudentIds)];
    if (presentStudentIds.length > 500)
        return { ok: false, message: 'Demasiados asistentes.' };
    const notes = typeof (input === null || input === void 0 ? void 0 : input.notes) === 'string' ? input.notes.trim().slice(0, 500) : '';
    return { ok: true, value: { classId, date, presentStudentIds, notes } };
};
exports.validateAttendanceInput = validateAttendanceInput;
// Vista de un evento para un profesor: sin precio, notas internas ni ids de otras alumnas.
// Devuelve null si el evento está borrado, no tiene fecha válida o ya pasó.
const toTeacherEvent = (raw, id, todayIso, teacherStudentNames) => {
    if (!raw || raw.deletedAt || typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || raw.date < todayIso)
        return null;
    const ids = new Set([
        ...(Array.isArray(raw.studentIds) ? raw.studentIds : []),
        ...(Array.isArray(raw.participants) ? raw.participants.map((p) => p === null || p === void 0 ? void 0 : p.studentId) : []),
    ].filter((s) => typeof s === 'string'));
    return {
        id,
        name: String(raw.name || ''),
        type: String(raw.type || ''),
        date: raw.date,
        time: typeof raw.time === 'string' ? raw.time : '',
        location: String(raw.location || ''),
        capacity: typeof raw.capacity === 'number' ? raw.capacity : undefined,
        enrolledCount: ids.size,
        myStudents: [...ids].map(s => teacherStudentNames.get(s)).filter((n) => !!n).sort((a, b) => a.localeCompare(b, 'es')),
    };
};
exports.toTeacherEvent = toTeacherEvent;
// Notas de una clase con varios profesores: cada uno escribe las suyas (notesByInstructor) y el
// campo `notes` que ve la administración las reúne como "Pablo: …  ·  Vic: …".
const composeNotes = (byInstructor) => Object.values(byInstructor)
    .filter(e => e && e.text && e.text.trim())
    .map(e => `${e.name}: ${e.text.trim()}`)
    .join('  ·  ');
exports.composeNotes = composeNotes;
// Asistencia final de una clase cuando pasa lista un profesor que solo lleva a parte de las
// alumnas: se conserva lo que ya marcaron los demás y se sustituye solo lo de su alcance.
const mergePresent = (existingPresent, scopeIds, chosen) => [
    ...new Set([...existingPresent.filter(id => !scopeIds.has(id)), ...chosen]),
];
exports.mergePresent = mergePresent;
// Profesores que llevan a esta alumna en esta clase: los de su grupo si la clase tiene grupos y ella
// tiene uno asignado; si no, todos los de la clase.
const studentInstructorIds = (rawClass, classId, rawStudent) => {
    var _a;
    const groupId = (_a = rawStudent === null || rawStudent === void 0 ? void 0 : rawStudent.classGroups) === null || _a === void 0 ? void 0 : _a[classId];
    const groups = Array.isArray(rawClass === null || rawClass === void 0 ? void 0 : rawClass.groups) ? rawClass.groups : [];
    const group = groupId ? groups.find(g => String(g === null || g === void 0 ? void 0 : g.id) === String(groupId)) : undefined;
    return group && Array.isArray(group.instructorIds) && group.instructorIds.length > 0
        ? group.instructorIds.filter((i) => typeof i === 'string')
        : (0, exports.classInstructorIds)(rawClass);
};
exports.studentInstructorIds = studentInstructorIds;
//# sourceMappingURL=teacherData.js.map