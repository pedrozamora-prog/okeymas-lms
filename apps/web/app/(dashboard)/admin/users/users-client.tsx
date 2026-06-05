"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InviteUserModal } from "@/components/admin/invite-user-modal";
import { UserPlus } from "lucide-react";

interface PendingInvitation {
  id:        string;
  email:     string;
  role:      string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  expired:   boolean;
}

interface Props {
  invitations: PendingInvitation[];
}

export function UsersClient({ invitations: _ }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  function handleSent() {
    router.refresh(); // recarga la lista de invitaciones desde el servidor
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="bg-primary text-yelau-black hover:bg-primary/90 font-bold gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Invitar usuario
      </Button>

      <InviteUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={handleSent}
      />
    </>
  );
}
