import { createFileRoute } from "@tanstack/react-router";

const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthNumbers = Object.fromEntries(monthNames.map((name, index) => [name, index + 1]));

function extractAnnualDates(html: string, year: number): string[] {
  const plainText = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ");
  const dates = new Set<string>();
  const expression = new RegExp(`\\b(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+${year}\\b`, "gi");
  for (const match of plainText.matchAll(expression)) {
    const day = Number(match[1]);
    const month = monthNumbers[match[2].toLowerCase()];
    if (day >= 1 && day <= 31) dates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return [...dates].sort();
}

function extractMonthlyDates(html: string, year: number, month: number): string[] {
  const plainText = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ");
  const weddingLabel = "Wedding Days / முகூர்த்தம்";
  const start = plainText.indexOf(weddingLabel);
  if (start < 0) return [];
  const following = plainText.slice(start + weddingLabel.length);
  const end = following.indexOf("Festivals / பண்டிகைகள்");
  const section = end < 0 ? following : following.slice(0, end);
  const dates = new Set<string>();
  const expression = /\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/g;
  for (const match of section.matchAll(expression)) {
    const day = Number(match[1]);
    const monthName = match[2].toLowerCase();
    const monthNumber = monthNames.findIndex((name) => name.startsWith(monthName.slice(0, 3))) + 1;
    if (Number(match[3]) === year && monthNumber === month && day >= 1 && day <= 31) {
      dates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  return [...dates].sort();
}

export const Route = createFileRoute("/api/muhurtham/$year")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const year = Number(params.year);
        const month = Number(new URL(request.url).searchParams.get("month"));
        const maxYear = new Date().getFullYear() + 15;
        if (!Number.isInteger(year) || year < 2025 || year > maxYear || !Number.isInteger(month) || month < 1 || month > 12) {
          return Response.json({ error: "A valid year and month are required." }, { status: 400 });
        }

        try {
          let dates: string[] = [];
          const annualUrl = `https://tamilcalendardailysheet.com/tamil-muhurtham-dates-${year}/`;
          const annualResponse = await fetch(annualUrl, { signal: AbortSignal.timeout(8000) });
          if (annualResponse.ok) dates = extractAnnualDates(await annualResponse.text(), year).filter((date) => Number(date.slice(5, 7)) === month);

          if (!dates.length) {
            const date = `${year}-${String(month).padStart(2, "0")}-01`;
            const monthlyUrl = `https://tamilcalendardailysheet.com/tamil-calendar-today/?cal_date=${date}`;
            const monthlyResponse = await fetch(monthlyUrl, { signal: AbortSignal.timeout(8000) });
            if (monthlyResponse.ok) dates = extractMonthlyDates(await monthlyResponse.text(), year, month);
          }

          if (!dates.length) return Response.json({ error: `Muhurtham dates are not published for ${month}/${year}.` }, { status: 503 });
          return Response.json({ year, month, dates, source: "Tamil Calendar Daily Sheet" }, {
            headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
          });
        } catch {
          return Response.json({ error: "Could not load this month's muhurtham dates." }, { status: 503 });
        }
      },
    },
  },
});
