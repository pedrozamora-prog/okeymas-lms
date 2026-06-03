import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Returns SP metadata XML that the admin uploads to their IdP
export async function GET(_req: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const appUrl = process.env.NEXTAUTH_URL ?? "https://example.com";

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  const spEntityId = `${appUrl}/api/auth/sso/sp`;
  const acsUrl     = `${appUrl}/api/auth/sso/${orgSlug}/callback`;

  const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${spEntityId}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="false"
    WantAssertionsSigned="true"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${acsUrl}"
      index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return new NextResponse(metadata, {
    headers: { "Content-Type": "application/xml" },
  });
}
