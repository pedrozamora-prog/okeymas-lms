# Formia LMS — Catálogo de funcionalidades

> Documento de referencia para marketing, landing page, documentación técnica y onboarding de nuevos desarrolladores.
> Actualizado: junio 2026

---

## 🎓 Formación (Alumno)

### Cursos y lecciones
- Catálogo de cursos con portada, descripción y progreso visual
- **Búsqueda y filtros en vivo** en el catálogo: tabs Todos / En progreso / Completados / Disponibles / Obligatorios, búsqueda por título y descripción con contador por categoría
- Tipos de lección: Vídeo, PDF, Contenido enriquecido (bloques), Quiz, Clase en directo
- Editor de bloques para contenido estructurado (headings, párrafos, callouts, imágenes, vídeo embebido)
- Navegación lección anterior / siguiente con barra de progreso
- Marcar lección como completada (+10 XP)
- **Apuntes personales por lección** — panel colapsable con auto-guardado (debounce 800ms), contador de palabras/caracteres y persistencia entre sesiones
- Foro de comentarios por lección (preguntas y respuestas)
- Narración de audio IA por lección (ElevenLabs, 4 voces disponibles)

### Rutas de aprendizaje
- Rutas ordenadas con múltiples cursos
- Progreso visual por ruta
- Branching paths (rutas ramificadas según nivel o rol)

### Quiz interactivo
- Preguntas de opción múltiple, texto libre y valoración
- Puntuación con intentos configurables
- Resultados detallados por pregunta

### Dashboard del alumno
- Banner "Continúa donde lo dejaste" con enlace directo a la próxima lección
- Racha de días consecutivos de actividad 🔥
- Stats: cursos inscritos, completados, puntos XP, certificados
- Cursos en progreso con barra de porcentaje
- Próximas clases en directo
- **Pantalla de bienvenida** (onboarding) para nuevos alumnos al entrar por primera vez

### Perfil del alumno `/dashboard/profile`
- Avatar con iniciales, nombre, email, teléfono, departamento, fecha de alta
- Estadísticas personales (XP, cursos, certificados, badges)
- Insignias ganadas con fecha y XP de recompensa
- Certificados descargables (PDF)
- Progreso en todos los cursos inscritos

---

## 🏆 Gamificación

### Puntos XP
- +10 XP por cada lección completada (primera vez)
- Bonus XP al desbloquear insignias

### Insignias automáticas (8 badges)
| Insignia | Criterio | XP |
|----------|----------|----|
| 🎯 Primera lección | 1 lección completada | — |
| 🔥 En racha | 5 lecciones | +50 XP |
| ⚡ Estudiante dedicado | 10 lecciones | +100 XP |
| 💪 Medio camino | 25 lecciones | +250 XP |
| 🏅 Maestro del conocimiento | 50 lecciones | +500 XP |
| 🎓 Primer curso | 1 curso completado | +100 XP |
| 📚 Coleccionista | 3 cursos completados | +300 XP |
| 🏆 Veterano | 5 cursos completados | +500 XP |

- Toast de notificación al desbloquear una insignia
- Admins pueden crear badges personalizadas manualmente

### Clasificación `/dashboard/leaderboard`
- Podio visual top 3 (corona dorada, medalla plateada, bronce)
- Ranking completo top 50 por XP
- Posición del usuario resaltada aunque esté fuera del top 50
- Muestra nombre, departamento y puntos

---

## 🤖 Funciones de Inteligencia Artificial

### Simulador de conversaciones IA
- Escenarios configurables (título, descripción, contexto del cliente, objetivo, dificultad)
- Chat en tiempo real con cliente IA (Groq llama-3.3-70b)
- Sonido de notificación al recibir respuesta del cliente
- Evaluación automática al finalizar: puntuación 0-100, tono, objetivo logrado, puntos fuertes y áreas de mejora
- Historial de simulaciones con tarjetas expandibles
- Stats globales: intentos totales, puntuación media, mejor puntuación

### Narración de audio IA
- Genera narración MP3 de lecciones con ElevenLabs (modelo multilingual v2)
- 4 voces disponibles (Rachel, Antoni, Bella, Josh)
- Almacenamiento en Supabase Storage
- Reproductor de audio en la lección del alumno

### Insights IA para admins
- Análisis bajo demanda de 12 métricas de la organización
- Generado con Groq (llama-3.3-70b), devuelve 5 tarjetas con urgencia, categoría, título y acción recomendada
- Categorías: engagement, completions, certificates, risk, performance

---

## 📊 Administración

### Dashboard admin
- 6 KPIs: usuarios activos, cursos publicados, inscripciones, completados, certificados, tasa de finalización
- Top 5 cursos por inscripciones con barra de popularidad
- Últimas 5 inscripciones en tiempo real
- Widget de alumnos en riesgo (sin actividad reciente)
- Próximas clases en directo

### Gestión de cursos
- Crear/editar/publicar cursos con portada, descripción, categoría, nivel, duración estimada
- Módulos y lecciones con drag & drop para reordenar
- Certificado configurable por curso (validez en días, tipo, firma digital)
- Cursos obligatorios con fecha límite

