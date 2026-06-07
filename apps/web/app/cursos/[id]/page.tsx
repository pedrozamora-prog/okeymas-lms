"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Anton } from "next/font/google";
import {
  BookOpen, Clock, Users, ChevronRight, Award,
  ShoppingCart, Loader2, CheckCircle2, ArrowLeft,
} from "lucide-react";

const anton = Anton({ weight: "400", subsets: ["latin"] });

interface PublicCourse {
  id:           string;
  title:        string;
  description:  string | null;
  thumbnailUrl: string | null;
  price:        number | null;
  currency:     string;
  organization: { name: string; logoUrl: string | null };
  modules:      { _count: { lessons: number } }[];
  _count:       { enrollments: number };
}

function formatPrice(price: number | null, currency: string) {
  if (!price) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 0,
  }).format(price / 100);
}

type CheckoutState = "idle" | "loading" | "done" | "error";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [email, setEmail]             = useState("");
  const [name, setName]               = useState("");
  const [state, setState]             = useState<CheckoutState>("idle");
  const [errMsg, setErrMsg]           = useState("");

  useEffect(() => {
    fetch("/api/courses/public")
      .then(r => r.json())
      .then((courses: PublicCourse[]) => {
        setCourse(courses.find(c => c.id === id) ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrMsg("");

    try {
      const res = await fetch(`/api/courses/${id}/checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ buyerEmail: email.trim(), buyerName: name.trim() }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErrMsg(data.error ?? "Error al iniciar el pago");
        setState("error");
        return;
      }
      setState("done");
      window.location.href = data.url;
    } catch {
      setErrMsg("Error de red. Inténtalo de nuevo.");
      setState("error");
    }
  }

  const totalLessons = course
    ? course.modules.reduce((sum, m) => sum + m._count.lessons, 0)
    : 0;

  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {/* Nav */}
      <header className="border-b border-white/10 bg-[#0C0C0C]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`${anton.className} text-xl`}>
            <span className="text-[#A855F7]">Fit</span><span className="text-white">Academy</span>
          </Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Acceder →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/cursos" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Todos los cursos
        </Link>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
          </div>
        )}

        {!loading && !course && (
          <div className="text-center py-24">
            <p className="text-white/40 text-lg">Curso no encontrado</p>
          </div>
        )}

        {course && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left — course info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Thumbnail */}
              {course.thumbnailUrl && (
                <div className="relative h-72 rounded-xl overflow-hidden border border-white/10">
                  <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold tracking-widest text-[#A855F7] uppercase mb-2">
                  {course.organization.name}
                </p>
                <h1 className={`${anton.className} text-3xl sm:text-4xl text-white mb-4`}>
                  {course.title}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap gap-5 text-white/50 text-sm mb-6">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {totalLessons} lecciones
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {course._count.enrollments} alumnos inscritos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Certificado incluido
                  </span>
                </div>

                {course.description && (
                  <p className="text-white/70 text-base leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                )}
              </div>

              {/* What you'll learn */}
              <div className="border border-white/10 rounded-xl p-6 space-y-3">
                <h2 className="text-white font-bold text-lg">¿Qué incluye?</h2>
                {[
                  "Acceso completo a todo el contenido del curso",
                  "Lecciones en vídeo, PDF y materiales descargables",
                  "Quizzes para validar tu aprendizaje",
                  "Certificado digital verificable al completar",
                  "Acceso de por vida desde cualquier dispositivo",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-white/70 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#A855F7] flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — checkout card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white/5 border border-white/10 rounded-xl p-6 space-y-5">
                <div className="text-center pb-4 border-b border-white/10">
                  <p className="text-4xl font-black text-white">
                    {formatPrice(course.price, course.currency)}
                  </p>
                  <p className="text-white/40 text-sm mt-1">Pago único · Acceso de por vida</p>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Tu nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Pedro García"
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#A855F7]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                      Tu email <span className="text-[#A855F7]">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="pedro@ejemplo.com"
                      required
                      className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#A855F7]"
                    />
                    <p className="text-white/30 text-[11px]">
                      Te enviaremos las credenciales de acceso a este email.
                    </p>
                  </div>

                  {errMsg && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {errMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "loading" || state === "done"}
                    className="w-full flex items-center justify-center gap-2 bg-[#A855F7] hover:bg-[#9333ea] disabled:opacity-60 text-white font-bold py-3 rounded-lg transition-colors text-sm"
                  >
                    {state === "loading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a pago…</>
                    ) : state === "done" ? (
                      <><CheckCircle2 className="w-4 h-4" /> Pago iniciado</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Comprar ahora · {formatPrice(course.price, course.currency)}</>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-1.5 text-white/30 text-xs">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Pago seguro con Stripe
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <p className="text-white/40 text-xs text-center">¿Ya tienes cuenta?</p>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-1.5 text-[#A855F7] hover:text-white text-sm font-medium transition-colors"
                  >
                    Iniciar sesión <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
