import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [],
});

const C = {
  black:  "#0C0C0C",
  yellow: "#FCE900",
  white:  "#FFFFFF",
  gray:   "#888888",
  light:  "#F5F5F5",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.black,
    padding: 0,
    fontFamily: "Helvetica",
  },
  // Borde exterior decorativo
  outerBorder: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    borderColor: C.yellow,
    borderStyle: "solid",
    opacity: 0.4,
  },
  innerBorder: {
    position: "absolute",
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 0.5,
    borderColor: C.yellow,
    borderStyle: "solid",
    opacity: 0.2,
  },
  // Esquinas decorativas
  cornerTL: { position: "absolute", top: 28,  left: 28,  width: 30, height: 30, borderTopWidth: 2,    borderLeftWidth: 2,   borderColor: C.yellow, borderStyle: "solid" },
  cornerTR: { position: "absolute", top: 28,  right: 28, width: 30, height: 30, borderTopWidth: 2,    borderRightWidth: 2,  borderColor: C.yellow, borderStyle: "solid" },
  cornerBL: { position: "absolute", bottom: 28, left: 28,  width: 30, height: 30, borderBottomWidth: 2, borderLeftWidth: 2,   borderColor: C.yellow, borderStyle: "solid" },
  cornerBR: { position: "absolute", bottom: 28, right: 28, width: 30, height: 30, borderBottomWidth: 2, borderRightWidth: 2,  borderColor: C.yellow, borderStyle: "solid" },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
    paddingVertical: 50,
  },

  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    backgroundColor: C.yellow,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoPlaceholderText: {
    color: C.black,
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },

  certTypeLabel: {
    color: C.yellow,
    fontSize: 9,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: "Helvetica",
  },
  certTitle: {
    color: C.white,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 1,
  },
  certSubtitle: {
    color: C.gray,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 32,
    fontFamily: "Helvetica",
  },

  divider: {
    width: 60,
    height: 1.5,
    backgroundColor: C.yellow,
    marginBottom: 32,
  },

  certifyText: {
    color: C.gray,
    fontSize: 11,
    marginBottom: 12,
    fontFamily: "Helvetica",
    letterSpacing: 0.5,
  },
  studentName: {
    color: C.white,
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  completedText: {
    color: C.gray,
    fontSize: 11,
    marginBottom: 10,
    fontFamily: "Helvetica",
    letterSpacing: 0.5,
  },
  courseName: {
    color: C.yellow,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 0.5,
  },

  divider2: {
    width: 40,
    height: 1,
    backgroundColor: C.yellow,
    opacity: 0.4,
    marginBottom: 32,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  footerCol: {
    alignItems: "center",
    flex: 1,
  },
  footerLine: {
    width: 120,
    height: 0.5,
    backgroundColor: C.gray,
    marginBottom: 6,
  },
  footerLabel: {
    color: C.gray,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  footerValue: {
    color: C.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },

  certId: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#444444",
    fontSize: 7,
    letterSpacing: 1,
    fontFamily: "Helvetica",
  },
});

interface CertificateProps {
  studentName:  string;
  courseName:   string;
  certType:     "COMPLETION" | "PROFESSIONAL";
  issuedAt:     string;
  certId:       string;
  signerName:   string;
  signerTitle:  string;
  logoUrl?:     string;
  orgName:      string;
}

const typeTitle: Record<string, string> = {
  COMPLETION:   "Certificado de Finalización",
  PROFESSIONAL: "Certificado Profesional",
};
const typeSubtitle: Record<string, string> = {
  COMPLETION:   "Diploma de Aprovechamiento",
  PROFESSIONAL: "Acreditación Profesional",
};

export function CertificateDocument({
  studentName, courseName, certType, issuedAt, certId,
  signerName, signerTitle, logoUrl, orgName,
}: CertificateProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative borders */}
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />

        {/* Main content */}
        <View style={styles.content}>
          {/* Logo */}
          {logoUrl ? (
            <Image src={logoUrl} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>O</Text>
            </View>
          )}

          {/* Certificate type */}
          <Text style={styles.certTypeLabel}>
            {typeSubtitle[certType]}
          </Text>
          <Text style={styles.certTitle}>{typeTitle[certType]}</Text>
          <Text style={styles.certSubtitle}>{orgName}</Text>

          <View style={styles.divider} />

          <Text style={styles.certifyText}>Se certifica que</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.completedText}>ha completado satisfactoriamente el curso</Text>
          <Text style={styles.courseName}>{courseName}</Text>

          <View style={styles.divider2} />

          {/* Footer: date + signer */}
          <View style={styles.footer}>
            <View style={styles.footerCol}>
              <View style={styles.footerLine} />
              <Text style={styles.footerLabel}>Fecha de emisión</Text>
              <Text style={styles.footerValue}>{issuedAt}</Text>
            </View>
            <View style={[styles.footerCol, { flex: 0, width: 60 }]} />
            <View style={styles.footerCol}>
              <View style={styles.footerLine} />
              <Text style={styles.footerLabel}>Firmado por</Text>
              <Text style={styles.footerValue}>{signerName}</Text>
              <Text style={[styles.footerLabel, { marginTop: 2 }]}>{signerTitle}</Text>
            </View>
          </View>
        </View>

        {/* Certificate ID */}
        <Text style={styles.certId}>ID: {certId} · Verificable en {orgName}</Text>
      </Page>
    </Document>
  );
}
