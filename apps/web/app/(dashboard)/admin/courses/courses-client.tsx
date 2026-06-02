"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BulkEnrollModal } from "@/components/admin/bulk-enroll-modal";
import { UserPlus } from "lucide-react";

interface Props {
  courseId:    string;
  courseTitle: string;
}

export function BulkEnrollButton({ courseId, courseTitle }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
        onClick={() => setOpen(true)}
        title="Inscripción masiva"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Inscribir
      </Button>

      <BulkEnrollModal
        open={open}
        onClose={() => setOpen(false)}
        onEnrolled={() => router.refresh()}
        courseId={courseId}
        courseTitle={courseTitle}
      />
    </>
  );
}
