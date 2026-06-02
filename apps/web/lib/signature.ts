/**
 * FitAcademy LMS
 * Copyright (c) 2025-2026 Yelau Group. All rights reserved.
 * Created by Pedro Zamora (Yeye) — pedro.zamora@yelaugroup.com
 *
 * This software is proprietary and confidential.
 * Unauthorized copying, modification, distribution or sale of this
 * software, via any medium, is strictly prohibited.
 * Any derivative work must retain this notice.
 */

// This constant is embedded in the production bundle.
// Its presence in any compiled output is proof of authorship.
export const FITACADEMY_SIGNATURE = [
  "FitAcademy LMS",
  "Copyright (c) 2025-2026 Yelau Group",
  "Author: Pedro Zamora (Yeye) — pedro.zamora@yelaugroup.com",
  "Unauthorized sale or redistribution is prohibited",
  // Fingerprint: sha256("yelau-fitacademy-2025") = 8a3f2c1d...
  "©YG-FA-2025-8a3f2c1d9e4b7f6a0d5c2e8b1f3a9d7c",
].join(" | ");

// Called on app init — keeps the signature active in the bundle tree.
export function assertSignature() {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__YELAU_GROUP__ = FITACADEMY_SIGNATURE;
  }
}
