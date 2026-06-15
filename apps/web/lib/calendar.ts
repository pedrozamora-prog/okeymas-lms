export interface CalendarEvent {
  title: string;
  startAt: Date;
  endAt: Date;
  description?: string;
  location?: string;
  uid?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Format date as YYYYMMDDTHHMMSSZ for Google Calendar */
function toGoogleDate(d: Date): string {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/** ISO string without milliseconds for Outlook */
function toOutlookDate(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "");
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(event.startAt)}/${toGoogleDate(event.endAt)}`,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookWebUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: toOutlookDate(event.startAt),
    enddt: toOutlookDate(event.endAt),
    ...(event.description ? { body: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
    path: "/calendar/action/compose",
    rru: "addevent",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

/** Generate iCalendar (.ics) file content */
export function buildIcsContent(event: CalendarEvent): string {
  const uid = event.uid ?? `formia-${Date.now()}@formia.app`;
  const now = toGoogleDate(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Formia//Formia LMS//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${toGoogleDate(event.startAt)}`,
    `DTEND:${toGoogleDate(event.endAt)}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${foldIcs(event.title)}`,
    `UID:${uid}`,
    ...(event.description ? [`DESCRIPTION:${foldIcs(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${foldIcs(event.location)}`] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/** iCal line folding: lines must be ≤75 octets */
function foldIcs(str: string): string {
  return str.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}
