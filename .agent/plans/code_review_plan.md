
# Plan de Revisión y Optimización de Código (XDS ERP 2.0)

Este plan detalla las acciones para auditar y mejorar la calidad, rendimiento y consistencia del código del ERP.

## 1. Completar Migración a React Query (Consistencia Arquitectónica)
Actualmente, hemos migrado `Students`, `Instructors` y `Classes`. Para evitar una arquitectura híbrida (y confusa) donde algunas partes usan listeners de Firebase y otras React Query, es prioritario terminar la migración.
- [ ] **Pagos (Payments)**: Completar hook `usePayments` e integración (actualmente a medias).
- [ ] **Costes (Costs)**: Crear hook `useCosts`.
- [ ] **Merchandising**: Crear hooks `useMerchandise`.
- [ ] **Limpieza**: Eliminar suscripciones antiguas en `useInitializeData.ts` para liberar recursos.

## 2. Auditoría de Código y Corrección de Errores
Revisión exhaustiva de los componentes principales para detectar:
- [ ] **Tipado TypeScript**: Eliminar usos excesivos de `any` si los hay.
- [ ] **Renderizado Innecesario**: Verificar si componentes como `Dashboard` o `Billing` se renderizan demasiadas veces.
- [ ] **Manejo de Errores**: Asegurar que todas las promesas (Firebase) tengan `try/catch` y feedback visual al usuario.
- [ ] **Validación de Formularios**: Revisar que no se puedan enviar formularios vacíos o con datos inválidos (especialmente en el nuevo Portal).

## 3. Seguridad y Reglas de Firebase
Verificación final de la seguridad tras la apertura del Portal del Alumno.
- [ ] Validar reglas de Firestore (`firestore.rules`) para asegurar que la apertura de lectura no exponga datos sensibles innecesarios (aunque aceptamos riesgo controlado para este MVP, verificaremos si se puede ajustar).
- [ ] Revisar lógica de autenticación "light" del alumno.

## 4. Mejoras de UX (Experiencia de Usuario)
- [ ] **Feedback de Carga**: Asegurar que los estados `isLoading` de React Query muestren spinners o skeletons en la UI.
- [ ] **Notificaciones**: Unificar el sistema de "Toasts" o alertas.

## Estrategia de Ejecución
1.  **Prioridad Alta**: Terminar la migración de Pagos y Costes (Punto 1) para estabilizar el "core" de datos.
2.  **Prioridad Media**: Revisión archivo por archivo de `src/components` buscando "code smells".
3.  **Prioridad Baja**: Micro-optimizaciones de CSS o refactorizaciones menores.
