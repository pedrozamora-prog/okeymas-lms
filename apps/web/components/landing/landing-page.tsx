"use client";

import { useState } from "react";
import { Anton } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/ui/fade-in";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });

const FEATURES = [
  {
    tag: "Cursos & Certificaciones",
    title: "Convierte tu expertise en ingresos recurrentes",
    desc: "Crea cursos con video HD, quizzes interactivos y materiales descargables. Emite certificados automáticos con QR verificable y firma digital cuando tus miembros completan el programa.",
    bullets: ["Video streaming nativo sin límite de almacenamiento", "Quiz con nota mínima, intentos configurables y rutas adaptativas", "Certificados con QR verificable y firma digital", "Itinerarios de aprendizaje personalizados por rol"],
    mockup: "courses",
  },
  {
    tag: "Gestión de Miembros",
    title: "Conoce a cada miembro mejor que nunca",
    desc: "Perfiles 360°, historial de asistencia, progreso en cursos y métricas individuales. Toda la información de cada miembro en una sola pantalla.",
    bullets: ["Progreso individual en tiempo real", "Historial de asistencia y pagos", "Segmentación por plan y actividad", "Alertas automáticas de baja engagement"],
    mockup: "members",
  },
  {
    tag: "Facturación Automática",
    title: "Cobra sin esfuerzo, todos los meses",
    desc: "Integración nativa con Stripe. Cobros recurrentes, múltiples métodos de pago y gestión de chargeback. El dinero llega solo.",
    bullets: ["Cobros recurrentes automáticos", "Múltiples métodos de pago", "Facturas en PDF automáticas", "Dashboard financiero en tiempo real"],
    mockup: "billing",
  },
];

const TESTIMONIALS = [
  {
    name: "Rodrigo Alcántara",
    role: "Dueño · FitZone Guadalajara",
    avatar: "R",
    color: "#A855F7",
    text: "En 3 meses triplicamos los ingresos de cursos. Formia nos permitió lanzar nuestro programa de certificación sin contratar a nadie más.",
  },
  {
    name: "Marcela Torres",
    role: "Directora · Iron Temple Monterrey",
    avatar: "M",
    color: "#EC4899",
    text: "Gestionar 4 sedes desde una sola plataforma es un sueño hecho realidad. El soporte es increíble y mis coaches aprenden la interfaz en 20 minutos.",
  },
  {
    name: "David Medina",
    role: "CEO · Cadena FitLife · 12 sedes",
    avatar: "D",
    color: "#06B6D4",
    text: "Migramos de 3 herramientas distintas a Formia. Ahorramos $2,400 USD al mes y ahora tenemos visibilidad total de toda la cadena en tiempo real.",
  },
];

const PLANS = [
  {
    name: "Inicio",
    monthly: 159,
    annual: 127,
    desc: "Para gimnasios independientes listos para digitalizar",
    features: ["Hasta 200 miembros", "Cursos ilimitados", "Quiz con nota mínima configurable", "Certificados automáticos PDF", "Facturación Stripe", "Soporte por chat"],
    featured: false,
    cta: "Empezar gratis",
    href: "/register",
  },
  {
    name: "Profesional",
    monthly: 319,
    annual: 255,
    desc: "Para gimnasios en crecimiento que quieren escalar",
    features: ["Hasta 1,000 miembros", "Todo en Inicio", "Itinerarios de aprendizaje", "Firma digital en certificados", "Analytics avanzado", "App móvil branded", "Soporte prioritario"],
    featured: true,
    cta: "Empezar gratis",
    badge: "Más popular",
    href: "/register",
  },
  {
    name: "Éxito",
    monthly: 549,
    annual: 439,
    desc: "Para cadenas multi-sede que necesitan control total",
    features: ["Miembros ilimitados", "Múltiples sedes", "White label completo", "API & Webhooks", "SSO / SAML", "Audit logs completos", "Manager dedicado"],
    featured: false,
    cta: "Hablar con ventas",
    href: "/contact",
  },
];

