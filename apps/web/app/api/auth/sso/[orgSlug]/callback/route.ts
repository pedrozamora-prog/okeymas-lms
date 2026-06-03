import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ACS — Assertion Consumer Service (IdP posts SAMLResponse here)
export async function POST(req: Request, { params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const appUrl = process.env.NEXTAUTH_URL ?? "https://example.com";

  try {
    const formData    = await req.formData();
    const samlResponse = formData.get("SAMLResponse") as string;

    if (!samlResponse) {
      return NextResponse.redirect(new URL("/login?error=SSONoResponse", appUrl));
    }

    const org = await prisma.organization.findUnique({
      where:   { slug: orgSlug },
      include: { ssoConfig: true },
    });

    if (!org?.ssoConfig?.isEnabled) {
      return NextResponse.redirect(new URL("/login?error=SSONotConfigured", appUrl));
    }

    const config = org.ssoConfig;
    const { SAML } = await import("@node-saml/node-saml");
    const saml = new SAML({
      callbackUrl:          `${appUrl}/api/auth/sso/${orgSlug}/callback`,
      entryPoint:           config.idpSsoUrl,
      issuer:               `${appUrl}/api/auth/sso/sp`,
      cert:                 config.idpCertificate,
      wantAssertionsSigned: false,
      wantAuthnResponseSigned: false,
    });

    const { profile } = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });

    if (!profile) {
      return NextResponse.redirect(new URL("/login?error=SSOInvalidProfile", appUrl));
    }

    // Extract email from profile
    const email = (profile.nameID?.includes("@") ? profile.nameID : profile.email) as string | undefined;
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=SSONoEmail", appUrl));
    }

    // Find or create user in this org
    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), organizationId: org.id },
    });

    if (!user) {
      // Auto-provision: create user if SSO login but no account yet
      user = await prisma.user.create({
        data: {
          name:          (profile.displayName ?? email.split("@")[0]) as string,
          email:         email.toLowerCase(),
          organizationId: org.id,
          isActive:      true,
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.redirect(new URL("/login?error=SSOUserInactive", appUrl));
    }

    // Create one-time SSO token (5 min TTL)
    const token = await prisma.ssoToken.create({
      data: {
        userId:    user.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.redirect(new URL(`/login?ssoToken=${token.id}`, appUrl));
  } catch (err) {
    console.error("[SSO callback]", err);
    return NextResponse.redirect(new URL("/login?error=SSOError", appUrl));
  }
}
