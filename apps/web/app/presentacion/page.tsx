export const metadata = { title: "Argumentario — Okeymas LMS" };

export default function PresentacionPage() {
  return (
    <div className="presentacion-root">

      {/* ── PORTADA ── */}
      <section className="portada">
        <div className="portada-inner">
          <div className="logo-block">
            <div className="logo-icon">O</div>
            <div>
              <p className="logo-name">OKEYMAS</p>
              <p className="logo-sub">LMS</p>
            </div>
          </div>
          <h1 className="portada-title">
            Plataforma de Formación<br />
            <span className="yellow">Profesional para Gimnasios</span>
          </h1>
          <p className="portada-desc">
            Argumentario para presentación ante el Consejo de Dirección
          </p>
          <div className="portada-meta">
            <span>Yelau Group · {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long" })}</span>
            <span>Confidencial</span>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 1: QUÉ ES ── */}
      <section className="seccion page-break">
        <div className="seccion-num">01</div>
        <h2 className="seccion-titulo">¿Qué es Okeymas LMS?</h2>
        <p className="seccion-intro">
          Okeymas LMS es una <strong>plataforma SaaS de gestión del aprendizaje</strong> desarrollada a medida para cadenas de gimnasios.
          Permite formar, evaluar y certificar a los empleados de forma 100% digital, centralizada y trazable.
        </p>
        <div className="cards-3">
          <div className="card yellow-border">
            <div className="card-icon">🎯</div>
            <h3>Problema que resuelve</h3>
            <p>La formación en gimnasios es dispersa, difícil de controlar y sin trazabilidad. Los responsables no saben quién ha completado qué, ni si el personal cumple los estándares requeridos.</p>
          </div>
          <div className="card yellow-border">
            <div className="card-icon">💡</div>
            <h3>Nuestra solución</h3>
            <p>Un sistema centralizado donde cada empleado tiene su itinerario personalizado según su departamento, con seguimiento en tiempo real y certificación automática al completar los cursos.</p>
          </div>
          <div className="card yellow-border">
            <div className="card-icon">📈</div>
            <h3>Resultado esperado</h3>
            <p>Reducción del tiempo de onboarding, estandarización de procesos, empleados más cualificados y cumplimiento normativo documentado con certificados oficiales.</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: MÓDULOS ── */}
      <section className="seccion page-break">
        <div className="seccion-num">02</div>
        <h2 className="seccion-titulo">Módulos de la plataforma</h2>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">ADMINISTRACIÓN</span>
            <h3>Panel de Control del Administrador</h3>
          </div>
          <p>El administrador dispone de un <strong>dashboard en tiempo real</strong> con todas las métricas clave de la organización:</p>
          <ul>
            <li><strong>Total de usuarios</strong> registrados en la plataforma y su actividad</li>
            <li><strong>Tasa de finalización</strong> de cursos por empleado y por departamento</li>
            <li><strong>Cursos más populares</strong> y rendimiento académico global</li>
            <li><strong>Inscripciones recientes</strong> y próximas clases en directo programadas</li>
            <li><strong>Total de certificados emitidos</strong> y estado de validez</li>
          </ul>
          <div className="highlight">
            Argumento clave: el responsable sabe en todo momento qué empleado ha completado su formación obligatoria, sin necesidad de preguntar ni hacer seguimiento manual.
          </div>
        </div>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">CONTENIDO</span>
            <h3>Gestión de Cursos por Departamento</h3>
          </div>
          <p>Los cursos se estructuran en <strong>módulos y lecciones</strong>, con soporte para múltiples formatos de contenido:</p>
          <ul>
            <li><strong>Vídeo</strong> — lecciones grabadas con reproductor integrado</li>
            <li><strong>PDF</strong> — documentos y manuales descargables</li>
            <li><strong>Quiz</strong> — evaluaciones con nota mínima configurable y múltiples intentos</li>
            <li><strong>Clase en directo</strong> — sesiones programadas con instructor, grabadas automáticamente</li>
          </ul>
          <p>Cada curso puede asignarse a <strong>uno o varios departamentos</strong> (Administración, Recepción, Servicio de Limpieza, Monitor, Deporocio), de modo que cada empleado solo ve los cursos relevantes para su rol.</p>
          <div className="highlight">
            Argumento clave: un monitor no verá los cursos de administración y viceversa. La experiencia de cada empleado está personalizada desde el primer día.
          </div>
        </div>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">CERTIFICACIÓN</span>
            <h3>Sistema de Certificados Automáticos</h3>
          </div>
          <p>Al completar el 100% de un curso, la plataforma <strong>emite automáticamente un certificado PDF</strong> personalizado con:</p>
          <ul>
            <li>Nombre completo del empleado y nombre del curso</li>
            <li>Tipo de certificado: <strong>Finalización</strong> (confirma la realización) o <strong>Profesional</strong> (acredita competencias)</li>
            <li>Fecha de emisión y fecha de caducidad configurable</li>
            <li>Nombre y cargo del firmante oficial</li>
            <li>Código único de verificación</li>
          </ul>
          <div className="highlight">
            Argumento clave: los certificados tienen validez documental y pueden exigirse para auditorías, inspecciones de trabajo o acreditaciones sectoriales. Se generan sin intervención manual.
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: MÁS MÓDULOS ── */}
      <section className="seccion page-break">
        <div className="seccion-num">03</div>
        <h2 className="seccion-titulo">Funcionalidades avanzadas</h2>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">INTELIGENCIA ARTIFICIAL</span>
            <h3>IA Integrada con Google Gemini</h3>
          </div>
          <p>La plataforma incorpora <strong>inteligencia artificial de última generación</strong> en dos áreas clave:</p>
          <ul>
            <li><strong>Asistente de aprendizaje</strong> — botón flotante disponible en todo el dashboard. El empleado puede hacer preguntas sobre los contenidos del curso y recibir respuestas inmediatas del asistente especializado en Acondicionamiento Físico.</li>
            <li><strong>Generador de contenido para administradores</strong> — en el panel de creación de cursos, el administrador puede generar automáticamente descripciones de cursos y preguntas de evaluación con un solo clic, ahorrando horas de trabajo editorial.</li>
          </ul>
          <div className="highlight">
            Argumento clave: la IA no es un añadido estético. Reduce el tiempo de creación de contenido y mejora la retención del alumno al tener soporte instantáneo 24/7.
          </div>
        </div>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">ROLES Y PERMISOS</span>
            <h3>Sistema de Roles Multinivel</h3>
          </div>
          <p>La plataforma gestiona <strong>cuatro niveles de acceso</strong> con permisos diferenciados:</p>
          <div className="roles-grid">
            <div className="rol">
              <strong>Super Admin</strong>
              <span>Acceso total. Gestiona organización, usuarios, cursos, certificados e informes.</span>
            </div>
            <div className="rol">
              <strong>Admin de Sede</strong>
              <span>Gestión de su sucursal: usuarios, cursos y seguimiento de su equipo.</span>
            </div>
            <div className="rol">
              <strong>Instructor</strong>
              <span>Crea y edita cursos, programa clases en directo y ve el progreso de sus alumnos.</span>
            </div>
            <div className="rol">
              <strong>Empleado</strong>
              <span>Accede a sus cursos asignados, realiza evaluaciones y descarga sus certificados.</span>
            </div>
          </div>
        </div>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">GAMIFICACIÓN</span>
            <h3>Puntos y Badges de Motivación</h3>
          </div>
          <p>Para mantener la motivación del equipo, la plataforma incluye un <strong>sistema de puntos y badges</strong>:</p>
          <ul>
            <li>Puntos acumulables por completar lecciones, cursos y evaluaciones</li>
            <li>Badges especiales: "Primer Curso", "Maratonista", "Siempre Puntual", "Experto Fitness"</li>
            <li>Cada empleado puede ver su progreso y logros desde su perfil personal</li>
          </ul>
          <div className="highlight">
            Argumento clave: los estudios demuestran que la gamificación aumenta la tasa de finalización de cursos corporativos entre un 40% y un 60%.
          </div>
        </div>

        <div className="modulo">
          <div className="modulo-header">
            <span className="modulo-tag">REGISTRO</span>
            <h3>Alta de Empleados con Departamento</h3>
          </div>
          <p>Los nuevos empleados pueden registrarse de forma autónoma indicando su departamento. El sistema les asigna automáticamente los cursos correspondientes a su área. También es posible que el administrador cree las cuentas manualmente y las configure con anterioridad al inicio del contrato.</p>
          <div className="highlight">
            Argumento clave: el onboarding digital empieza antes del primer día de trabajo. El empleado llega formado.
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: TÉCNICO ── */}
      <section className="seccion page-break">
        <div className="seccion-num">04</div>
        <h2 className="seccion-titulo">Infraestructura y seguridad</h2>
        <div className="cards-2">
          <div className="card">
            <h3>☁️ 100% en la nube</h3>
            <p>Desplegado en <strong>Vercel</strong> (la infraestructura que usa empresas como TikTok, Airbnb y Nike), con base de datos <strong>Supabase PostgreSQL</strong> en servidores europeos (Frankfurt, Alemania), cumpliendo con el <strong>RGPD</strong>.</p>
          </div>
          <div className="card">
            <h3>🔒 Seguridad</h3>
            <p>Autenticación segura con <strong>NextAuth v5</strong> y tokens JWT cifrados. Contraseñas hasheadas con bcrypt. Acceso por roles — cada usuario solo ve lo que le corresponde. HTTPS en todas las comunicaciones.</p>
          </div>
          <div className="card">
            <h3>📱 Multiplataforma</h3>
            <p>Funciona en cualquier dispositivo sin necesidad de instalar nada: <strong>ordenador, tablet y móvil</strong>. Diseño adaptativo que se ajusta a cualquier pantalla.</p>
          </div>
          <div className="card">
            <h3>⚡ Tecnología moderna</h3>
            <p>Construido con <strong>Next.js 16, TypeScript, Prisma y Tailwind CSS</strong> — las mismas tecnologías que usan las principales plataformas de formación online del mundo.</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: ROI ── */}
      <section className="seccion page-break">
        <div className="seccion-num">05</div>
        <h2 className="seccion-titulo">Retorno de inversión (ROI)</h2>

        <div className="comparativa">
          <div className="comp-col comp-sin">
            <h3>❌ Sin Okeymas LMS</h3>
            <ul>
              <li>Formación presencial: coste de sala, materiales, tiempo del formador</li>
              <li>Sin trazabilidad: no se sabe quién ha recibido qué formación</li>
              <li>Riesgo legal si un empleado no acredita formación obligatoria</li>
              <li>Onboarding lento: semanas hasta que el nuevo empleado es productivo</li>
              <li>Gestión manual de certificados: papel, correos, archivos dispersos</li>
              <li>Formación no estandarizada: cada sede forma de manera diferente</li>
            </ul>
          </div>
          <div className="comp-col comp-con">
            <h3>✅ Con Okeymas LMS</h3>
            <ul>
              <li>Formación online 24/7: el empleado aprende cuando puede, sin coste de sala</li>
              <li>Trazabilidad total: informe en tiempo real de quién ha completado qué</li>
              <li>Certificados automáticos con validez documental y código de verificación</li>
              <li>Onboarding desde el día 1: el empleado llega con los cursos ya asignados</li>
              <li>Todo centralizado: un solo panel para gestionar toda la formación</li>
              <li>Estandarización: el mismo nivel de formación en todas las sedes</li>
            </ul>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="kpi-valor">-70%</div>
            <div className="kpi-label">Reducción de costes de formación presencial</div>
          </div>
          <div className="kpi">
            <div className="kpi-valor">3x</div>
            <div className="kpi-label">Mayor velocidad de onboarding de nuevos empleados</div>
          </div>
          <div className="kpi">
            <div className="kpi-valor">100%</div>
            <div className="kpi-label">Trazabilidad y cumplimiento normativo documentado</div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 6: MANTENIMIENTO ── */}
      <section className="seccion page-break">
        <div className="seccion-num">06</div>
        <h2 className="seccion-titulo">Mantenimiento y evolución continua</h2>
        <p className="seccion-intro">
          La plataforma está en producción y operativa. Como todo sistema SaaS profesional, requiere mantenimiento continuo para garantizar su estabilidad, seguridad y evolución según las necesidades del negocio.
        </p>

        <div className="planes">
          <div className="plan">
            <div className="plan-nombre">Infraestructura</div>
            <ul>
              <li>✓ Hosting y base de datos en la nube</li>
              <li>✓ Actualizaciones de seguridad periódicas</li>
              <li>✓ Copias de seguridad diarias automáticas</li>
              <li>✓ Monitorización 24/7 del sistema</li>
              <li>✓ Gestión de dominios y certificados SSL</li>
            </ul>
          </div>
          <div className="plan plan-destacado">
            <div className="plan-nombre">Soporte y mejoras</div>
            <ul>
              <li>✓ Soporte técnico ante incidencias</li>
              <li>✓ Resolución de errores y bugs</li>
              <li>✓ Desarrollo de nuevas funcionalidades</li>
              <li>✓ Formación al equipo administrador</li>
              <li>✓ Informe mensual de uso y KPIs</li>
              <li>✓ Personalización de marca y contenido</li>
            </ul>
          </div>
          <div className="plan">
            <div className="plan-nombre">Evolución del producto</div>
            <ul>
              <li>✓ Integración con herramientas de RRHH</li>
              <li>✓ Nuevos módulos según crecimiento</li>
              <li>✓ Escalabilidad para más sedes</li>
              <li>✓ Adaptación a cambios normativos</li>
              <li>✓ Actualizaciones de la IA integrada</li>
              <li>✓ Roadmap priorizado con dirección</li>
            </ul>
          </div>
        </div>

        <div className="highlight" style={{marginTop: "28px"}}>
          El coste de mantenimiento se acordará con la dirección según el nivel de servicio requerido. La propuesta económica se presentará de forma separada y adaptada a las necesidades específicas de Yelau Group.
        </div>
      </section>

      {/* ── CIERRE ── */}
      <section className="cierre">
        <h2>La formación de tu equipo,<br /><span className="yellow">bajo control total.</span></h2>
        <p>Okeymas LMS transforma la formación de empleados de un proceso costoso e incontrolable en un activo estratégico medible y escalable.</p>
        <div className="cierre-contacto">
          <strong>Okeymas LMS</strong> · pedro.zamora@yelaugroup.com
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

        .presentacion-root {
          font-family: 'Inter', sans-serif;
          color: #111;
          background: #fff;
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
        }

        /* PORTADA */
        .portada {
          background: #0C0C0C;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 80px;
        }
        .portada-inner { max-width: 700px; width: 100%; }
        .logo-block { display: flex; align-items: center; gap: 16px; margin-bottom: 60px; }
        .logo-icon {
          width: 56px; height: 56px;
          background: #FCE900;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 900; color: #0C0C0C;
        }
        .logo-name { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; }
        .logo-sub  { font-size: 11px; font-weight: 700; color: #FCE900; letter-spacing: 4px; margin-top: 2px; }
        .portada-title {
          font-size: 48px; font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 20px; letter-spacing: -1px;
        }
        .portada-desc { color: #888; font-size: 16px; margin-bottom: 60px; }
        .portada-meta {
          display: flex; justify-content: space-between;
          border-top: 1px solid #222; padding-top: 20px;
          color: #555; font-size: 13px;
        }
        .yellow { color: #FCE900; }

        /* SECCIONES */
        .seccion { padding: 60px 80px; border-bottom: 1px solid #eee; }
        .seccion-num { font-size: 72px; font-weight: 900; color: #FCE900; line-height: 1; margin-bottom: -10px; opacity: 0.4; }
        .seccion-titulo { font-size: 32px; font-weight: 900; color: #0C0C0C; margin-bottom: 20px; }
        .seccion-intro { font-size: 16px; color: #444; line-height: 1.7; margin-bottom: 32px; }

        /* CARDS */
        .cards-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .cards-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .card {
          background: #f8f8f8; border-radius: 12px; padding: 24px;
          border: 1px solid #eee;
        }
        .yellow-border { border-top: 3px solid #FCE900; }
        .card-icon { font-size: 28px; margin-bottom: 12px; }
        .card h3 { font-size: 15px; font-weight: 700; margin-bottom: 10px; color: #0C0C0C; }
        .card p { font-size: 13px; color: #555; line-height: 1.6; }

        /* MÓDULOS */
        .modulo { margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid #f0f0f0; }
        .modulo:last-child { border-bottom: none; }
        .modulo-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .modulo-tag {
          background: #FCE900; color: #0C0C0C;
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
          padding: 3px 10px; border-radius: 4px;
        }
        .modulo-header h3 { font-size: 18px; font-weight: 700; color: #0C0C0C; }
        .modulo p { font-size: 14px; color: #444; line-height: 1.7; margin-bottom: 12px; }
        .modulo ul { padding-left: 20px; margin-bottom: 16px; }
        .modulo ul li { font-size: 14px; color: #444; line-height: 1.8; }
        .highlight {
          background: #FFF9E0; border-left: 4px solid #FCE900;
          padding: 12px 16px; border-radius: 0 8px 8px 0;
          font-size: 13px; color: #333; font-style: italic;
        }

        /* ROLES */
        .roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .rol {
          background: #f8f8f8; border-radius: 8px; padding: 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .rol strong { font-size: 14px; color: #0C0C0C; }
        .rol span { font-size: 13px; color: #666; }

        /* COMPARATIVA */
        .comparativa { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
        .comp-col { padding: 24px; border-radius: 12px; }
        .comp-sin { background: #fff5f5; border: 1px solid #fecaca; }
        .comp-con { background: #f0fdf4; border: 1px solid #86efac; }
        .comp-col h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
        .comp-col ul { padding-left: 16px; }
        .comp-col li { font-size: 13px; line-height: 1.9; color: #444; }

        /* KPIs */
        .kpis { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .kpi {
          text-align: center; padding: 28px 20px;
          background: #0C0C0C; border-radius: 12px; color: #fff;
        }
        .kpi-valor { font-size: 40px; font-weight: 900; color: #FCE900; }
        .kpi-label { font-size: 12px; color: #aaa; margin-top: 8px; line-height: 1.4; }

        /* PLANES */
        .planes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 24px; }
        .plan {
          border: 1px solid #e5e7eb; border-radius: 12px;
          padding: 28px 24px; position: relative;
        }
        .plan-destacado {
          border: 2px solid #FCE900;
          background: #FFFDE0;
        }
        .plan-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #FCE900; color: #0C0C0C;
          font-size: 10px; font-weight: 700; letter-spacing: 1px;
          padding: 3px 12px; border-radius: 20px;
        }
        .plan-nombre { font-size: 16px; font-weight: 700; color: #0C0C0C; margin-bottom: 16px; }
        .plan ul { list-style: none; padding: 0; }
        .plan li { font-size: 13px; color: #444; line-height: 1.9; }

        /* CIERRE */
        .cierre {
          background: #0C0C0C; padding: 80px;
          text-align: center; color: #fff;
        }
        .cierre h2 { font-size: 36px; font-weight: 900; line-height: 1.3; margin-bottom: 20px; }
        .cierre p { font-size: 16px; color: #888; max-width: 500px; margin: 0 auto 40px; }
        .cierre-contacto {
          font-size: 14px; color: #555;
          border-top: 1px solid #222; padding-top: 24px;
        }

        /* PRINT */
        @media print {
          .page-break { page-break-before: always; }
          .portada { min-height: auto; page-break-after: always; }
          body { margin: 0; }
          .presentacion-root { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