const FAQ = [
  { q: "¿Puedo probar Formia antes de pagar?", a: "Sí, todos los planes incluyen 14 días de prueba gratis con acceso completo. No pedimos tarjeta de crédito para empezar." },
  { q: "¿Qué pasa si supero el límite de miembros?", a: "Te avisamos cuando te acerques al límite y puedes hacer upgrade con un clic. Nunca bloqueamos tu acceso de forma inmediata." },
  { q: "¿Pueden mis miembros acceder desde el celular?", a: "Sí. Formia es 100% responsive y en el plan Profesional incluimos una app móvil con tu logo y colores." },
  { q: "¿Cómo se integra con mi sistema actual?", a: "Tenemos integraciones nativas con Stripe y Zapier, más una API completa para conectar con cualquier sistema. La migración desde otras plataformas la hacemos nosotros." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Absolutamente. Sin contratos, sin penalizaciones. Si cancelas, tienes acceso hasta el final del período pagado y puedes exportar todos tus datos." },
];

const PAIN_ICONS = [
  <svg key="0" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>,
  <svg key="1" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>,
  <svg key="2" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21h6"/><path d="M9 18h6"/>
    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
  </svg>,
];

export function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className={`${anton.variable} bg-[#050507] text-[#FAFAFA] min-h-screen overflow-x-hidden`}>
      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes pulse-glow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        .animate-float{animation:float 7s ease-in-out infinite}
        .animate-float-d{animation:float 7s ease-in-out 2.5s infinite}
        .animate-pulse-glow{animation:pulse-glow 3s ease-in-out infinite}
        .gradient-text{
          background:linear-gradient(135deg,#fff 0%,#e9d5ff 35%,#a855f7 65%,#ec4899 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .gradient-text-sm{
          background:linear-gradient(90deg,#fff 0%,#c4b5fd 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .btn-glow{box-shadow:0 0 28px #a855f760;transition:all .2s ease}
        .btn-glow:hover{box-shadow:0 0 48px #a855f790;transform:translateY(-1px)}
        .card-hover{transition:all .25s ease}
        .card-hover:hover{border-color:rgba(168,85,247,.3)!important;transform:translateY(-3px);box-shadow:0 20px 60px rgba(168,85,247,.12)}
        .border-glow{border:1px solid transparent;background:linear-gradient(#0d0d14,#0d0d14) padding-box,linear-gradient(135deg,rgba(168,85,247,.4),rgba(236,72,153,.2),rgba(168,85,247,.4)) border-box}
        .mesh-hero{background:radial-gradient(ellipse 110% 70% at 50% -5%,#1e0840 0%,#0d0520 40%,transparent 70%),#050507}
        .tab-scroll{scrollbar-width:none;-ms-overflow-style:none}
        .tab-scroll::-webkit-scrollbar{display:none}
        @keyframes hero-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .ha1{animation:hero-up .7s cubic-bezier(.16,1,.3,1) 0ms both}
        .ha2{animation:hero-up .7s cubic-bezier(.16,1,.3,1) 90ms both}
        .ha3{animation:hero-up .7s cubic-bezier(.16,1,.3,1) 180ms both}
        .ha4{animation:hero-up .7s cubic-bezier(.16,1,.3,1) 260ms both}
        .ha5{animation:hero-up .7s cubic-bezier(.16,1,.3,1) 330ms both}
        .ha6{animation:hero-up .9s cubic-bezier(.16,1,.3,1) 420ms both}
      `}</style>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ backdropFilter: "blur(24px)", background: "rgba(5,5,7,0.88)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[100px] flex items-center justify-between gap-4">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo-light.png" alt="Formia" width={380} height={96} className="h-[86px] w-auto object-contain object-left" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Características", href: "#caracteristicas" },
              { label: "Precios",         href: "#precios" },
              { label: "Casos de éxito",  href: "#casos" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-sm text-white/45 hover:text-white transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Iniciar sesión</Link>
            <Link href="/register" className="btn-glow bg-[#A855F7] hover:bg-[#9333EA] text-white text-xs sm:text-sm font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg whitespace-nowrap">
              Empezar gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mesh-hero relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.22) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute top-32 left-[15%] w-[400px] h-[400px] rounded-full animate-float pointer-events-none" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute top-48 right-[10%] w-[350px] h-[350px] rounded-full animate-float-d pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-0 flex flex-col items-center text-center">
          {/* Hero — CSS animations directas, no dependen de scroll */}
          <div className="ha1 mb-6 flex items-center gap-2.5 border border-[#A855F740] bg-[#A855F710] rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse-glow flex-shrink-0" />
            <span className="text-[#C084FC] text-xs font-medium">LMS #1 para gimnasios en Latinoamérica</span>
          </div>

          <h1 className="ha2 font-[family-name:var(--font-anton)] leading-[1.0] mb-6" style={{ fontSize: "clamp(38px,8vw,96px)" }}>
            <span className="gradient-text">El LMS que tu</span><br />
            <span className="text-white">gimnasio necesitaba</span>
          </h1>

          <p className="ha3 text-[clamp(15px,2vw,20px)] text-white/55 max-w-2xl leading-relaxed mb-9">
            Crea cursos, gestiona miembros y cobra automáticamente.<br className="hidden sm:block" />
            <span className="text-white/80 font-medium">Todo en una sola plataforma.</span> Sin complicaciones.
          </p>

          <div className="ha4 flex flex-col sm:flex-row items-center gap-4 mb-5 w-full sm:w-auto">
            <Link href="/register" className="btn-glow bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl w-full sm:w-auto text-center">
              Empezar gratis — 14 días →
            </Link>
            <a href="#" className="flex items-center justify-center gap-2.5 text-white/60 hover:text-white text-base transition-colors group">
              <span className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-sm group-hover:border-[#A855F7] group-hover:text-[#A855F7] transition-all flex-shrink-0">▶</span>
              Ver demo en vivo
            </a>
          </div>

          <div className="ha5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] sm:text-[13px] text-white/35 mb-14 sm:mb-16">
            <span>✓ Sin tarjeta de crédito</span>
            <span className="hidden sm:block opacity-40">·</span>
            <span>✓ Cancela cuando quieras</span>
            <span className="hidden sm:block opacity-40">·</span>
            <span>✓ Setup en menos de 10 min</span>
          </div>

          {/* Mockup — CSS animation directa */}
          <div className="ha6 w-full" style={{ perspective: "1400px" }}>
              <div className="rounded-t-xl sm:rounded-t-2xl overflow-hidden border border-white/10" style={{
                transform: "rotateX(6deg)",
                transformOrigin: "bottom center",
                boxShadow: "0 -25px 140px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)",
              }}>
                <div className="bg-[#0A0A0F] border-b border-white/8 px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white/[0.06] border border-white/10 rounded-md px-4 sm:px-6 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-white/30 flex items-center gap-1.5 sm:gap-2 max-w-[200px] sm:max-w-none">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22C55E] flex-shrink-0" />
                      <span className="truncate">app.formia.dev/dashboard</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#080810] flex">
                  <div className="w-40 sm:w-52 border-r border-white/5 p-3 sm:p-4 hidden sm:flex flex-col">
                    <div className="px-2 mb-5">
                      <Image src="/logo.png" alt="Formia" width={100} height={26} className="h-6 w-auto object-contain object-left" />
                    </div>
                    {["Dashboard", "Miembros", "Cursos", "Pagos", "Analytics", "Configuración"].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-xs ${i === 0 ? "bg-[#A855F718] text-[#C084FC]" : "text-white/25"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-[#A855F7]" : "bg-white/10"}`} />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-3 sm:p-5 min-w-0">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-xs sm:text-sm font-semibold text-white/80">Dashboard</h3>
                      <span className="text-[10px] sm:text-[11px] text-white/25">Junio 2025</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      {[
                        { label: "Miembros activos", val: "1,284", trend: "+12%", color: "#A855F7" },
                        { label: "Ingresos del mes", val: "$48.2K", trend: "+24%", color: "#22C55E" },
                        { label: "Cursos activos", val: "24", trend: "+3", color: "#06B6D4" },
                        { label: "Completaciones", val: "89%", trend: "+5pts", color: "#EC4899" },
                      ].map(s => (
                        <div key={s.label} className="bg-white/[0.04] rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 border border-white/5">
                          <p className="text-[9px] sm:text-[10px] text-white/30 mb-1 truncate">{s.label}</p>
                          <p className="font-[family-name:var(--font-anton)] text-base sm:text-xl mb-0.5 sm:mb-1">{s.val}</p>
                          <span className="text-[9px] sm:text-[10px] font-semibold" style={{ color: s.color }}>{s.trend}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      <div className="sm:col-span-2 bg-white/[0.04] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] sm:text-xs text-white/45">Ingresos mensuales 2025</p>
                          <span className="text-[9px] sm:text-[10px] bg-[#22C55E15] text-[#22C55E] px-1.5 sm:px-2 py-0.5 rounded-full">+24% vs 2024</span>
                        </div>
                        <div className="flex items-end gap-1 h-12 sm:h-20">
                          {[30,50,40,60,52,75,58,88,72,100,82,68].map((h, i) => (
                            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 9 ? "#A855F7" : i === 11 ? "#A855F760" : "rgba(255,255,255,0.07)" }} />
                          ))}
                        </div>
                      </div>
                      <div className="hidden sm:block bg-white/[0.04] rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-white/45 mb-3">Top cursos</p>
                        {["CrossFit Básico", "Nutrición Deportiva", "Yoga & Wellness"].map((c, i) => (
                          <div key={c} className="mb-3">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-white/45 truncate pr-1">{c}</span>
                              <span className="text-[10px] text-white/25">{[87,64,45][i]}%</span>
                            </div>
                            <div className="h-1 bg-white/8 rounded-full">
                              <div className="h-1 rounded-full" style={{ width: `${[87,64,45][i]}%`, background: ["#A855F7","#06B6D4","#EC4899"][i] }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { val: "500+", label: "Gimnasios activos", sub: "en 12 países" },
            { val: "50K+", label: "Miembros formados", sub: "y certificados" },
            { val: "$2.4M", label: "Cobrados via Formia", sub: "solo en 2024" },
            { val: "4.9 ★", label: "Rating promedio", sub: "en App Store" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 80}>
              <div className="flex flex-col items-center text-center gap-1">
                <span className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl gradient-text-sm">{s.val}</span>
                <span className="text-xs sm:text-sm font-semibold text-white/75">{s.label}</span>
                <span className="text-[11px] sm:text-xs text-white/25">{s.sub}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10 sm:mb-14">
            <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">El problema</span>
            <h2 className="font-[family-name:var(--font-anton)] mt-3 mb-4 leading-[1.1]" style={{ fontSize: "clamp(32px,5vw,56px)" }}>
              ¿Tu gimnasio sigue<br /><span className="gradient-text">perdiendo dinero así?</span>
            </h2>
            <p className="text-white/45 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              La mayoría usa 4–5 herramientas que no se hablan entre sí. El resultado: caos, tiempo perdido y miembros que se van sin avisar.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { title: "Sin seguimiento de miembros", desc: "Usas hojas de Excel o WhatsApp. Nunca sabes quién está en riesgo de irse hasta que ya se fue.", stat: "30% de los miembros se pierden por falta de seguimiento" },
              { title: "Cobros manuales y caóticos", desc: "Persigues pagos mes a mes. Algunos simplemente dejan de pagar y tú te enteras tarde.", stat: "15% de morosidad promedio en cobros manuales" },
              { title: "Tu conocimiento vale $0", desc: "Tienes años de experiencia pero no cobras por tu metodología. Tus coaches se van y se llevan el saber.", stat: "78% de los gimnasios nunca monetiza su IP" },
            ].map((p, i) => (
              <FadeIn key={p.title} delay={i * 100}>
                <div className="card-hover rounded-2xl bg-white/[0.03] border border-white/8 p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 h-full">
                  <span className="text-2xl sm:text-3xl">{PAIN_ICONS[i]}</span>
                  <h3 className="text-base sm:text-[17px] font-bold">{p.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed flex-1">{p.desc}</p>
                  <div className="border-t border-white/5 pt-3 sm:pt-4">
                    <p className="text-xs text-red-400/70 leading-relaxed">{p.stat}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={200} className="mt-8 sm:mt-10 text-center">
            <p className="text-sm text-white/35">
              Con Formia, estos tres problemas desaparecen el primer día.{" "}
              <Link href="/register" className="text-[#A855F7] hover:text-[#C084FC] transition-colors underline underline-offset-4">Empieza gratis →</Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FEATURES */}
      <section id="caracteristicas" className="py-20 sm:py-28 relative scroll-mt-[100px]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(26,5,51,0.8) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10 sm:mb-12">
            <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">La solución</span>
            <h2 className="font-[family-name:var(--font-anton)] mt-3 leading-[1.1]" style={{ fontSize: "clamp(32px,5vw,56px)" }}>
              Todo lo que necesitas.<br /><span className="gradient-text">En un solo lugar.</span>
            </h2>
          </FadeIn>
          {/* Tabs — horizontal scroll on mobile */}
          <div className="flex gap-2 sm:gap-3 mb-8 sm:mb-12 overflow-x-auto tab-scroll pb-1 sm:justify-center sm:flex-wrap">
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border whitespace-nowrap flex-shrink-0 ${activeFeature === i ? "bg-[#A855F7] border-[#A855F7] text-white" : "border-white/15 text-white/45 hover:text-white hover:border-white/30"}`}>
                {f.tag}
              </button>
            ))}
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className={`${activeFeature === i ? "flex" : "hidden"} flex-col lg:flex-row items-center gap-8 sm:gap-12`}>
              <FadeIn direction="left" className="flex-1 flex flex-col gap-4 sm:gap-5 max-w-xl">
                <h3 className="font-[family-name:var(--font-anton)] leading-tight" style={{ fontSize: "clamp(26px,3vw,38px)" }}>{f.title}</h3>
                <p className="text-white/55 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 sm:gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#A855F715] border border-[#A855F750] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M2 6L4.5 8.5L10 3" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      <span className="text-xs sm:text-sm text-white/65">{b}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="self-start btn-glow bg-[#A855F7] hover:bg-[#9333EA] text-white font-semibold text-sm px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl">
                  Explorar {f.tag} →
                </Link>
              </FadeIn>
              <FadeIn direction="right" className="flex-1 w-full max-w-lg">
                <div className="border-glow rounded-2xl overflow-hidden" style={{ boxShadow: "0 20px 80px rgba(168,85,247,0.2)" }}>
                  <div className="bg-[#0A0A0F] p-4 sm:p-5">
                    {f.mockup === "courses" && (
                      <div className="flex flex-col gap-2.5 sm:gap-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-semibold text-white/80">Mis Cursos</span>
                          <span className="text-[10px] sm:text-[11px] bg-[#A855F720] text-[#C084FC] px-2.5 sm:px-3 py-1 rounded-full">+ Nuevo</span>
                        </div>
                        {[
                          { title: "CrossFit Nivel 1", students: 142, completion: 87, color: "#A855F7" },
                          { title: "Nutrición Deportiva", students: 98, completion: 64, color: "#06B6D4" },
                          { title: "Yoga & Wellness", students: 76, completion: 45, color: "#EC4899" },
                          { title: "Entrenamiento Funcional", students: 54, completion: 72, color: "#F59E0B" },
                        ].map(c => (
                          <div key={c.title} className="bg-white/[0.04] rounded-xl p-3 sm:p-3.5 border border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
                              <svg className="w-4 h-4" style={{ color: c.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{c.title}</p>
                              <p className="text-[10px] text-white/30">{c.students} alumnos</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-[10px] text-white/40">{c.completion}%</span>
                              <div className="w-12 sm:w-14 h-1 bg-white/8 rounded-full">
                                <div className="h-1 rounded-full" style={{ width: `${c.completion}%`, background: c.color }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {f.mockup === "members" && (
                      <div className="flex flex-col gap-2.5 sm:gap-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-semibold text-white/80">Miembros</span>
                          <span className="text-xs text-white/25">1,284 activos</span>
                        </div>
                        {[
                          { name: "Ana García", plan: "Profesional", progress: 78, avatar: "AG", color: "#A855F7", active: true },
                          { name: "Carlos Mendoza", plan: "Inicio", progress: 45, avatar: "CM", color: "#06B6D4", active: true },
                          { name: "Laura Pizarro", plan: "Éxito", progress: 92, avatar: "LP", color: "#EC4899", active: true },
                          { name: "Diego Ramírez", plan: "Profesional", progress: 28, avatar: "DR", color: "#F59E0B", active: false },
                        ].map(m => (
                          <div key={m.name} className="bg-white/[0.04] rounded-xl p-3 sm:p-3.5 border border-white/5 flex items-center gap-2.5 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: `${m.color}20`, color: m.color }}>{m.avatar}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{m.name}</p>
                              <p className="text-[10px] text-white/30">{m.plan}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-12 h-1.5 bg-white/8 rounded-full hidden sm:block">
                                <div className="h-1.5 rounded-full" style={{ width: `${m.progress}%`, background: m.color }} />
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.active ? "bg-[#22C55E15] text-[#22C55E]" : "bg-white/5 text-white/25"}`}>{m.active ? "Activo" : "Inactivo"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {f.mockup === "billing" && (
                      <div className="flex flex-col gap-2.5 sm:gap-3">
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-1">
                          {[
                            { label: "Ingresos este mes", val: "$12,480", sub: "+18% vs anterior", color: "#22C55E" },
                            { label: "Cobros pendientes", val: "$840", sub: "6 pagos", color: "#F59E0B" },
                          ].map(s => (
                            <div key={s.label} className="bg-white/[0.04] rounded-xl p-3 sm:p-3.5 border border-white/5">
                              <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
                              <p className="font-[family-name:var(--font-anton)] text-lg sm:text-xl mb-1">{s.val}</p>
                              <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.sub}</span>
                            </div>
                          ))}
                        </div>
                        {["Ana García · $159/mes", "Carlos M. · $49/mes", "Laura P. · $159/mes", "Diego R. · $549/mes"].map((t, i) => (
                          <div key={t} className="bg-white/[0.04] rounded-xl px-3 sm:px-3.5 py-2.5 sm:py-3 border border-white/5 flex items-center justify-between">
                            <span className="text-[11px] text-white/55 truncate mr-2.5">{t}</span>
                            <span className="text-[10px] px-2 sm:px-2.5 py-1 rounded-full flex-shrink-0 font-medium" style={i === 1 ? { background: "#F59E0B15", color: "#F59E0B" } : { background: "#22C55E15", color: "#22C55E" }}>
                              {i === 1 ? "Pendiente" : "Cobrado ✓"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="casos" className="py-20 sm:py-28 border-t border-white/5 scroll-mt-[100px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10 sm:mb-14">
            <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">Testimonios</span>
            <h2 className="font-[family-name:var(--font-anton)] mt-3 leading-[1.1]" style={{ fontSize: "clamp(32px,5vw,52px)" }}>
              Lo que dicen los que<br /><span className="gradient-text">ya lo probaron</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="card-hover rounded-2xl bg-white/[0.03] border border-white/8 p-5 sm:p-7 flex flex-col gap-4 sm:gap-5 h-full">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4" viewBox="0 0 24 24" fill="#A855F7">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed flex-1">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-white/5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: `${t.color}22`, color: t.color }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-white/30">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" className="py-20 sm:py-28 relative scroll-mt-[100px]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(26,5,51,0.6) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-8 sm:mb-10">
            <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">Precios</span>
            <h2 className="font-[family-name:var(--font-anton)] mt-3 mb-3 sm:mb-4 leading-[1.1]" style={{ fontSize: "clamp(32px,5vw,56px)" }}>
              Planes para cada<br /><span className="gradient-text">tamaño de gimnasio</span>
            </h2>
            <p className="text-white/40 text-sm sm:text-base mb-6 sm:mb-8">Sin contratos. Sin sorpresas. Cancela cuando quieras.</p>
            <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1.5">
              <button onClick={() => setAnnual(false)} className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${!annual ? "bg-white text-black font-bold" : "text-white/45 hover:text-white"}`}>
                Mensual
              </button>
              <button onClick={() => setAnnual(true)} className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 ${annual ? "bg-white text-black font-bold" : "text-white/45 hover:text-white"}`}>
                Anual
                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-[#A855F730] text-[#A855F7]">−20%</span>
              </button>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
            {PLANS.map((p, i) => (
              <FadeIn key={p.name} delay={i * 100}>
                <div className={`rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300 ${p.featured ? "border border-[#A855F7]" : "border border-white/10 hover:border-white/25"}`}
                  style={{ background: p.featured ? "linear-gradient(180deg,#1c0840 0%,#0d0d16 100%)" : "#0A0A0F" }}>
                  {p.featured && (
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #A855F7, transparent)" }} />
                  )}
                  {p.badge && (
                    <div className="absolute -right-7 top-4 bg-[#A855F7] text-white text-[10px] font-bold px-8 py-1.5 rotate-45">
                      {p.badge}
                    </div>
                  )}
                  <div className="p-5 sm:p-7 flex flex-col gap-4 sm:gap-6">
                    <div>
                      <h3 className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl mb-1">{p.name}</h3>
                      <p className="text-xs sm:text-sm text-white/40">{p.desc}</p>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-[family-name:var(--font-anton)] text-[44px] sm:text-[52px] leading-none">${annual ? p.annual : p.monthly}</span>
                      <span className="text-xs sm:text-sm text-white/35 mb-2">/mes</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-[#22C55E] -mt-2 sm:-mt-4 font-medium">Ahorras ${(p.monthly - p.annual) * 12} USD al año</p>
                    )}
                    <div className="h-px bg-white/5" />
                    <ul className="flex flex-col gap-2.5 sm:gap-3">
                      {p.features.map(feat => (
                        <li key={feat} className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-[#A855F715] border border-[#A855F745] flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5"><path d="M1.5 5L3.5 7L8.5 2.5" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                          <span className="text-xs sm:text-sm text-white/60">{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={p.href} className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold text-center transition-all duration-200 block ${p.featured ? "btn-glow bg-[#A855F7] text-white hover:bg-[#9333EA]" : "bg-white/5 text-white border border-white/15 hover:border-white/30 hover:bg-white/8"}`}>
                      {p.cta}
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300} className="text-center mt-6 sm:mt-8">
            <p className="text-xs text-white/25">
              ¿Necesitas más de 5,000 miembros o funciones enterprise?{" "}
              <Link href="/contact" className="text-[#A855F7] hover:underline">Habla con nosotros →</Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-10 sm:mb-12">
            <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">FAQ</span>
            <h2 className="font-[family-name:var(--font-anton)] mt-3 leading-[1.1]" style={{ fontSize: "clamp(30px,5vw,48px)" }}>
              Preguntas frecuentes
            </h2>
          </FadeIn>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${openFaq === i ? "border-[#A855F740] bg-[#A855F708]" : "border-white/8 hover:border-white/15"}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-left gap-4 cursor-pointer">
                    <span className="text-sm sm:text-base font-medium">{item.q}</span>
                    <span className={`text-[#A855F7] text-2xl leading-none flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-white/50 leading-relaxed border-t border-white/5 pt-3 sm:pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 120% 110% at 50% 110%, #2d0e5a 0%, #180638 25%, #050507 60%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none animate-pulse-glow" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 65%)", filter: "blur(80px)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-5 sm:gap-6">
          <FadeIn>
            <div className="flex items-center gap-2.5 border border-[#A855F740] bg-[#A855F712] rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse-glow" />
              <span className="text-[#C084FC] text-xs font-medium">14 días gratis · Sin tarjeta · Setup en 10 min</span>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h2 className="font-[family-name:var(--font-anton)] leading-[1.05]" style={{ fontSize: "clamp(38px,7vw,72px)" }}>
              <span className="gradient-text">¿Listo para transformar</span><br />
              <span className="text-white">tu gimnasio?</span>
            </h2>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-white/50 text-base sm:text-lg max-w-lg leading-relaxed">
              Únete a más de 500 gimnasios que ya digitalizaron su academia con Formia. El setup toma menos de 10 minutos.
            </p>
          </FadeIn>
          <FadeIn delay={240}>
            <Link href="/register" className="btn-glow bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-4 sm:py-5 rounded-2xl mt-2">
              Empezar gratis hoy →
            </Link>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="text-xs text-white/20">Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español</p>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-10 sm:gap-12 mb-10 sm:mb-12">
            <div className="flex flex-col gap-3 sm:gap-4 max-w-xs">
              <Image src="/logo-light.png" alt="Formia" width={460} height={116} className="h-28 w-auto object-contain object-left" />
              <p className="text-sm text-white/30 leading-relaxed">El LMS diseñado específicamente para gimnasios modernos. Crea, vende y fideliza con una sola plataforma.</p>
              <div className="flex gap-2.5 sm:gap-3">
                <a href="#" aria-label="X" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" aria-label="Instagram" className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-8 sm:gap-16">
              {[
                { title: "Producto", links: ["Características", "Precios", "Integraciones", "Actualizaciones"] },
                { title: "Empresa", links: ["Sobre nosotros", "Blog", "Carreras", "Contacto"] },
                { title: "Recursos", links: ["Documentación", "API Reference", "Comunidad", "Soporte"] },
                { title: "Legal", links: ["Privacidad", "Términos de uso", "Cookies"] },
              ].map(col => (
                <div key={col.title} className="flex flex-col gap-2.5 sm:gap-3">
                  <h4 className="text-[10px] font-bold text-white/50 tracking-[2.5px] uppercase">{col.title}</h4>
                  {col.links.map(link => (
                    <a key={link} href="#" className="text-xs sm:text-sm text-white/25 hover:text-white/65 transition-colors">{link}</a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/20">© 2025 Formia · Yelau Group · Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/30 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Español
              </span>
              <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">English</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
