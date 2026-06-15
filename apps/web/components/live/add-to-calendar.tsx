"use client";

import { CalendarPlus, Chrome, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { googleCalendarUrl, outlookWebUrl } from "@/lib/calendar";

interface AddToCalendarProps {
  id: string;
  title: string;
  scheduledAt: string; // ISO string
  durationMins: number;
  roomUrl?: string | null;
}

export function AddToCalendar({ id, title, scheduledAt, durationMins, roomUrl }: AddToCalendarProps) {
  const startAt = new Date(scheduledAt);
  const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);
  const description = roomUrl ? `Únete a la clase en: ${roomUrl}` : "Clase en directo en Formia";

  const googleUrl = googleCalendarUrl({ title, startAt, endAt, description, location: roomUrl ?? undefined });
  const outlookUrl = outlookWebUrl({ title, startAt, endAt, description, location: roomUrl ?? undefined });
  const icalUrl = `/api/live/${id}/ical`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <CalendarPlus className="w-3.5 h-3.5" />
          Añadir al calendario
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Elige tu calendario
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            {/* Google Calendar color */}
            <span className="w-4 h-4 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                <path fill="#4285F4" d="M21.98 6.35L17.65 2H6.35L2.02 6.35l4.33 4.33H17.65l4.33-4.33z"/>
                <path fill="#34A853" d="M6.35 17.65L2 13.32v4.33L6.35 22h11.3L22 17.65v-4.33l-4.35 4.33H6.35z"/>
                <path fill="#EA4335" d="M2 6.35v6.97l4.35-4.32z"/>
                <path fill="#FBBC04" d="M22 6.35l-4.35 2.65V13l4.35-4.32V6.35z"/>
                <rect fill="#fff" x="6" y="6" width="12" height="12" rx="1"/>
                <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#4285F4">G</text>
              </svg>
            </span>
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
            <Mail className="w-4 h-4 text-[#0078D4]" />
            Outlook (web)
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={icalUrl} download className="flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>
              Descargar .ics
              <span className="block text-[10px] text-muted-foreground font-normal leading-tight">Apple, Outlook desktop…</span>
            </span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