### Gestión de usuarios
- Invitar usuarios por email
- Roles: Super Admin, Branch Admin, Manager, Instructor, Employee
- Departamentos y puestos de trabajo
- Activar/desactivar usuarios
- SSO / SAML para inicio de sesión corporativo

### Inscripciones y cumplimiento
- Inscripción manual o por reglas automáticas (por rol, departamento)
- **Inscripción masiva** desde el listado de cursos: inscribe a todos o por departamento de golpe, con fecha límite y notificación opcional
- Panel de compliance por empleado y departamento
- Alertas de riesgo (alumnos sin actividad, cursos vencidos)
- Recordatorios de inactividad con mensaje personalizable

### Buscador global `Ctrl+K`
- Busca cursos, lecciones y usuarios en tiempo real (debounce 250ms)
- Navegación completa por teclado (↑↓ + Enter)
- Scoped a la organización del usuario

### Reportes y exportación
- Descarga de informe en Excel (3 hojas: cumplimiento, detalle, por departamento)
- Descarga en PDF con portada corporativa
- Filtros: departamento, rango de fechas
- Ranking de empleados por puntos

### Encuesta de satisfacción
- Modal de 5 estrellas al completar un curso
- Comentario opcional
- **Valoraciones visibles** en tarjetas de cursos (⭐ media y número de valoraciones), tanto para alumnos como para admins

### Audit logs
- Registro de todas las acciones administrativas con timestamp y usuario

---

## 🎥 Clases en directo

- Programar clases con instructor, fecha, duración y enlace de acceso
- Vista de próximas clases para alumnos e instructores con widget en el dashboard
- **Añadir al calendario**: botón en cada clase futura con 3 opciones — Google Calendar (deep-link), Outlook Web (deep-link) y descarga .ics (Apple Calendar, Outlook desktop, cualquier cliente RFC 5545)
- Registro de asistencia

---

## 📜 Certificados y firma digital

- Emisión automática al completar un curso (si está habilitado)
- Tipos: completación, aprobado, participación
- Validez configurable con fecha de expiración
- Firma digital del alumno requerida (configurable por curso)
- Descarga en PDF
- Almacenamiento en perfil del alumno

---

## 🔔 Notificaciones

- Sistema in-app con campanón en el sidebar
- Tipos: nueva inscripción, recordatorio, expiración certificado, curso completado, nuevo comentario, recordatorio de inactividad
- Marcar como leídas masivamente
- **Web Push Notifications** — notificaciones push del navegador (funciona aunque la app esté cerrada). Toggle "Activar notificaciones" en el sidebar. Integrado en inscripciones masivas y recordatorios de inactividad

---

## 🏪 Marketplace y monetización

- Marketplace de cursos template (6 cursos listos para usar)
- Compra B2C con Stripe
- Publicación de cursos al marketplace por super admins
- HRIS webhooks para integración con sistemas de RRHH

---

## 🔧 Técnico / Infraestructura

| Tecnología | Uso |
|------------|-----|
| Next.js 16 (App Router) | Framework fullstack |
| Prisma + Supabase (PostgreSQL) | ORM y base de datos |
| NextAuth v5 | Autenticación + SSO/SAML |
| Groq (llama-3.3-70b) | IA conversacional e insights |
| ElevenLabs | Text-to-speech para narración |
| Supabase Storage | Almacenamiento de archivos/audio |
| Tailwind CSS + shadcn/ui | UI components |
| XLSX + React PDF | Exportación de informes |
| Coolify | Self-hosted deployment |
| Wati (WhatsApp) | Notificaciones WhatsApp (configurado) |
| @ducanh2912/next-pwa + Workbox | Service worker, cache offline, fallbacks |
| Web Push API (VAPID) | Notificaciones push nativas del navegador |

### PWA — Instalación y offline
- **Iconos**: generados dinámicamente vía `ImageResponse` (32×32 favicon, 180×180 Apple, 192 y 512 para manifest)
- **Manifest**: `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, 3 shortcuts de acceso rápido
- **Offline**: página `/offline` con diseño Formia + auto-recarga al recuperar conexión
- **Banner instalación**: detecta `beforeinstallprompt` (Chrome/Android) e instrucción táctil para iOS Safari. Se muestra 1 vez, se descarta al instalar o cerrar.

---

## 🗺️ Roadmap sugerido

- [x] Inscripción masiva por departamento desde el curso
- [x] Onboarding / pantalla de bienvenida para nuevos alumnos
- [x] Valoraciones visibles en tarjetas de cursos
- [x] Búsqueda y filtros en vivo en el catálogo de cursos
- [x] Apuntes personales del alumno por lección
- [x] Analytics de curso — funnel de abandono, KPIs, tabla por lección, quiz stats
- [x] Notificaciones Web Push (service worker + VAPID)
- [ ] SCORM 1.2 / xAPI (importar contenido externo)
- [x] App móvil PWA instalable — iconos 192/512 via ImageResponse, apple-icon, manifest completo, página offline, banner "Instalar app" (iOS + Android/Chrome), fallback offline automático
- [x] Integración calendario — botón "Añadir al calendario" en clases en directo: Google Calendar (URL deep-link), Outlook Web (URL deep-link), descarga .ics (Apple Calendar, Outlook desktop, cualquier cliente compatible RFC 5545)
