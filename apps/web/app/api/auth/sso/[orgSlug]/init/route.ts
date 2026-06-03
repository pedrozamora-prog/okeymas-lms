import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const appUrl = process.env.NEXTAUTH_URL ?? "https://example.com";

  const org = await prisma.organization.findUnique({
    where:   { slug: orgSlug },
    include: { ssoConfig: true },
  });

  if (!org?.ssoConfig?.isEnabled) {
    return NextResponse.redirect(new URL("/login?error=SSONotConfigured", appUrl));
  }

  const config = org.ssoConfig;

  try {
    const { SAML } = await import("@node-saml/node-saml");
    const saml = new SAML({
      callbackUrl:      `${appUrl}/api/auth/sso/${orgSlug}/callback`,
      entryPoint:       config.idpSsoUrl,
      issuer:           `${appUrl}/api/auth/sso/sp`,
      idpCert:          config.idpCertificate,
      wantAssertionsSigned: false,
      wantAuthnResponseSigned: false,
    });

    const redirectUrl = await saml.getAuthorizeUrlAsync("", appUrl, {});
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[SSO init]", err);
    return NextResponse.redirect(new URL("/login?error=SSOError", appUrl));
  }
}
