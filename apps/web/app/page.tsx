import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Formia — El LMS que tu gimnasio necesitaba",
  description: "Crea cursos, gestiona miembros y cobra automáticamente. El LMS diseñado para gimnasios modernos que quieren digitalizar su academia y aumentar ingresos.",
  keywords: ["LMS gimnasio", "plataforma cursos fitness", "gestión miembros gym", "certificaciones deportivas", "software gimnasio"],
  openGraph: {
    title: "Formia — El LMS que tu gimnasio necesitaba",
    description: "Crea cursos, gestiona miembros y cobra automáticamente. Más de 500 gimnasios ya confían en Formia.",
    url: "https://formia.dev",
    siteName: "Formia",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Formia — El LMS que tu gimnasio necesitaba",
    description: "Crea cursos, gestiona miembros y cobra automáticamente. Más de 500 gimnasios ya confían en Formia.",
    site: "@formiadev",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://formia.dev",
  },
};

export default function Page() {
  return <LandingPage />;
}
