import { NextResponse } from "next/server";

// Registro público desactivado: asignaba organizationId vía organization.findFirst()
// sin filtro, lo que es inseguro con más de un tenant. Reactivar solo tras
// implementar selección explícita y segura de organización.
export async function POST() {
  return NextResponse.json(
    { error: "El registro público está desactivado. Solicita una invitación a tu organización." },
    { status: 403 },
  );
}
