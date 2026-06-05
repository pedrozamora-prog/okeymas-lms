"use client";

import { useState } from "react";
import { Anton } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });

const BENEFITS = [
  { icon: "👥", text: "Miembros ilimitados en todas tus sedes" },
  { icon: "🏢", text: "Gestión multi-sede desde un solo panel" },
  { icon: "🎨", text: "White label completo con tu marca" },
  { icon: "🔌", text: "API & Webhooks para integrar cualquier sistema" },
  { icon: "🔐", text: "SSO / SAML para acceso corporativo" },
  { icon: "🧑‍💼", text: "Manager dedicado de onboarding y soporte" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", gym: "", members: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className={`${anton.variable} bg-[#050507] text-[#FAFAFA] min-h-screen`}>
      <style>{`
        .btn-glow{box-shadow:0 0 28px #a855f760;transition:all .2s ease}
        .btn-glow:hover{box-shadow:0 0 48px #a855f790;transform:translateY(-1px)}
        @keyframes pulse-glow{0%,100%{opacity:.5}50%{opacity:1}}
        .animate-pulse-glow{animation:pulse-glow 3s ease-in-out infinite}
      `}</style>

      {/* NAV */}
      <nav className="border-b border-white/5" style={{ backdropFilter: "blur(24px)", background: "rgba(5,5,7,0.88)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[100px] flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo-light.png" alt="Formia" width={380} height={96} className="h-[86px] w-auto object-contain object-left" priority />
          </Link>
          <Link href="/register" className="btn-glow bg-[#A855F7] hover:bg-[#9333EA] text-white text-sm font-bold px-5 py-2.5 rounded-lg">
            Empezar gratis →
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* LEFT — Info */}
          <div className="flex flex-col gap-8">
            <div>
              <span className="text-[#A855F7] text-[11px] font-bold tracking-[3px] uppercase">Plan Éxito</span>
              <h1 className="font-[family-name:var(--font-anton)] mt-3 leading-[1.05]" style={{ fontSize: "clamp(36px,5vw,58px)" }}>
                Hablemos sobre<br />
                <span style={{
                  background: "linear-gradient(135deg,#fff 0%,#e9d5ff 35%,#a855f7 65%,#ec4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>tu cadena de gimnasios</span>
              </h1>
              <p className="mt-4 text-white/50 text-base leading-relaxed">
                El plan Éxito está diseñado para cadenas con múltiples sedes que necesitan control total, white label y un equipo dedicado. Cuéntanos sobre tu negocio y te preparamos una demo personalizada.
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-col gap-3">
              {BENEFITS.map(b => (
                <div key={b.text} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#A855F715] border border-[#A855F730] flex items-center justify-center flex-shrink-0 text-base">
                    {b.icon}
                  </span>
                  <span className="text-sm text-white/65">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => <span key={i} className="text-[#A855F7]">★</span>)}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                "Migramos de 3 herramientas distintas a Formia. Ahorramos $2,400 USD al mes y ahora tenemos visibilidad total de toda la cadena en tiempo real."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#06B6D420] flex items-center justify-center text-sm font-bold text-[#06B6D4]">D</div>
                <div>
                  <p className="text-sm font-semibold">David Medina</p>
                  <p className="text-xs text-white/30">CEO · Cadena FitLife · 12 sedes</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center text-center gap-5 py-10">
                <div className="w-16 h-16 rounded-full bg-[#A855F720] border border-[#A855F750] flex items-center justify-center text-3xl">✓</div>
                <h2 className="font-[family-name:var(--font-anton)] text-3xl">¡Recibido!</h2>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                  Nuestro equipo de ventas te contactará en menos de 24 horas hábiles para coordinar tu demo personalizada.
                </p>
                <Link href="/" className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors underline underline-offset-4">
                  ← Volver al inicio
                </Link>
              </div>
            ) : (
              <>
                <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl mb-1">Solicita tu demo</h2>
                <p className="text-sm text-white/40 mb-6 sm:mb-8">Te respondemos en menos de 24 horas hábiles.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-white/50">Nombre completo *</label>
                      <input
                        required
                        type="text"
                        placeholder="Carlos Rodríguez"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#A855F7] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-white/50">Email corporativo *</label>
                      <input
                        required
                        type="email"
                        placeholder="carlos@migym.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#A855F7] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-white/50">Nombre de tu cadena / gimnasio *</label>
                    <input
                      required
                      type="text"
                      placeholder="Cadena FitLife"
                      value={form.gym}
                      onChange={e => setForm(f => ({ ...f, gym: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#A855F7] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-white/50">¿Cuántos miembros activos tienes?</label>
                    <select
                      value={form.members}
                      onChange={e => setForm(f => ({ ...f, members: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 focus:outline-none focus:border-[#A855F7] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#0A0A0F]">Selecciona un rango</option>
                      <option value="1000-3000" className="bg-[#0A0A0F]">1,000 – 3,000 miembros</option>
                      <option value="3000-10000" className="bg-[#0A0A0F]">3,000 – 10,000 miembros</option>
                      <option value="10000+" className="bg-[#0A0A0F]">Más de 10,000 miembros</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-white/50">¿Qué necesitas resolver con Formia?</label>
                    <textarea
                      rows={4}
                      placeholder="Cuéntanos tus desafíos actuales, qué herramientas usas hoy, cuántas sedes tienes..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#A855F7] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-glow bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all duration-200 mt-2"
                  >
                    {loading ? "Enviando..." : "Solicitar demo personalizada →"}
                  </button>

                  <p className="text-xs text-white/25 text-center">
                    Al enviar aceptas nuestra{" "}
                    <a href="#" className="text-white/40 hover:text-white/60 underline underline-offset-2">política de privacidad</a>.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
