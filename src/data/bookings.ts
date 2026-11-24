export const eventTypes = [
  "Wedding",
  "Engagement",
  "Wedding Reception",
  "Pre-Wedding Celebrations",
  "Post-Wedding Celebrations",
  "Baby Shower & Seemantham",
  "Naming Ceremony",
  "Birthday Celebrations",
  "Wedding Anniversary",
  "Family Celebrations",
  "Traditional & Religious Functions",
  "Graduation & Convocation",
  "School & College Events",
  "Corporate Events",
  "Business Meetings & Conferences",
  "Retirement & Farewell Functions",
  "Award & Felicitation Ceremonies",
  "Family Reunions",
  "Business Stalls",
] as const;

export const tamilMonths = [
  "சித்திரை", "வைகாசி", "ஆனி", "ஆடி", "ஆவணி", "புரட்டாசி",
  "ஐப்பசி", "கார்த்திகை", "மார்கழி", "தை", "மாசி", "பங்குனி",
] as const;

export type VenueBooking = {
  id: string;
  date: string;
  tamilMonth: string;
  function: (typeof eventTypes)[number];
  customerName: string;
  location: string;
  status: "booked" | "cancelled";
};

const DB_NAME = "mrd-mahal-blog";
const DB_VERSION = 2;
const BOOKINGS_STORE = "bookings";
const BOOKINGS_KEY = "venue-bookings";

// Dates come from the supplied handwritten schedule. Names and locations are sample data.
const seedDates: Array<[string, string]> = [
  ["2026-10-25", "ஐப்பசி"], ["2026-11-01", "ஐப்பசி"], ["2026-11-15", "ஐப்பசி"],
  ["2026-11-22", "கார்த்திகை"], ["2026-11-23", "கார்த்திகை"], ["2026-11-29", "கார்த்திகை"],
  ["2026-12-06", "கார்த்திகை"], ["2026-12-13", "கார்த்திகை"], ["2026-12-14", "கார்த்திகை"], ["2026-12-27", "மார்கழி"],
  ["2027-01-08", "மார்கழி"], ["2027-01-17", "தை"], ["2027-01-24", "தை"],
  ["2027-02-01", "தை"], ["2027-02-10", "தை"], ["2027-02-12", "தை"], ["2027-02-18", "மாசி"],
  ["2027-03-07", "மாசி"], ["2027-04-26", "சித்திரை"],
  ["2027-05-16", "வைகாசி"], ["2027-05-24", "வைகாசி"], ["2027-05-29", "வைகாசி"],
];

const initialBookings: VenueBooking[] = seedDates.map(([date, tamilMonth]) => ({
  id: `schedule-${date}`,
  date,
  tamilMonth,
  function: "Wedding",
  customerName: "Sample Customer",
  location: "Madurai",
  status: "booked",
}));

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("stories")) request.result.createObjectStore("stories");
      if (!request.result.objectStoreNames.contains(BOOKINGS_STORE)) request.result.createObjectStore(BOOKINGS_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open booking storage."));
  });
}

export async function readBookings(): Promise<VenueBooking[]> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(BOOKINGS_STORE, "readwrite");
      const store = tx.objectStore(BOOKINGS_STORE);
      const request = store.get(BOOKINGS_KEY);
      request.onsuccess = () => {
        if (Array.isArray(request.result)) {
          const saved = request.result as VenueBooking[];
          const imported = saved.filter((booking) => booking.id.startsWith("schedule-")).sort((a, b) => a.date.localeCompare(b.date));
          const oldSeedPattern = imported.length === seedDates.length && imported.every((booking, index) => booking.function === eventTypes[index % 4] || booking.function === eventTypes[index % eventTypes.length]);
          const normalized = saved.map((booking, index) => ({
            ...booking,
            tamilMonth: seedDates.find(([date]) => date === booking.date)?.[1] ?? (tamilMonths.includes(booking.tamilMonth as (typeof tamilMonths)[number]) ? booking.tamilMonth : "சித்திரை"),
            function: booking.id.startsWith("schedule-") && oldSeedPattern ? "Wedding" : eventTypes.includes(booking.function as (typeof eventTypes)[number]) ? booking.function : "Wedding",
          }));
          if (JSON.stringify(saved) !== JSON.stringify(normalized)) store.put(normalized, BOOKINGS_KEY);
          resolve(normalized);
        }
        else { store.put(initialBookings, BOOKINGS_KEY); resolve(initialBookings); }
      };
      request.onerror = () => reject(request.error ?? new Error("Could not load bookings."));
      tx.onerror = () => reject(tx.error ?? new Error("Could not load bookings."));
    });
  } finally { db.close(); }
}

export async function writeBookings(bookings: VenueBooking[]): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BOOKINGS_STORE, "readwrite");
      tx.objectStore(BOOKINGS_STORE).put(bookings, BOOKINGS_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save bookings."));
      tx.onabort = () => reject(tx.error ?? new Error("Saving bookings was cancelled."));
    });
    window.dispatchEvent(new Event("mrd-bookings-updated"));
  } finally { db.close(); }
}
