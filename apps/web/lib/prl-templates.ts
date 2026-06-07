export interface PrlTemplateOption {
  text: string;
  isCorrect: boolean;
}

export interface PrlTemplateQuestion {
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  explanation?: string;
  options: PrlTemplateOption[];
}

export interface PrlTemplateLesson {
  title: string;
  description?: string;
  type: "PDF" | "QUIZ";
  quiz?: {
    passingScore: number;
    maxAttempts: number;
    questions: PrlTemplateQuestion[];
  };
}

export interface PrlTemplateModule {
  title: string;
  description?: string;
  lessons: PrlTemplateLesson[];
}

export interface PrlTemplate {
  id: string;
  title: string;
  description: string;
  prlRiskLevel: "BASICO" | "ESPECIFICO" | "DIRECTIVO";
  certificateValidityDays: number;
  targetDepartments: string[];
  estimatedHours: number;
  legalBasis: string;
  modules: PrlTemplateModule[];
}

export const PRL_TEMPLATES: PrlTemplate[] = [
  // ─── PLANTILLA 1: PRL BÁSICO ───────────────────────────────────────────────
  {
    id: "prl-basico",
    title: "PRL Básico — Todos los Trabajadores",
    description:
      "Formación obligatoria en Prevención de Riesgos Laborales para todos los empleados según el art. 19 Ley 31/1995. Cubre el marco legal, identificación de riesgos en instalaciones deportivas y actuación ante emergencias.",
    prlRiskLevel: "BASICO",
    certificateValidityDays: 730,
    targetDepartments: ["ADMINISTRACION", "RECEPCION", "LIMPIEZA", "MONITOR", "DEPORTIVO"],
    estimatedHours: 6,
    legalBasis: "Art. 19 Ley 31/1995 · RD 39/1997",
    modules: [
      {
        title: "Marco Legal y Conceptos Fundamentales",
        description: "Derechos y obligaciones en materia de PRL. Organismos y responsabilidades.",
        lessons: [
          {
            title: "La Ley 31/1995 de Prevención de Riesgos Laborales",
            description:
              "Descarga y estudia el resumen del marco legal PRL adjunto por tu empresa. Cubre los artículos clave: art. 14 (obligación del empresario), art. 19 (formación) y art. 29 (obligaciones del trabajador).",
            type: "PDF",
          },
          {
            title: "Evaluación: Marco legal y conceptos básicos",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Qué ley regula la Prevención de Riesgos Laborales en España?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La Ley 31/1995, de 8 de noviembre, es la norma básica que establece el marco legal de la PRL en España.",
                  options: [
                    { text: "Ley 31/1995 de Prevención de Riesgos Laborales", isCorrect: true },
                    { text: "Ley 35/2010 del Estatuto de los Trabajadores", isCorrect: false },
                    { text: "Real Decreto 486/1997 sobre lugares de trabajo", isCorrect: false },
                    { text: "Ley 14/1994 de Empresas de Trabajo Temporal", isCorrect: false },
                  ],
                },
                {
                  text: "¿Quién tiene la obligación principal de garantizar la seguridad y salud en el trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Según el art. 14 Ley 31/1995, el empresario deberá garantizar la seguridad y la salud de los trabajadores en todos los aspectos relacionados con el trabajo.",
                  options: [
                    { text: "El propio trabajador exclusivamente", isCorrect: false },
                    { text: "El empresario", isCorrect: true },
                    { text: "El servicio de prevención externo", isCorrect: false },
                    { text: "La Inspección de Trabajo", isCorrect: false },
                  ],
                },
                {
                  text: "El trabajador tiene derecho a interrumpir su actividad cuando exista un riesgo grave e inminente para su vida o salud.",
                  type: "TRUE_FALSE",
                  explanation:
                    "El art. 21 Ley 31/1995 reconoce expresamente este derecho ante situaciones de riesgo grave e inminente.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál de las siguientes NO es una obligación del trabajador en materia de PRL?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los EPIs son proporcionados y costeados siempre por el empresario. El trabajador solo tiene la obligación de utilizarlos correctamente.",
                  options: [
                    { text: "Usar correctamente los equipos de protección individual", isCorrect: false },
                    { text: "Informar de inmediato sobre situaciones de riesgo", isCorrect: false },
                    { text: "Costear sus propios equipos de protección individual", isCorrect: true },
                    { text: "Cooperar con el empresario en materia de PRL", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué es un Plan de Prevención de Riesgos Laborales?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El Plan de Prevención (art. 16 Ley 31/1995) es el documento que integra la actividad preventiva en el sistema de gestión de la empresa.",
                  options: [
                    { text: "Un seguro de accidentes contratado por la empresa", isCorrect: false },
                    { text: "Un listado de los trabajadores que han sufrido accidentes", isCorrect: false },
                    { text: "El documento que integra la prevención en el sistema de gestión general de la empresa", isCorrect: true },
                    { text: "El registro de formaciones impartidas durante el año", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Identificación y Control de Riesgos",
        description: "Riesgos habituales en instalaciones deportivas y medidas de protección.",
        lessons: [
          {
            title: "Riesgos laborales en instalaciones deportivas",
            description:
              "Material de estudio sobre los principales riesgos en gimnasios y centros deportivos (sobreesfuerzos, caídas, ruido, productos de limpieza). Tu empresa adjuntará el documento específico.",
            type: "PDF",
          },
          {
            title: "Equipos de Protección Individual (EPIs)",
            description:
              "Guía sobre los EPIs aplicables a tu puesto de trabajo: cuándo usarlos, cómo y normas de mantenimiento.",
            type: "PDF",
          },
          {
            title: "Evaluación: Riesgos y medidas preventivas",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Qué significa la sigla EPI?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "EPI: Equipo de Protección Individual. Cualquier equipo destinado a ser llevado por el trabajador para protegerle de uno o varios riesgos.",
                  options: [
                    { text: "Equipo de Prevención Industrial", isCorrect: false },
                    { text: "Equipo de Protección Individual", isCorrect: true },
                    { text: "Evaluación de Prevención de Incidentes", isCorrect: false },
                    { text: "Estrategia de Protección Interna", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál de estos es el riesgo físico más habitual para un trabajador de gimnasio?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los sobreesfuerzos, posturas forzadas y manejo de cargas (equipamiento, pesas) son los riesgos físicos más frecuentes en instalaciones deportivas.",
                  options: [
                    { text: "Exposición a radiaciones ionizantes", isCorrect: false },
                    { text: "Sobreesfuerzos y manejo de cargas", isCorrect: true },
                    { text: "Riesgo eléctrico de alta tensión", isCorrect: false },
                    { text: "Inmersión en depósitos de agua", isCorrect: false },
                  ],
                },
                {
                  text: "La evaluación de riesgos es un documento obligatorio que debe elaborar el empresario.",
                  type: "TRUE_FALSE",
                  explanation:
                    "El art. 16 Ley 31/1995 obliga al empresario a realizar una evaluación inicial de los riesgos para la seguridad y salud de los trabajadores.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué debes hacer si detectas una condición peligrosa en tu puesto de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El art. 29 Ley 31/1995 obliga al trabajador a informar de inmediato sobre cualquier situación que pueda entrañar riesgo.",
                  options: [
                    { text: "Ignorarla si no te afecta directamente", isCorrect: false },
                    { text: "Comunicarla de inmediato a tu responsable o al servicio de prevención", isCorrect: true },
                    { text: "Resolverla tú mismo sin informar a nadie", isCorrect: false },
                    { text: "Esperar a que sea más grave para avisar", isCorrect: false },
                  ],
                },
                {
                  text: "¿Con qué frecuencia se recomienda renovar la formación PRL básica en el sector de instalaciones deportivas?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El convenio colectivo del sector de instalaciones deportivas establece la renovación bienal (cada 2 años) de la formación PRL.",
                  options: [
                    { text: "Cada año", isCorrect: false },
                    { text: "Cada 2 años", isCorrect: true },
                    { text: "Cada 5 años", isCorrect: false },
                    { text: "Solo una vez al inicio del contrato", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Actuación ante Emergencias",
        description: "Protocolo PAS, evacuación, uso de extintores y primeros auxilios básicos.",
        lessons: [
          {
            title: "Plan de emergencias y evacuación del centro",
            description:
              "Conoce el plan de emergencias de tu instalación: vías de evacuación, puntos de reunión y roles asignados. Tu empresa adjuntará el documento específico del centro.",
            type: "PDF",
          },
          {
            title: "Primeros auxilios: actuación básica (PAS)",
            description:
              "Guía de primeros auxilios básicos para situaciones de emergencia en el gimnasio: PCR, heridas, quemaduras y golpes.",
            type: "PDF",
          },
          {
            title: "Evaluación final: Emergencias y primeros auxilios",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Cuál es el protocolo básico ante cualquier emergencia?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El protocolo PAS (Proteger el lugar, Avisar al 112, Socorrer a la víctima) es el procedimiento básico ante cualquier emergencia.",
                  options: [
                    { text: "Evacuar a todos los clientes primero", isCorrect: false },
                    { text: "Llamar al 112 antes de hacer cualquier otra cosa", isCorrect: false },
                    { text: "Proteger, Avisar y Socorrer (PAS)", isCorrect: true },
                    { text: "Buscar el desfibrilador como primer paso", isCorrect: false },
                  ],
                },
                {
                  text: "Ante un trabajador inconsciente que respira, ¿cuál es la posición correcta mientras esperas al 112?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La Posición Lateral de Seguridad (PLS) previene la aspiración en caso de vómito y mantiene la vía aérea abierta.",
                  options: [
                    { text: "Tumbado boca arriba con las piernas elevadas", isCorrect: false },
                    { text: "Posición Lateral de Seguridad (PLS)", isCorrect: true },
                    { text: "Sentado con la cabeza entre las rodillas", isCorrect: false },
                    { text: "De pie apoyado en la pared", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuándo debes usar un extintor ante un incendio?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los extintores se usan solo en incendios incipientes. Si en 30 segundos no se controla, o el humo impide respirar, evacúa.",
                  options: [
                    { text: "Siempre, ante cualquier incendio sin importar el tamaño", isCorrect: false },
                    { text: "Solo en incendios pequeños y controlados, cuando es seguro", isCorrect: true },
                    { text: "Nunca, solo los bomberos pueden usarlos", isCorrect: false },
                    { text: "Siempre que haya llamas visibles", isCorrect: false },
                  ],
                },
                {
                  text: "El empresario está obligado a investigar las causas de los accidentes de trabajo.",
                  type: "TRUE_FALSE",
                  explanation:
                    "El art. 16.3 Ley 31/1995 obliga al empresario a investigar los hechos que hayan producido daños para detectar causas y aplicar medidas correctoras.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué número de emergencias debes llamar ante un accidente grave en el centro de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El 112 es el número único de emergencias en España para policía, bomberos y servicios médicos.",
                  options: [
                    { text: "061", isCorrect: false },
                    { text: "091", isCorrect: false },
                    { text: "112", isCorrect: true },
                    { text: "080", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  // ─── PLANTILLA 2: PRL ESPECÍFICO MONITOR ───────────────────────────────────
  {
    id: "prl-especifico-monitor",
    title: "PRL Específico — Monitor de Fitness",
    description:
      "Formación específica en PRL para instructores, monitores y personal de sala. Riesgos propios del puesto: sobreesfuerzos, uso seguro de maquinaria de fitness, exposición al ruido y ergonomía del monitor.",
    prlRiskLevel: "ESPECIFICO",
    certificateValidityDays: 730,
    targetDepartments: ["MONITOR", "DEPORTIVO"],
    estimatedHours: 8,
    legalBasis: "Art. 19 Ley 31/1995 · RD 286/2006 (Ruido) · Convenio Instalaciones Deportivas",
    modules: [
      {
        title: "Riesgos Específicos del Monitor de Fitness",
        description: "Identificación y control de los riesgos propios del puesto de trabajo del monitor.",
        lessons: [
          {
            title: "Sobreesfuerzos, posturas forzadas y carga física del monitor",
            description:
              "Estudio de los riesgos músculo-esqueléticos asociados al puesto de monitor: movimientos repetitivos, impacto en las clases colectivas y manejo de equipamiento. Tu empresa adjuntará el material.",
            type: "PDF",
          },
          {
            title: "Evaluación: Riesgos específicos del puesto de monitor",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Cuál es el riesgo laboral más frecuente en el puesto de monitor de fitness?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los monitores están expuestos de forma continua a posturas forzadas, movimientos repetitivos y carga física elevada, generando alto riesgo músculo-esquelético.",
                  options: [
                    { text: "Exposición a radiaciones electromagnéticas", isCorrect: false },
                    { text: "Trastornos músculo-esqueléticos por sobreesfuerzos y posturas forzadas", isCorrect: true },
                    { text: "Intoxicación por productos químicos", isCorrect: false },
                    { text: "Golpes de calor por exposición solar directa", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué técnica reduce el riesgo de lesión al demostrar ejercicios con carga?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La técnica correcta implica: espalda recta, carga cerca del centro de gravedad, activar el core y evitar giros bruscos de columna.",
                  options: [
                    { text: "Realizarlo rápido para reducir el tiempo de exposición", isCorrect: false },
                    { text: "Mantener la espalda recta, carga cerca del cuerpo y activar el core", isCorrect: true },
                    { text: "Usar solo la fuerza de los brazos para proteger la espalda", isCorrect: false },
                    { text: "Inclinar la espalda para generar más palanca de movimiento", isCorrect: false },
                  ],
                },
                {
                  text: "La exposición continua al ruido de la música en clases colectivas puede causar hipoacusia laboral.",
                  type: "TRUE_FALSE",
                  explanation:
                    "La exposición a niveles superiores a 85 dB de forma continua puede provocar daño auditivo irreversible. El RD 286/2006 regula la protección frente al ruido laboral.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuántos decibelios (dB) marca el umbral de acción inferior para el riesgo de ruido laboral?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Según el RD 286/2006, el valor inferior de exposición que da lugar a una acción es 80 dB(A). A partir de este nivel, el empresario debe informar y formar a los trabajadores.",
                  options: [
                    { text: "70 dB(A)", isCorrect: false },
                    { text: "80 dB(A)", isCorrect: true },
                    { text: "90 dB(A)", isCorrect: false },
                    { text: "100 dB(A)", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué debes hacer si sientes dolor agudo durante la impartición de una clase?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El dolor agudo es señal de alarma. Continuar puede agravar la lesión. El art. 29 Ley 31/1995 obliga a comunicar situaciones que afecten a la seguridad propia.",
                  options: [
                    { text: "Continuar la clase y comunicarlo al finalizar", isCorrect: false },
                    { text: "Ignorarlo si no es muy intenso", isCorrect: false },
                    { text: "Detener la actividad, comunicarlo al responsable y consultar al médico", isCorrect: true },
                    { text: "Tomar un analgésico y seguir sin avisar", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Uso Seguro de Instalaciones y Equipos",
        description: "Procedimientos seguros en el uso y supervisión de maquinaria de fitness y condiciones ambientales.",
        lessons: [
          {
            title: "Maquinaria de fitness: uso, revisión y mantenimiento seguro",
            description:
              "Protocolo de revisión y uso seguro de equipos de musculación, cardio y entrenamiento funcional. Tu empresa adjuntará el procedimiento específico del centro.",
            type: "PDF",
          },
          {
            title: "Condiciones ambientales: ventilación, temperatura y limpieza",
            description:
              "Parámetros de confort y seguridad ambiental en instalaciones deportivas según el RD 486/1997. Temperatura, humedad, iluminación y ventilación.",
            type: "PDF",
          },
          {
            title: "Evaluación: Instalaciones y equipos",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Cuál es la temperatura recomendada para zonas de ejercicio intenso en instalaciones deportivas?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El RD 486/1997 establece que en zonas de trabajo físico, la temperatura recomendada es 14-18°C, diferente de oficinas (17-27°C).",
                  options: [
                    { text: "10-14°C para zonas de ejercicio intenso", isCorrect: false },
                    { text: "14-18°C para zonas de ejercicio intenso", isCorrect: true },
                    { text: "22-26°C como en una oficina convencional", isCorrect: false },
                    { text: "No hay regulación específica para instalaciones deportivas", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué debes hacer si detectas un equipo de musculación con una sujeción o cable en mal estado?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Cualquier equipo defectuoso debe retirarse inmediatamente del uso, señalizarse y comunicarse al responsable para reparación o sustitución.",
                  options: [
                    { text: "Seguir usándolo con precaución hasta el mantenimiento programado", isCorrect: false },
                    { text: "Señalizarlo, retirarlo del uso y comunicarlo al responsable de inmediato", isCorrect: true },
                    { text: "Repararlo tú mismo si tienes los conocimientos", isCorrect: false },
                    { text: "Avisar solo si un cliente lo usa y se queja", isCorrect: false },
                  ],
                },
                {
                  text: "Antes de iniciar una clase, el monitor debe verificar el estado del suelo y el equipamiento.",
                  type: "TRUE_FALSE",
                  explanation:
                    "La verificación previa del estado de instalaciones y equipos es una obligación preventiva del trabajador que reduce el riesgo de accidentes durante la sesión.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿A partir de qué nivel de ruido equivalente diario es obligatorio el uso de protección auditiva?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Según el RD 286/2006, el valor superior de exposición que da lugar a una acción es 85 dB(A). Superado este límite, la protección auditiva es obligatoria.",
                  options: [
                    { text: "75 dB(A)", isCorrect: false },
                    { text: "80 dB(A)", isCorrect: false },
                    { text: "85 dB(A)", isCorrect: true },
                    { text: "90 dB(A)", isCorrect: false },
                  ],
                },
                {
                  text: "¿Con qué frecuencia mínima deben revisarse los equipos de musculación en sala?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El plan de mantenimiento preventivo debe contemplar revisiones periódicas. La frecuencia mínima recomendada para máquinas de uso intensivo es mensual.",
                  options: [
                    { text: "Solo cuando se rompen o presentan fallos visibles", isCorrect: false },
                    { text: "Mensualmente como mínimo, siguiendo el plan de mantenimiento", isCorrect: true },
                    { text: "Una vez al año en la revisión anual", isCorrect: false },
                    { text: "Cada 5 años por empresa certificada externamente", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Ergonomía y Prevención de Lesiones Profesionales",
        description: "Técnicas de trabajo seguras para preservar tu salud a largo plazo como monitor.",
        lessons: [
          {
            title: "Ergonomía aplicada al puesto de monitor de fitness",
            description:
              "Guía de ergonomía y posturas de trabajo para instructores deportivos: posición en demostraciones, uso del micrófono, descansos y rotación de actividades. Tu empresa adjuntará el material.",
            type: "PDF",
          },
          {
            title: "Evaluación final: Ergonomía y prevención de lesiones",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Qué es la ergonomía en el contexto laboral?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La ergonomía adapta el entorno y las condiciones de trabajo a las capacidades del trabajador, minimizando riesgos de lesiones.",
                  options: [
                    { text: "La ciencia de diseñar el trabajo y el entorno para adaptarlos al trabajador", isCorrect: true },
                    { text: "El conjunto de ejercicios de calentamiento antes de trabajar", isCorrect: false },
                    { text: "El protocolo de limpieza de las instalaciones deportivas", isCorrect: false },
                    { text: "La normativa sobre horarios y jornadas laborales", isCorrect: false },
                  ],
                },
                {
                  text: "El uso de micrófono amplificador para impartir clases es una medida preventiva recomendada.",
                  type: "TRUE_FALSE",
                  explanation:
                    "El micrófono permite proyectar la voz sin forzarla, previniendo disfonías y laringitis profesionales, patologías frecuentes en monitores de fitness.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál es la principal medida preventiva para reducir el riesgo de tendinitis en hombro en un monitor?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La combinación de rotación de tareas, calentamiento adecuado y fortalecimiento de músculos estabilizadores es la estrategia más efectiva.",
                  options: [
                    { text: "Impartir más clases para fortalecer el hombro", isCorrect: false },
                    { text: "Rotación de actividades, calentamiento previo y fortalecimiento de estabilizadores", isCorrect: true },
                    { text: "Tomar antiinflamatorios de forma preventiva", isCorrect: false },
                    { text: "No demostrar nunca ejercicios con carga", isCorrect: false },
                  ],
                },
                {
                  text: "¿A quién debes comunicar síntomas persistentes de fatiga vocal o dolor de oído?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los síntomas persistentes deben comunicarse al responsable de prevención o al médico del trabajo para investigar causas y adoptar medidas correctoras.",
                  options: [
                    { text: "A nadie, son molestias normales del trabajo de monitor", isCorrect: false },
                    { text: "Solo al médico de cabecera sin avisar en el trabajo", isCorrect: false },
                    { text: "Al responsable de prevención o al médico del trabajo de la empresa", isCorrect: true },
                    { text: "Esperar a que desaparezcan solos antes de actuar", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál de estas prácticas protege mejor la voz del monitor durante las clases?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Mantener la hidratación durante la jornada es una de las medidas más eficaces para proteger las cuerdas vocales junto con el uso de micrófono.",
                  options: [
                    { text: "Gritar más fuerte para compensar la música alta", isCorrect: false },
                    { text: "Beber agua fría en grandes cantidades al final de la clase", isCorrect: false },
                    { text: "Hidratarse con agua templada a lo largo de la jornada y usar micrófono", isCorrect: true },
                    { text: "Aclarar la garganta con fuerza antes de cada clase", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  // ─── PLANTILLA 3: PRL DIRECTIVOS ───────────────────────────────────────────
  {
    id: "prl-directivos",
    title: "PRL para Directivos y Mandos Intermedios",
    description:
      "Formación específica en responsabilidades PRL para directores de sede, managers y responsables de departamento. Obligaciones legales, organización de la prevención, gestión de emergencias y cultura preventiva.",
    prlRiskLevel: "DIRECTIVO",
    certificateValidityDays: 730,
    targetDepartments: ["ADMINISTRACION"],
    estimatedHours: 10,
    legalBasis: "Arts. 14-16 Ley 31/1995 · RD 39/1997 Cap. III · Art. 316 CP",
    modules: [
      {
        title: "Obligaciones Legales del Mando en PRL",
        description: "Responsabilidades civiles, administrativas y penales de directivos y mandos.",
        lessons: [
          {
            title: "Responsabilidad legal y penal del mando en PRL",
            description:
              "Marco jurídico de las obligaciones de directivos: responsabilidad civil, administrativa (LISOS art. 40) y penal (CP art. 316-317). Tu empresa adjuntará el material legal completo.",
            type: "PDF",
          },
          {
            title: "Evaluación: Obligaciones del mando intermedio",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Qué tipo de responsabilidad puede derivarse para un mando por un accidente grave causado por incumplimiento de la normativa PRL?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El incumplimiento de la normativa PRL puede generar responsabilidad civil (indemnizaciones), administrativa (sanciones LISOS) y penal (art. 316-317 CP) de forma simultánea.",
                  options: [
                    { text: "Solo responsabilidad administrativa por parte de la empresa", isCorrect: false },
                    { text: "Responsabilidad civil, administrativa y penal simultáneamente", isCorrect: true },
                    { text: "Solo responsabilidad civil por daños materiales", isCorrect: false },
                    { text: "Ninguna si hay cobertura del seguro de accidentes", isCorrect: false },
                  ],
                },
                {
                  text: "Las sanciones por infracción grave en materia de PRL pueden alcanzar los €40.985 por trabajador afectado.",
                  type: "TRUE_FALSE",
                  explanation:
                    "Según el art. 40.2 LISOS, las infracciones graves se sancionan con multas de €2.046 a €40.985. Las muy graves pueden llegar a €819.780.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál es la obligación principal del mando respecto a la formación PRL de su equipo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El mando debe asegurarse de que cada trabajador a su cargo dispone de la formación específica para su puesto (art. 19 Ley 31/1995).",
                  options: [
                    { text: "Impartir él mismo la formación PRL a su equipo", isCorrect: false },
                    { text: "Verificar que todos los trabajadores a su cargo reciben y acreditan la formación necesaria", isCorrect: true },
                    { text: "Firmar los certificados aunque la formación no se haya impartido", isCorrect: false },
                    { text: "La formación es responsabilidad del servicio de prevención, no del mando", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué documento acredita formalmente que un trabajador ha recibido la formación PRL obligatoria?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El certificado de formación PRL firmado y fechado es el documento válido ante una inspección de trabajo o auditoría.",
                  options: [
                    { text: "El contrato de trabajo con cláusula de formación", isCorrect: false },
                    { text: "El certificado de formación con firma, fecha y contenido", isCorrect: true },
                    { text: "El registro de nóminas del período formativo", isCorrect: false },
                    { text: "La evaluación de desempeño anual del trabajador", isCorrect: false },
                  ],
                },
                {
                  text: "¿En qué plazo debe notificarse un accidente de trabajo grave a la Autoridad Laboral?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los accidentes graves, muy graves o con resultado de muerte deben comunicarse a la Autoridad Laboral en el plazo máximo de 24 horas (RD 1299/2006).",
                  options: [
                    { text: "En el plazo de 5 días hábiles desde el accidente", isCorrect: false },
                    { text: "En el plazo de 24 horas desde que se produce", isCorrect: true },
                    { text: "En el plazo de 30 días naturales", isCorrect: false },
                    { text: "No existe obligación de notificación si hay seguro", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Organización de la Prevención en el Centro",
        description: "Modalidades de organización preventiva, evaluación de riesgos y coordinación empresarial.",
        lessons: [
          {
            title: "Modalidades de organización de la prevención",
            description:
              "Guía sobre las distintas formas de organizar la prevención: trabajador designado, servicio de prevención propio y servicio de prevención ajeno. Tu empresa adjuntará el documento.",
            type: "PDF",
          },
          {
            title: "Coordinación de Actividades Empresariales (CAE)",
            description:
              "Procedimiento de coordinación cuando concurren trabajadores de distintas empresas en el mismo centro de trabajo (RD 171/2004).",
            type: "PDF",
          },
          {
            title: "Evaluación: Organización preventiva y CAE",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Qué es la Coordinación de Actividades Empresariales (CAE)?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Según el RD 171/2004, cuando coinciden trabajadores de distintas empresas en un centro, existe la obligación de coordinar las actividades preventivas.",
                  options: [
                    { text: "La planificación anual de las actividades del servicio de prevención", isCorrect: false },
                    { text: "El conjunto de medidas para prevenir riesgos cuando coinciden trabajadores de varias empresas en un mismo centro", isCorrect: true },
                    { text: "La coordinación entre el médico del trabajo y los mandos", isCorrect: false },
                    { text: "El plan de formación anual en PRL de la empresa", isCorrect: false },
                  ],
                },
                {
                  text: "El Plan de Prevención de Riesgos Laborales solo es obligatorio para empresas de más de 50 trabajadores.",
                  type: "TRUE_FALSE",
                  explanation:
                    "Todas las empresas, independientemente del tamaño, están obligadas a disponer de un Plan de Prevención (art. 16 Ley 31/1995).",
                  options: [
                    { text: "Verdadero", isCorrect: false },
                    { text: "Falso", isCorrect: true },
                  ],
                },
                {
                  text: "¿Cuándo debe revisarse la evaluación de riesgos de un puesto de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La evaluación debe revisarse ante cambios en las condiciones de trabajo, daños a la salud o cuando las medidas sean inadecuadas (art. 6 RD 39/1997).",
                  options: [
                    { text: "Cada 10 años en revisión periódica", isCorrect: false },
                    { text: "Solo cuando se produce un accidente de trabajo", isCorrect: false },
                    { text: "Cuando cambien condiciones de trabajo, se produzcan daños o las medidas sean inadecuadas", isCorrect: true },
                    { text: "Cada año obligatoriamente sin excepciones", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué función tiene el Comité de Seguridad y Salud en empresas con más de 50 trabajadores?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El Comité de Seguridad y Salud (art. 38 Ley 31/1995) es el órgano paritario de participación para la consulta regular sobre actuaciones preventivas.",
                  options: [
                    { text: "Sustituir al servicio de prevención en sus funciones técnicas", isCorrect: false },
                    { text: "Órgano paritario empresa-trabajadores de consulta regular sobre acciones preventivas", isCorrect: true },
                    { text: "Imponer sanciones internas en materia de PRL", isCorrect: false },
                    { text: "Elaborar la evaluación de riesgos de todos los puestos", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué información mínima debe recibir un trabajador antes de iniciar un nuevo puesto de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "El art. 18 Ley 31/1995 obliga al empresario a informar sobre los riesgos del puesto, las medidas de protección y los procedimientos de emergencia antes del inicio.",
                  options: [
                    { text: "Solo el salario y las condiciones contractuales", isCorrect: false },
                    { text: "Los riesgos del puesto, medidas de protección y procedimientos de emergencia", isCorrect: true },
                    { text: "Solo el nombre del servicio de prevención contratado", isCorrect: false },
                    { text: "Esta información no es obligatoria antes del inicio", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: "Liderazgo y Cultura Preventiva",
        description: "Herramientas para implantar una cultura preventiva sólida y gestionar accidentes.",
        lessons: [
          {
            title: "Investigación de accidentes e incidentes: metodología",
            description:
              "Metodología práctica para la investigación de accidentes de trabajo: árbol de causas, análisis raíz y medidas correctoras. Tu empresa adjuntará el procedimiento.",
            type: "PDF",
          },
          {
            title: "Evaluación final: Liderazgo y cultura preventiva",
            type: "QUIZ",
            quiz: {
              passingScore: 70,
              maxAttempts: 3,
              questions: [
                {
                  text: "¿Cuál es el objetivo principal de investigar un accidente de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "La investigación tiene un fin exclusivamente preventivo: identificar causas raíz para eliminarlas y evitar que el accidente se repita.",
                  options: [
                    { text: "Determinar quién es el culpable para sancionarlo internamente", isCorrect: false },
                    { text: "Identificar las causas para adoptar medidas que eviten su repetición", isCorrect: true },
                    { text: "Justificar la baja médica del trabajador accidentado", isCorrect: false },
                    { text: "Calcular el coste económico del accidente para la empresa", isCorrect: false },
                  ],
                },
                {
                  text: "Un mando que promueve la comunicación de incidentes sin culpabilizar contribuye a una cultura preventiva positiva.",
                  type: "TRUE_FALSE",
                  explanation:
                    "Cuando los trabajadores se sienten seguros para reportar incidentes sin miedo a represalias, se identifican y corrigen condiciones peligrosas antes del accidente.",
                  options: [
                    { text: "Verdadero", isCorrect: true },
                    { text: "Falso", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué diferencia hay entre un accidente de trabajo y un incidente (cuasi-accidente)?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Un incidente es un suceso no deseado que no produce lesiones pero podría haberlas producido. Su investigación es igual de valiosa que la de un accidente.",
                  options: [
                    { text: "El incidente es un accidente leve y el accidente es uno grave", isCorrect: false },
                    { text: "El accidente produce daño a la persona; el incidente no produce lesión pero podría haberla producido", isCorrect: true },
                    { text: "El incidente afecta solo a maquinaria y el accidente solo a personas", isCorrect: false },
                    { text: "No hay diferencia real, son términos sinónimos en PRL", isCorrect: false },
                  ],
                },
                {
                  text: "¿Cuál es la principal causa raíz de la mayoría de los accidentes de trabajo?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Los modelos modernos de seguridad demuestran que los accidentes son multifactoriales con causas raíz en el sistema (organización, procedimientos, formación), no solo en el comportamiento individual.",
                  options: [
                    { text: "La mala suerte o el azar inevitable", isCorrect: false },
                    { text: "La imprudencia exclusiva del trabajador accidentado", isCorrect: false },
                    { text: "Fallos en el sistema de gestión: formación, procedimientos o condiciones inseguras no corregidas", isCorrect: true },
                    { text: "El uso de equipos demasiado antiguos", isCorrect: false },
                  ],
                },
                {
                  text: "¿Qué indicadores reflejan mejor la eficacia del sistema preventivo de un centro?",
                  type: "MULTIPLE_CHOICE",
                  explanation:
                    "Un sistema eficaz se mide con indicadores proactivos (formación completada, inspecciones, incidentes reportados) y reactivos (accidentes). Solo medir accidentes es gestión reactiva.",
                  options: [
                    { text: "Exclusivamente el número de accidentes con baja laboral", isCorrect: false },
                    { text: "Solo el coste de las primas del seguro de accidentes", isCorrect: false },
                    { text: "Combinación de indicadores: accidentes, incidentes reportados, auditorías y tasa de cumplimiento formativo", isCorrect: true },
                    { text: "El número de sanciones recibidas de la Inspección de Trabajo", isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },
];
