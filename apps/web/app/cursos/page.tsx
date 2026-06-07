import Link from "next/link";
import Image from "next/image";
import { Anton } from "next/font/google";
import { BookOpen, Users, Clock, ShoppingCart } from "lucide-react";

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

async function getPublicCourses(): Promise<PublicCourse[]> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/courses/public`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatPrice(price: number | null, currency: string) {
  if (!price) return "Gratis";
  return new Intl.NumberFormat("es-ES", {
    style:    "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(price / 100);
}

export const metadata = { title: "Cursos disponibles — Formia" };

export default async function CursosPage() {
  const courses = await getPublicCourses();

  const totalLessons = (c: PublicCourse) =>
    c.modules.reduce((sum, m) => sum + m._count.lessons, 0);

  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {/* Nav */}
      <header className="border-b border-white/10 bg-[#0C0C0C]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`${anton.className} text-xl`}>
            <span className="text-[#A855F7]">Fit</span>
            <span className="text-white">Academy</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Acceder →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold tracking-widest text-[#A855F7] uppercase">Formación abierta</span>
        </div>
        <h1 className={`${anton.className} text-4xl sm:text-5xl text-white mb-4`}>
          Cursos disponibles
        </h1>
        <p className="text-white/60 text-lg max-w-xl">
          Formación profesional certificada. Compra acceso al curso, complétalo a tu ritmo y obtén tu certificado.
        </p>
      </section>

      {/* Course grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/40 text-lg">No hay cursos disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link
                key={course.id}
                href={`/cursos/${course.id}`}
                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#A855F7]/50 hover:bg-white/8 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-white/5">
                  {course.thumbnailUrl ? (
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#A855F7] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {formatPrice(course.price, course.currency)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-[11px] text-[#A855F7] font-semibold mb-1.5 uppercase tracking-wide">
                    {course.organization.name}
                  </p>
                  <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-[#A855F7] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-white/40 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {totalLessons(course)} lecciones
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course._count.enrollments} alumnos
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-white">
                      {formatPrice(course.price, course.currency)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#A855F7] text-sm font-semibold group-hover:gap-2.5 transition-all">
                      <ShoppingCart className="w-4 h-4" />
                      Comprar
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
