import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Building2, CalendarDays, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight,
  Droplets, Facebook, Gem, HeartHandshake, Instagram, Landmark, Linkedin, Mail, MapPin, Menu,
  Maximize2, MessageCircle, Phone, Power, Sparkles, Users, Utensils, Wind, X, Youtube, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { readLatestStories } from "@/data/blogPosts";
import { readBookings, type VenueBooking } from "@/data/bookings";
import { canonicalUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

/* ---------------------------------------------------------------------------
   STATIC ASSETS — found by file name, so it does not matter whether the file in
   src/assets is .jpg / .jpeg / .png / .webp or the old Lovable-style .png.asset.json.
   (Fixes "Failed to resolve import" errors when a file has a different extension.)
--------------------------------------------------------------------------- */
const assetFiles = import.meta.glob("/src/assets/*", { eager: true, import: "default" }) as Record<string, unknown>;
const assetUrl = (base: string, warn = true): string => {
  for (const [path, file] of Object.entries(assetFiles)) {
    const fileName = path.split("/").pop() ?? "";
    if (!fileName.startsWith(`${base}.`)) continue;
    if (typeof file === "string") return file;
    if (file && typeof file === "object" && "url" in file) return String((file as { url: unknown }).url);
  }
  if (warn && import.meta.env.DEV) console.warn(`[assets] "${base}" not found in src/assets`);
  return "";
};
const coupleImageAsset = { url: assetUrl("couple-image", false) };  // old fallback only
const maxHallPhotoAsset = { url: assetUrl("max-hall", false) };  // old fallback only
const miniHallGalleryAsset = { url: assetUrl("mini-hall-gallery", false) };  // old fallback only
const diningAreaGalleryAsset = { url: assetUrl("dining-area-gallery", false) };  // old fallback only
const carParkingGalleryAsset = { url: assetUrl("car-parking-gallery", false) };  // old fallback only
const maxHallAsset = { url: assetUrl("mrd-max-hall") };
const miniHallAsset = { url: assetUrl("mrd-mini-hall-new") };
/* LOGO — put the MAROON logo (MRD · Maharajan Rajammal · Thirumana Maaligai, cropped, TRANSPARENT background) in src/assets as  mrd-mahal-logo.png
   It is shown exactly as it is (no colour filter any more). The size is set in <Header/> (h-14 / md:h-16 / lg:h-20) — keep it in step with .hero-section padding-top in styles.css. */
const logoAsset = { url: assetUrl("mrd-mahal-logo") };
const bannerAsset = { url: assetUrl("mrd-mahal-banner") };
/* BUiZLAB footer logo — put  buizlab-logo-white.png  in src/assets (the old buizlab-white-logo file is only a fallback) */
const buizlabWhiteLogoAsset = { url: assetUrl("buizlab-logo-white", false) || assetUrl("buizlab-white-logo", false) };



/* Event Types section background pattern — put  event-types-bg.jpg  in src/assets */
const eventsBg = assetUrl("event-types-bg", false);
/* Event Types BOOK COVER picture — the open book with the maroon cardboard cover, cream page and ribbon (TRANSPARENT background, no black).
   Put  event-book-cover.webp  (or .png) in src/assets. If the file is missing the cover is drawn with CSS instead. */
const bookBg = assetUrl("event-book-cover");
/* hero banner photo — put the file in src/assets as  hero-banner.jpeg  (.jpg / .png / .webp also fine); old banner is used if it is missing */
const heroBanner = assetUrl("mrd-hero-banner", false) || assetUrl("hero-banner", false) || bannerAsset.url;
/* Our Halls photos — put  hall-max.jpeg  and  hall-mini.jpeg  in src/assets (.jpg / .png / .webp also fine); the old photos are used if a file is missing */
const maxHallImage = assetUrl("hall-max") || maxHallAsset.url;
const miniHallImage = assetUrl("hall-mini") || miniHallAsset.url;

const venueExteriorAsset = assetUrl("venue-exterior", false);  // old fallback only

/* ---------------------------------------------------------------------------
   IMAGE FOLDERS — every section has its OWN folder, so two sections never share a photo.

     src/assets/event-types/   →  "Event Types We Host" book
        wedding-reception · engagement · birthday-party · seemantham
        corporate-event · family-gathering · stall-showcase

     src/assets/venue/         →  "Venue Highlights" cards
        venue-exterior · wedding-couple · max-hall · mini-hall · dining-area · car-parking

     src/assets/blog/          →  "Blog" page (all optional — hall photos are used if a file is missing)
        blog-hero · blog-1 · blog-2 · blog-3 · blog-4

   Any extension works (.jpg .jpeg .png .webp .avif, upper or lower case). The file NAME is what
   matters. If a file is missing, the browser console (F12) tells you exactly which one.
--------------------------------------------------------------------------- */
const fileUrl = (file: unknown): string =>
  typeof file === "string" ? file
  : file && typeof file === "object" && "url" in file ? String((file as { url: unknown }).url)
  : "";

/* Finds a photo by FILE NAME. A folder called  <folderName>  (src/assets/event-types, src/assets/venue ...) is checked first,
   and if the file is not there it is also found directly inside src/assets — so both layouts work.
   Real image files win over old  *.asset.json  files that have the same name. */
const allAssets = import.meta.glob("/src/assets/**/*", { eager: true, import: "default" }) as Record<string, unknown>;
const keyOf = (path: string) => (path.split("/").pop() ?? "").replace(/\.asset\.json$/i, "").replace(/\.[^.]+$/, "").toLowerCase();
const folderLookup = (folderName: string) => {
  const inFolder = new Map<string, string>();
  const anywhere = new Map<string, string>();
  const put = (map: Map<string, string>, key: string, url: string, isJson: boolean) => { if (!isJson || !map.has(key)) map.set(key, url); };
  for (const [path, file] of Object.entries(allAssets)) {
    const url = fileUrl(file); const key = keyOf(path); const isJson = /\.asset\.json$/i.test(path);
    if (!key || !url) continue;
    put(anywhere, key, url, isJson);
    if (path.toLowerCase().includes(`/${folderName}/`)) put(inFolder, key, url, isJson);
  }
  return (name: string) => inFolder.get(name.toLowerCase()) ?? anywhere.get(name.toLowerCase());
};
const eventFolder = folderLookup("event-types");
const venueFolder = folderLookup("venue");
const blogFolder = folderLookup("blog");

/* OUR LEGACY section pictures — put these 4 files ANYWHERE inside src/assets (also in a sub-folder like src/assets/legacy/), any extension:
     qqr                = the envelope background picture (1920 x 870).  (legacy-envelope or mrd-mahal-legacy-bg also work if that is the name you used)
     legacy-aerial      = photo for frame 1  (swaps with legacy-front every 3 seconds)
     legacy-front       = photo for frame 2  (swaps with legacy-aerial every 3 seconds)
     legacy-hall        = photo for the small stamp frame (stays fixed)
   The name only has to START with the given word, so  legacy-hall (1).jpg  also works.
   If one is missing, the browser console (F12) tells you exactly which one. */
const legacyEntries = Object.entries(allAssets)
  .map(([path, file]) => [keyOf(path), fileUrl(file), /\.asset\.json$/i.test(path)] as const)
  .filter(([key, url]) => key && url);
const legacyPick = (names: string[]): string => {
  for (const n of names) {
    const hit = legacyEntries.find(([k, , json]) => k === n && !json) ?? legacyEntries.find(([k]) => k === n) ?? legacyEntries.find(([k]) => k.startsWith(n));
    if (hit) return hit[1];
  }
  if (import.meta.env.DEV) console.warn(`[legacy] "${names[0]}" not found anywhere in src/assets`);
  return "";
};
const legacyBg = legacyPick(["qqr", "legacy-envelope", "mrd-mahal-legacy-bg"]);
const legacyAerial = legacyPick(["legacy-aerial"]);
const legacyFront = legacyPick(["legacy-front"]);
const legacyHall = legacyPick(["legacy-hall"]);

/* Returns the photo for one slot. Event Types: event-types/ first (files you already put in venue/ still work).
   Venue Highlights: venue/ only. Blog: blog/ first, then venue/. Nothing found -> old fallback, or "" (the card shows a placeholder, never a wrong photo). */
const pickImage = (folder: "event-types" | "venue" | "blog", name: string, fallback = ""): string => {
  const found = folder === "venue" ? venueFolder(name)
    : folder === "blog" ? (blogFolder(name) ?? venueFolder(name))
    : (eventFolder(name) ?? venueFolder(name));
  if (!found && import.meta.env.DEV) console.warn(`[images] "${name}" not found in src/assets/${folder}/ — ${fallback ? "using old fallback photo" : "showing placeholder"}`);
  return found || fallback;
};

export const Route = createFileRoute("/")({
  head: () => ({
    links: canonicalUrl("/") ? [{ rel: "canonical", href: canonicalUrl("/")! }] : [],
    meta: [
    { title: "MRD Mahal | Grand Wedding Venue" },
    { name: "description", content: SITE_DESCRIPTION },
    { name: "robots", content: "index,follow" },
    { property: "og:title", content: "MRD Mahal | Grand Wedding Venue" },
    { property: "og:description", content: SITE_DESCRIPTION },
    { property: "og:type", content: "website" },
    ...(heroBanner && SITE_URL ? [{ property: "og:image", content: new URL(heroBanner, `${SITE_URL}/`).toString() }] : []),
    ...(canonicalUrl("/") ? [{ property: "og:url", content: canonicalUrl("/")! }] : []),
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

/* NAV — [label shown in the bar, id of the section it scrolls to]. "Legacy" opens the Our Legacy section (id "about"). */
const nav = [["Legacy","about"],["Mini Hall","mini-hall"],["Max Hall","max-hall"],["Calendar","calendar"],["Book Venue","quick-enquiry"],["Gallery","gallery"],["Blog","blog"]] as const;
const eventTypes = ["Weddings & Receptions","Engagements & Muhurtham Functions","Birthday Parties","Seemantham & Baby Showers","Corporate & Cultural Events","Family Gatherings","Stall showcasing"];
// Static opening cover for the Event Types photo book; event photos turn separately after it opens.
const eventBookCover = pickImage("event-types", "mrd-mahal-opening");
// Event Types photos (same order as `eventTypes`) — files live in src/assets/event-types/
// wedding / birthday / corporate have NO fallback on purpose: a missing file shows a placeholder instead of a wrong photo
const eventImages = [
  pickImage("event-types","wedding-reception"),
  pickImage("event-types","engagement", coupleImageAsset.url),
  pickImage("event-types","birthday-party"),
  pickImage("event-types","seemantham", miniHallGalleryAsset.url),
  pickImage("event-types","corporate-event"),
  pickImage("event-types","family-gathering", carParkingGalleryAsset.url),
  pickImage("event-types","stall-showcase", bannerAsset.url),
] as const;
// which part of each Event Types photo stays in view when it fills the open book (same order as `eventTypes`) — "x% y%".
// the book is wide, so only the up/down part (y) matters: smaller % = show more of the TOP of the photo, bigger % = more of the BOTTOM
const eventFocus = ["50% 50%","50% 36%","50% 55%","50% 38%","50% 45%","50% 55%","50% 55%"] as const;
const eventDescriptions = [
  "Celebrate your big day in a grand, welcoming setting.",
  "Auspicious ceremonies held with tradition and comfort.",
  "Cheerful gatherings for every age.",
  "Warm, family-filled celebrations for the mother-to-be.",
  "Meetings, programmes and cultural evenings.",
  "Reunions and get-togethers, big or small.",
  "Space to showcase and display your stalls.",
] as const;
// which part of each photo stays visible inside the tall card (same order as `gallery` in Index) — "x% y%"
const venueFocus = ["50% 50%","48% 50%","50% 50%","47% 50%","60% 50%","50% 50%"] as const;
// short note shown under each Venue Highlights strip (same order as `gallery` in Index)
const venueTags = ["Aerial view","Wedding stage","Grand celebrations","Intimate functions","Feast area","Ample parking"] as const;
// text shown inside the chip on each Venue Highlights card (same order as `gallery` in Index) — edit these freely
const chipLabels = ["Venue Exterior","Wedding Couple","Max Hall","Mini Hall","Dining Area","Car Parking"] as const;
// Venue Highlights photos (same order as venueFocus / venueTags / chipLabels) — files live in src/assets/venue/
const gallery = [
  [pickImage("venue","venue-exterior", venueExteriorAsset),"Venue Exterior","Aerial view of the MRD Mahal venue exterior and surrounding neighbourhood"],
  [pickImage("venue","wedding-couple", coupleImageAsset.url),"Wedding Couple","Wedding couple in traditional attire on the decorated stage at MRD Mahal"],
  [pickImage("venue","max-hall", maxHallPhotoAsset.url),"Max Hall ","MRD Max Hall interior with decorated stage and guest seating"],
  [pickImage("venue","mini-hall", miniHallGalleryAsset.url),"Mini Hall ","MRD Mini Hall auditorium with rows of seating facing the stage"],
  [pickImage("venue","dining-area", diningAreaGalleryAsset.url),"Dining Area","MRD Mahal dining hall with long tables and blue chairs"],
  [pickImage("venue","car-parking", carParkingGalleryAsset.url),"Car Parking","MRD Mahal spacious car parking area with parked vehicles"],
] as const;
const socialLinks = [
  [Facebook,"Facebook","https://www.facebook.com/mrdmahalmadurai"],
  [Instagram,"Instagram","https://www.instagram.com/mrd_mahal/"],
  [Youtube,"YouTube","https://www.youtube.com/@mrd_mahal_madurai"],
  [Linkedin,"LinkedIn","https://www.linkedin.com/company/maharajan-ambalam-rajammal-thirumana-mahal/"],
  [null,"Pinterest","https://in.pinterest.com/mrdmahalmadurai/"],
] as const;
const benefits = [
  [Landmark,"Traditional & Modern Architecture","Blend of classic elegance and contemporary design"],
  [Utensils,"Separate Dining & Function Areas","Spacious and well-organized spaces"],
  [Zap,"Power Backup & Generator Support","Uninterrupted power supply for your events"],
  [CarFront,"Spacious 360 Parking Facility","Ample parking space for all your guests"],
  [MapPin,"Easy Access Location Near NH85","Conveniently located with easy accessibility"],
  [HeartHandshake,"Friendly Service & 7+ Rooms for Your Stay","Dedicated team to assist you throughout"],
] as const;
const facilities = [
  [Power,"Generator Backup","Uninterrupted power supply throughout your event"],
  [Droplets,"Drinking Water Facility","Clean and purified water available"],
  [Users,"Bride & Groom Rooms","Comfortable private changing rooms"],
  [Sparkles,"Restrooms with Maintenance Support","Well-maintained facilities with support staff"],
  [Gem,"Decoration & Catering Coordination Support","Professional assistance for all your event needs"],
  [Building2,"7+ rooms available for hosts and guests.","room availability, occupancy, and booking terms for your event date."],
] as const;
const testimonials = [
  ["Big marriage Hall with good ambience and has unique design. Dining hall is quite big but not neatly maintained. Surrounding area outside the hall can be kept neatly and cleaner.","Anjan kumar"],
  ["One of the best advantages of MRD Mahal is its location near Teppakulam, which is very easy to access. The mahal is spacious, clean, and suitable for big functions. Parking facilities are decent and well-organized. Overall, it offers good value for the facilities provided.","Nithiskumar"],
  ["This is the best mahal in Theppakulam, Madurai. I hosted my sister’s wedding here, and the ambiance was excellent throughout the event.","suba lakshmi.k"],
  ["Good & wide free place.mess underground,stage in 1st floor,rooms are in 2nd floor and top empty madi.backside toilet.nearly Madurai theppakkulam.&also near as Meenakshi Amman temple.","A Hari Vengadesh (Venky )"],
  ["MRD Mahal is a beautiful place for weddings and family functions. The interiors are elegant, lighting is well done, and the stage setup looks amazing in photos. The ambience feels grand and welcoming. Overall, a great choice for memorable events.","Sri Minimax"],
] as const;

/* ---------------------------------------------------------------------------
   BLOG — dummy posts. Edit / add / delete freely: each post is one object below.
   The list page, the "View Blog" page and the "Related stories" all read from this array.
   Photos: src/assets/blog/blog-1 … blog-4 (optional — hall photos are used if a file is missing).
--------------------------------------------------------------------------- */
export type BlogPost = {
  slug: string; title: string; category: string; date: string; readTime: string; excerpt: string;
  image: string; alt: string; sections: { h: string; p: string[] }[];
};
const blogHeroImage = pickImage("blog", "blog-hero", heroBanner);
export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-choose-the-perfect-wedding-hall-in-madurai",
    title: "How to Choose the Perfect Wedding Hall in Madurai",
    category: "Venue Guide",
    date: "20 October 2026",
    readTime: "5 min read",
    excerpt: "Guest count, location, facilities and service — here is a simple guide to help your family pick the right marriage hall without stress.",
    image: pickImage("blog", "blog-1", maxHallImage),
    alt: "Decorated wedding stage and guest seating inside a grand marriage hall",
    sections: [
      { h: "Start with your guest count", p: [
        "Before visiting any venue, sit down with your family and make a realistic guest list. A hall that looks grand in photos can feel crowded if its seating and dining capacity do not match your numbers.",
        "At MRD Mahal, the Max Hall comfortably accommodates up to 1,000 guests with a separate dining area, while the Mini Hall is ideal for around 200 guests at engagements and family functions.",
      ]},
      { h: "Check the location and access", p: [
        "Elders, relatives from other towns and vendors all need to reach the venue easily. Look for a hall close to main roads, temples and bus routes, and check whether there is enough parking for cars and two-wheelers.",
        "MRD Mahal is located near Teppakulam with easy access from NH85, and has parking space for 60+ vehicles.",
      ]},
      { h: "Look closely at the facilities", p: [
        "Power backup, clean restrooms, drinking water, separate bride and groom rooms and guest rooms make a big difference on the day. Ask to see these areas, not just the stage.",
        "Also ask whether the hall helps with coordination for decoration and catering, because that saves your family many phone calls.",
      ]},
      { h: "Visit in person before you book", p: [
        "Photos never tell the whole story. Visit at the same time of day as your muhurtham, walk through the hall, the dining area and the rooms, and clearly note down the available dates, pricing and booking terms.",
      ]},
    ],
  },
  {
    slug: "wedding-checklist-things-to-finalise-before-the-muhurtham",
    title: "Wedding Checklist: Things to Finalise Before the Muhurtham",
    category: "Wedding Planning",
    date: "12 October 2026",
    readTime: "4 min read",
    excerpt: "A practical, month-by-month checklist so that nothing is forgotten when the big day arrives.",
    image: pickImage("blog", "blog-2", gallery[1][0] || heroBanner),
    alt: "Wedding couple in traditional attire on a decorated stage",
    sections: [
      { h: "3–6 months before", p: [
        "Fix the muhurtham date with your priest and book the venue immediately, because auspicious dates fill up very fast. Finalise the budget and a first guest list at the same time.",
        "Book the key vendors early: caterer, decorators, photographer, nadaswaram and band, and the priest.",
      ]},
      { h: "1–2 months before", p: [
        "Print and send invitations, confirm the menu with a tasting, and decide the stage design and flower decoration. Arrange rooms for relatives who are travelling from outside Madurai.",
      ]},
      { h: "The final week", p: [
        "Reconfirm every vendor, prepare a printed schedule for the family, and keep all pooja items, jewellery and documents packed in one place. Assign one trusted person from the family to coordinate with the hall team on the day.",
        "A calm family and a clear plan are the best wedding gift you can give yourselves.",
      ]},
    ],
  },
  {
    slug: "traditional-tamil-wedding-rituals-explained",
    title: "Traditional Tamil Wedding Rituals Explained",
    category: "Tradition & Culture",
    date: "28 September 2026",
    readTime: "6 min read",
    excerpt: "From Kashi Yatra to Arundhati Darshan — a friendly walk-through of the beautiful ceremonies of a Tamil wedding.",
    image: pickImage("blog", "blog-3", heroBanner),
    alt: "Golden wedding mandapam stage decorated with flower garlands",
    sections: [
      { h: "The pre-wedding rituals", p: [
        "A Tamil wedding begins with Nichayathartham, the formal engagement where both families exchange gifts and confirm the alliance. On the wedding eve, the Reception and Janavasam welcome the groom with music and celebration.",
      ]},
      { h: "The muhurtham day", p: [
        "Kashi Yatra, Oonjal and Maalai Maatral (the exchange of garlands) bring joy and playful fun to the morning. Then comes the most sacred moment — Mangalyadharanam, when the groom ties the thaali around the bride’s neck while the nadaswaram plays.",
        "The couple then takes Saptapadi, seven steps together, promising to support each other for life.",
      ]},
      { h: "Ammi Mithithal and Arundhati Darshan", p: [
        "The bride’s foot is placed on the grinding stone (Ammi Mithithal) as a symbol of strength, and the couple is shown the star Arundhati, a symbol of loyalty and a steady married life.",
        "A hall with a spacious stage and good ventilation helps every one of these rituals flow smoothly, with all your guests able to see and join in.",
      ]},
    ],
  },
  {
    slug: "how-to-plan-a-stress-free-engagement-function",
    title: "How to Plan a Stress-Free Engagement Function",
    category: "Engagement Ideas",
    date: "15 September 2026",
    readTime: "4 min read",
    excerpt: "Smaller guest list, same joy. Simple tips to plan an elegant engagement in a cosy hall.",
    image: pickImage("blog", "blog-4", miniHallImage),
    alt: "Mini hall with flower decorated stage and cream chairs on both sides of the aisle",
    sections: [
      { h: "Choose the right size of hall", p: [
        "An engagement is usually a close family event, so you do not need a very large hall. A cosy, elegant space keeps the atmosphere warm and the budget under control.",
        "The MRD Mini Hall seats around 200 guests and offers the same premium facilities as our main hall.",
      ]},
      { h: "Keep the schedule simple", p: [
        "Plan the exchange of plates, ring ceremony and photographs in a clear order, and share the timings with both families in advance. A short, well-managed programme keeps elders comfortable and guests happy.",
      ]},
      { h: "Focus on decoration and food", p: [
        "A simple floral stage in your favourite colours and a well-planned menu are enough to make the day memorable. Ask your venue to help with decoration and catering coordination so you can enjoy your own function.",
      ]},
    ],
  },
];

function scrollTo(id:string) { document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); }

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden="true"><path d="M12.04 2C6.58 2 2.14 6.43 2.14 11.89c0 1.75.46 3.46 1.33 4.97L2 22l5.27-1.38a9.88 9.88 0 0 0 4.76 1.21h.01c5.46 0 9.89-4.44 9.89-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.4c0-4.56 3.72-8.27 8.28-8.27a8.22 8.22 0 0 1 5.85 2.42 8.22 8.22 0 0 1 2.42 5.85c0 4.56-3.72 8.27-8.28 8.27Zm4.54-6.19c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.57.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.25-.02-.39.11-.52.11-.11.25-.29.37-.43.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.12.17 1.77 2.7 4.28 3.79.6.26 1.06.42 1.42.54.6.19 1.15.16 1.58.1.48-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.11-.23-.17-.48-.3Z"/></svg>;
}

/* Reads the part after # in the address bar (#about, #blog, #blog/some-post) — this is how Home <-> Blog <-> a blog post is switched */
function useHash() {
  const [hash,setHash]=useState("");
  useEffect(()=>{
    const read=()=>{let h=window.location.hash.replace(/^#/,"");try{h=decodeURIComponent(h)}catch{}setHash(h)};
    read(); window.addEventListener("hashchange",read);
    return()=>window.removeEventListener("hashchange",read);
  },[]);
  return hash;
}

/* HEADER — sandal bar with a gold stroke. The MAROON logo (transparent png) sits at the left corner, shown exactly as designed (no filter).
   The inner row uses the shared "section-shell" so the logo lines up with the left edge of every section. */
function Header({isBlog}:{isBlog:boolean}) {
  const [scrolled,setScrolled] = useState(false); const [open,setOpen] = useState(false); const [active,setActive] = useState("about");
  useEffect(() => {
    const onScroll=()=>setScrolled(window.scrollY>40); onScroll(); window.addEventListener("scroll",onScroll);
    let observer:IntersectionObserver|null=null;
    if(!isBlog){
      observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setActive(e.target.id)}),{rootMargin:"-30% 0px -60%"});
      nav.forEach(([,id])=>{const el=document.getElementById(id);if(el)observer!.observe(el)});
    }
    return()=>{window.removeEventListener("scroll",onScroll);observer?.disconnect()};
  },[isBlog]);
  const current=isBlog?"blog":active;
  const quoteUrl="https://wa.me/918220013444?text=Hello%2C%20I%20am%20interested%20in%20booking%20MRD%20Mahal%20for%20an%20upcoming%20event.%20Kindly%20share%20the%20available%20dates%2C%20venue%20details%2C%20pricing%2C%20and%20booking%20terms.%20Thank%20you.";
  return <header className={`nav-frame fixed inset-x-0 top-0 z-40 transition-all duration-500 ${scrolled?"py-2.5 shadow-lg":"py-3 md:py-4"}`}>
    <div className="section-shell flex items-center justify-between gap-4">
      <a href="#top" onClick={()=>setOpen(false)} className="flex shrink-0 items-center" aria-label="MRD Mahal home">
        <img src={logoAsset.url} alt="MRD – Maharajan Rajammal Thirumana Maaligai" width={1219} height={391} className="nav-logo h-14 w-auto object-contain md:h-16 lg:h-20"/>
      </a>
      <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Main navigation">{nav.map(([label,id])=><a key={id} href={`#${id}`} className={`border-b-2 pb-0.5 text-sm font-semibold tracking-wide transition-colors ${current===id?"border-[#b88a2c] text-wine":"border-transparent text-primary hover:border-[#b88a2c]/60 hover:text-wine"}`}>{label}</a>)}</nav>
      <Button asChild className="hidden h-11 rounded-none border border-[#b88a2c] bg-primary px-6 text-primary-foreground shadow-sm hover:bg-wine lg:inline-flex"><a href={quoteUrl} target="_blank" rel="noopener noreferrer" aria-label="Get Quote on WhatsApp"><WhatsAppMark/>Get Quote</a></Button>
      <Button variant="ghost" size="icon" className="min-h-11 min-w-11 text-primary hover:bg-primary/10 hover:text-primary lg:hidden" aria-label={open?"Close menu":"Open menu"} onClick={()=>setOpen(!open)}>{open?<X className="size-7"/>:<Menu className="size-7"/>}</Button>
    </div>
    {open&&<nav className="border-t-2 border-[#b88a2c] bg-[#f4e8cb] px-5 py-5 lg:hidden" aria-label="Mobile navigation">{nav.map(([label,id])=><a key={id} href={`#${id}`} onClick={()=>setOpen(false)} className={`block border-b border-[#b88a2c]/40 py-3 font-semibold ${current===id?"text-wine":"text-primary"}`}>{label}</a>)}<Button asChild className="mt-5 h-11 w-full rounded-none bg-primary text-primary-foreground hover:bg-wine"><a href={quoteUrl} target="_blank" rel="noopener noreferrer" aria-label="Get Quote on WhatsApp"><WhatsAppMark/>Get Quote</a></Button></nav>}
  </header>
}

function SectionTitle({children,light=false}:{children:string;light?:boolean}) { return <h2 className={`display-heading text-[clamp(2.7rem,6vw,5.8rem)] ${light?"text-primary-foreground":"text-primary"}`}>{children}</h2> }

/* Event Types — ONE photo runs across the whole open book (left page = left half, right page = right half),
   edge to edge. A missing / broken file shows a placeholder, not alt text. */
function SpreadPhoto({src,alt,side,pos}:{src?:string;alt:string;side:"left"|"right";pos?:string}) {
  const [failed,setFailed]=useState(!src);
  useEffect(()=>{setFailed(!src)},[src]);
  if(failed) return <div className={`pb-spread pb-spread-${side}`}><span className="photo-book-placeholder" role="img" aria-label={alt}><span>{side==="left"?alt:""}</span></span></div>;
  return <div className={`pb-spread pb-spread-${side}`}>
    <img className="pb-spread-img" src={src} alt={alt} draggable={false} decoding="async" style={{objectPosition:pos??"50% 50%"}} onError={()=>setFailed(true)}/>
  </div>;
}

/* Event Types — real page-turning book.
   Every page is its own "leaf" hinged at the spine: only the page you turn opens,
   the rest of the book stays flat and still (turned pages lie under the left page, upcoming pages under the right page).
   leaf k  →  front = text of event k-1  |  back = photo of event k   (leaf 0 front = cover)
   Desktop: the maroon hard-cover book picture (transparent background) is behind the pages; the pages turn on top of it.
   Mobile : the SAME photo runs across the top page AND the bottom page (title sits on the photo); the cover is drawn with CSS.
   AUTO FLIP: while the book is on screen it turns to the next page every AUTO_FLIP_MS (3 seconds) and goes back to the first page after the last one.
   The timer restarts after every page change (also manual ones) and waits while a finger / mouse button is pressed on the book. */
const AUTO_FLIP_MS = 3000;   // change this number (milliseconds) to make the book flip faster / slower
function PhotoBook({items,label,cover}:{items:readonly (readonly [string,string,string])[];label:string;cover:string}) {
  const total=items.length;
  const [turn,setTurn]=useState({index:0,from:0}); const {index,from}=turn;
  const [coverVisible,setCoverVisible]=useState(true);
  const isOpeningCover=coverVisible;
  const drag=useRef<number|null>(null);
  const suppressClick=useRef(false);
  const ref=useRef<HTMLDivElement>(null); const [visible,setVisible]=useState(false); const [inView,setInView]=useState(false); const [paused,setPaused]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{const hit=entries.some(e=>e.isIntersecting);setInView(hit);if(hit)setVisible(true)},{threshold:0.15});observer.observe(el);return()=>observer.disconnect()},[]);
  const go=(n:number)=>setTurn(t=>{const next=Math.max(0,Math.min(total-1,n));return next===t.index?t:{index:next,from:t.index}});
  const returnToCover=()=>{setTurn({index:0,from:0});setCoverVisible(true)};
  // The cover opens directly to Weddings; event spreads turn one by one, then return straight to the cover.
  useEffect(()=>{
    if(!inView||paused||total<2)return;
    if(typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setTimeout(()=>{
      if(coverVisible){setCoverVisible(false);setTurn({index:0,from:0});return}
      if(index>=total-1){returnToCover();return}
      go(index+1);
    },AUTO_FLIP_MS);
    return()=>window.clearTimeout(timer);
  },[inView,paused,index,total,coverVisible]);
  // when jumping several spreads (dots), the pages in between turn one after another
  const lo=Math.min(from,index); const hi=Math.max(from,index); const goingNext=index>=from;
  return <div
    ref={ref}
    className={`photo-book ${visible?"is-visible":""}${isOpeningCover?" is-opening":""}`}
    role="region"
    aria-roledescription="carousel"
    aria-label={label}
    tabIndex={0}
    onKeyDown={e=>{if(e.key==="ArrowRight"){e.preventDefault();if(isOpeningCover){setTurn({index:0,from:0});setCoverVisible(false)}else if(index>=total-1)returnToCover();else go(index+1)}else if(e.key==="ArrowLeft"){e.preventDefault();if(!isOpeningCover){if(index===0)returnToCover();else go(index-1)}}}}
    onPointerDown={e=>{drag.current=e.clientX;suppressClick.current=false;setPaused(true);e.currentTarget.setPointerCapture(e.pointerId)}}
    onPointerUp={e=>{
      const start=drag.current;drag.current=null;setPaused(false);if(start===null)return;
      const dx=e.clientX-start;if(Math.abs(dx)<=50)return;
      suppressClick.current=true;window.setTimeout(()=>{suppressClick.current=false},500);
      if(isOpeningCover){if(dx<0){setTurn({index:0,from:0});setCoverVisible(false)}return}
      if(dx<0){if(index>=total-1)returnToCover();else go(index+1)}
      else if(index===0)returnToCover();else go(index-1);
    }}
    onPointerCancel={()=>{drag.current=null;setPaused(false)}}
    onPointerLeave={()=>{drag.current=null;setPaused(false)}}
  >
    <div className={`photo-book-stage ${bookBg?"has-bg":"no-bg"}${isOpeningCover?" is-opening":""}`}>
      {bookBg&&<img className="pb-stage-bg" src={bookBg} alt="" aria-hidden="true" width={1536} height={783} loading="lazy" decoding="async" draggable={false}/>}
      {/* book cover under the pages + ribbon bookmark with heart charm hanging below the book (mobile, or desktop when the cover picture is missing) */}
      <div className="pb-cover-base" aria-hidden="true"/>
      <div className="pb-page-block" aria-hidden="true"/>
      <svg className="pb-ribbon" viewBox="0 0 40 132" aria-hidden="true">
        <defs>
          <linearGradient id="pbRibbon" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#5a0a12"/><stop offset=".5" stopColor="#a31f2c"/><stop offset="1" stopColor="#5a0a12"/></linearGradient>
          <linearGradient id="pbGold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fbe39a"/><stop offset=".55" stopColor="#d9a63c"/><stop offset="1" stopColor="#a8771a"/></linearGradient>
        </defs>
        <path d="M9 0h22l-1.5 74H10.5z" fill="url(#pbRibbon)"/>
        <path d="M9.2 0l1.4 74M30.8 0l-1.4 74" stroke="#e8bd55" strokeWidth="1.1" fill="none"/>
        <circle cx="20" cy="80" r="4.6" fill="none" stroke="url(#pbGold)" strokeWidth="2"/>
        <path d="M20 126C5 113 3.5 96 12.5 92c4.2-1.8 7.5.8 7.5 4 0-3.2 3.3-5.8 7.5-4 9 4 7.5 21-7.5 34z" fill="url(#pbGold)" stroke="#8a6212" strokeWidth=".8"/>
        <path d="M20 118C10 109 9 98 14 96c3-1 6 .7 6 3.4 0-2.7 3-4.4 6-3.4 5 2 4 13-6 22z" fill="none" stroke="#fff3c4" strokeWidth=".9" strokeDasharray="1.4 1.6" opacity=".9"/>
      </svg>
      <div className="pb-book">
        {Array.from({length:total+1},(_,k)=>{
          const p=k-index; // 0 = page on the left of the open spread, 1 = page on the right, >1 = waiting, <0 = already turned
          const state=p===0?"is-left":p===1?"is-right":p>1?"is-stack-right":"is-stack-left";
          const n=p>1?p-2:p<0?-p-1:0; // depth inside the side stacks
          const flipping=from!==index&&k>lo&&k<=hi;
          const rank=goingNext?k-lo-1:hi-k;
          const style={"--n":n,transitionDelay:flipping?`${Math.min(rank*110,660)}ms`:"0ms"} as CSSProperties;
          const front=k>=1?items[k-1]:undefined; // [photo,title,text] shown on the right-hand side
          const back=k<total?items[k]:undefined; // photo shown on the left-hand side after the page is turned
          return <div key={k} className={`pb-leaf ${state}${n>=2?" is-far":""}${n>=2?" is-far-m":""}`} style={style}>
            {/* FRONT — text page (on mobile: lower half of the photo + title) */}
            <div className="pb-face pb-face-front" aria-hidden={p!==1}>
              {front&&<SpreadPhoto src={front[0]} alt={front[1].trim()} side="right" pos={eventFocus[k-1]}/>}
              {front?<div className="pb-text">
                <div className="pb-caption">
                  <span className="photo-book-folio">{String(k).padStart(2,"0")} / {String(total).padStart(2,"0")}</span>
                  <span className="mt-2 block h-px w-10 bg-gold" aria-hidden="true"/>
                  <h3 className="display-heading mt-2 text-xl leading-tight md:text-2xl lg:text-3xl">{front[1].trim()}</h3>
                  <p className="mt-2 hidden max-w-xs text-sm leading-6 sm:block">{front[2]}</p>
                </div>
              </div>:<div className="pb-cover"><span>{label}</span></div>}
              <span className="pb-dim" aria-hidden="true"/>
              {p===1&&front&&<button type="button" className="pb-hit" aria-label={index>=total-1?"Return to MRD Mahal cover":`Turn to ${items[index+1][1].trim()}`} onClick={()=>index>=total-1?returnToCover():go(index+1)}/>}
              {p>=2&&front&&<button type="button" tabIndex={-1} className="pb-hit" aria-label={`Open ${front[1].trim()}`} onClick={()=>go(k-1)}/>}
            </div>
            {/* BACK — photo page (on mobile: upper half of the photo) */}
            <div className="pb-face pb-face-back" aria-hidden={p!==0}>
              {back?<SpreadPhoto src={back[0]} alt={back[1].trim()} side="left" pos={eventFocus[k]}/>:<div className="pb-blank"/>}
              <span className="pb-dim" aria-hidden="true"/>
              {p<=-1&&back&&<button type="button" tabIndex={-1} className="pb-hit" aria-label={`Open ${back[1].trim()}`} onClick={()=>go(k)}/>}
              {p===0&&index>0&&<button type="button" tabIndex={-1} className="pb-hit" aria-label="Turn back one page" onClick={()=>go(index-1)}/>}
            </div>
          </div>
        })}
      </div>
      <div className={`pb-opening-cover${isOpeningCover?" is-active":""}`} aria-hidden={!isOpeningCover}>
        <img src={cover} alt="" draggable={false} fetchPriority="high" decoding="async"/>
        <button type="button" className="pb-opening-hit" tabIndex={isOpeningCover?0:-1} aria-label={`Open ${items[0][1].trim()}`} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}setTurn({index:0,from:0});setCoverVisible(false)}}/>
      </div>
    </div>
    <div className="photo-book-controls">
      <Button type="button" variant="outline" size="icon" className="size-11 rounded-full" aria-label="Previous page" disabled={isOpeningCover} onClick={()=>index===0?returnToCover():go(index-1)}><ChevronLeft aria-hidden="true"/></Button>
      <div className="flex items-center gap-1" aria-label="Select page">
        <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full p-0" aria-label="Show MRD Mahal cover" aria-current={isOpeningCover?"true":undefined} onClick={returnToCover}><span aria-hidden="true" className={`size-2.5 rounded-full border border-primary ${isOpeningCover?"bg-primary":"bg-transparent"}`}/></Button>
        {items.map(([,title],i)=><Button key={title} type="button" variant="ghost" size="icon" className="size-8 rounded-full p-0" aria-label={`Show ${title.trim()}`} aria-current={!isOpeningCover&&index===i?"true":undefined} onClick={()=>{setTurn(t=>({index:i,from:t.index}));setCoverVisible(false)}}><span aria-hidden="true" className={`size-2.5 rounded-full border border-primary ${!isOpeningCover&&index===i?"bg-primary":"bg-transparent"}`}/></Button>)}
      </div>
      <Button type="button" variant="outline" size="icon" className="size-11 rounded-full" aria-label="Next page" onClick={()=>isOpeningCover?(setTurn({index:0,from:0}),setCoverVisible(false)):index===total-1?returnToCover():go(index+1)}><ChevronRight aria-hidden="true"/></Button>
    </div>
    <p className="sr-only" aria-live="polite">{isOpeningCover?"MRD Mahal cover":`Page ${index+1} of ${total}: ${items[index][1].trim()}`}</p>
  </div>
}

/* Venue Highlights — image with safe fallback (no broken-image alt text leaking into the card) */
function VenueCardImage({src,alt,label,pos}:{src?:string;alt:string;label:string;pos?:string}) {
  const [failed,setFailed]=useState(!src);
  useEffect(()=>{setFailed(!src)},[src]);
  if(failed) return <span className="venue-card-placeholder" role="img" aria-label={alt}><span className="venue-card-placeholder-text">{label}</span></span>;
  return <img className="venue-card-image" src={src} alt={alt} loading="lazy" draggable={false} style={pos?{objectPosition:pos}:undefined} onError={()=>setFailed(true)}/>;
}

/* Venue Highlights — tall photo strips (desktop: one row, mobile: swipe row) */
function VenueStrips({items,onView}:{items:readonly (readonly [string,string,string])[];onView:(i:number)=>void}) {
  const ref=useRef<HTMLDivElement>(null); const [visible,setVisible]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{threshold:0.15});observer.observe(el);return()=>observer.disconnect()},[]);
  return <div>
    <div ref={ref} className={`venue-film ${visible?"is-visible":""}`} role="list" aria-label="Venue highlights">
      {items.map(([src,title,text],i)=>{
        const style={"--d":`${i*90}ms`} as CSSProperties;
        return <figure key={title} role="listitem" className="venue-card" style={style}>
          <button type="button" className="venue-card-hit" aria-label={`View full ${title.trim()} photo`} onClick={()=>onView(i)}>
            <span className="venue-card-frame">
              <VenueCardImage src={src} alt={text} label={title.trim()} pos={venueFocus[i]}/>
              <span className="venue-card-chip" aria-hidden="true">{chipLabels[i]??title.trim()}</span>
            </span>
          </button>
          <figcaption className="venue-card-caption">
            <span className="venue-card-title">{title.trim()}</span>
            <span className="venue-card-sub">{venueTags[i]??""}</span>
          </figcaption>
        </figure>
      })}
    </div>
    <p className="mt-4 text-center text-xs text-muted-foreground md:hidden">Swipe to see more</p>
  </div>
}

/* ---------------------------------------------------------------------------
   OUR LEGACY — photos placed INSIDE the envelope picture (qqr.png, 1920 x 870).
   Frame 1 (big, tilted left)  and  Frame 2 (behind it, tilted right)  swap their two photos every
   LEGACY_SWAP_MS (3 s) with a soft cross-fade while the section is on screen.
   Frame 3 (small stamp, right side) shows the hall photo and does not move.
   The exact position / size / tilt of each frame (measured on the envelope picture) is in styles.css (.legacy-photo-1 / -2 / -3, .legacy-clip-1 / -2).
   Each photo fills its frame edge to edge and is hidden wherever the envelope flap / stamp / other frame covers it.
--------------------------------------------------------------------------- */
const LEGACY_SWAP_MS = 3000;   // change this number (milliseconds) to swap faster / slower
const legacyShots = [
  { src: legacyAerial, alt: "Aerial view of MRD Mahal with the green surroundings and lake of Madurai", pos: "52% 55%" },
  { src: legacyFront, alt: "Front view of the MRD Mahal building with its entrance canopy at sunset", pos: "50% 55%" },
] as const;
function LegacyPhotos() {
  const ref=useRef<HTMLDivElement>(null); const [inView,setInView]=useState(false); const [swapped,setSwapped]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;const observer=new IntersectionObserver(entries=>setInView(entries.some(e=>e.isIntersecting)),{threshold:0.05});observer.observe(el);return()=>observer.disconnect()},[]);
  // automatic swap: every 3 seconds while the picture is on screen
  useEffect(()=>{
    if(!inView)return;
    // always swaps (even when the device has "reduce motion" on — then the photos change without the fade)
    const timer=window.setInterval(()=>setSwapped(s=>!s),LEGACY_SWAP_MS);
    return()=>window.clearInterval(timer);
  },[inView]);
  // slot 0 = frame 1, slot 1 = frame 2 — each slot shows one of the two photos and they trade places on every swap
  const isOn=(slot:number,i:number)=>i===((slot+(swapped?1:0))%2);
  const frame=(slot:number)=>legacyShots.map((s,i)=>s.src?<img key={i} className={`legacy-photo-img${isOn(slot,i)?" is-on":""}`} src={s.src} alt={s.alt} aria-hidden={!isOn(slot,i)} decoding="async" draggable={false} style={{objectPosition:s.pos}}/>:null);
  return <div ref={ref} className="legacy-photos">
    <div className="legacy-clip legacy-clip-2"><div className="legacy-photo legacy-photo-2">{frame(1)}</div></div>
    <div className="legacy-clip legacy-clip-1"><div className="legacy-photo legacy-photo-1">{frame(0)}</div></div>
    <div className="legacy-clip"><div className="legacy-photo legacy-photo-3">{legacyHall&&<img className="legacy-photo-img is-on" src={legacyHall} alt="Decorated MRD Mahal wedding hall with a flower-lined aisle and golden chairs" decoding="async" draggable={false} style={{objectPosition:"50% 60%"}}/>}</div></div>
  </div>
}

/* ---------------------------------------------------------------------------
   BLOG PAGES
--------------------------------------------------------------------------- */
/* blog photo with safe fallback (maroon placeholder instead of broken-image alt text) */
function BlogImage({src,alt,className="blog-fill"}:{src?:string;alt:string;className?:string}) {
  const [failed,setFailed]=useState(!src);
  useEffect(()=>{setFailed(!src)},[src]);
  if(failed) return <span className="venue-card-placeholder" role="img" aria-label={alt}><span className="venue-card-placeholder-text">MRD Mahal</span></span>;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" draggable={false} onError={()=>setFailed(true)}/>;
}

/* Blog hero banner — wedding-hall photo with a maroon shade; the fixed nav bar sits on top of it */
function BlogHero({eyebrow,title,subtitle,children}:{eyebrow:string;title:string;subtitle?:string;children?:ReactNode}) {
  return <section className="blog-hero" aria-labelledby="blog-title">
    {blogHeroImage&&<img className="blog-hero-img" src={blogHeroImage} alt="" aria-hidden="true" width={1671} height={941} fetchPriority="high" decoding="async"/>}
    <div className="blog-hero-shade" aria-hidden="true"/>
    <div className="blog-hero-inner">
      <p className="blog-eyebrow">{eyebrow}</p>
      <h1 id="blog-title" className="display-heading hero-title-gold blog-hero-title">{title}</h1>
      <span className="mx-auto mt-5 block h-px w-24 bg-gold" aria-hidden="true"/>
      {subtitle&&<p className="blog-hero-sub">{subtitle}</p>}
      {children}
    </div>
  </section>
}

function BlogCard({post,featured=false}:{post:BlogPost;featured?:boolean}) {
  const href=`#blog/${post.slug}`;
  const [shareNotice,setShareNotice]=useState("");
  const shareUrl=()=>`${window.location.origin}${window.location.pathname}${href}`;
  const copyStoryLink=async()=>{
    const url=shareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input=document.createElement("textarea");
      input.value=url;
      input.style.position="fixed";
      input.style.opacity="0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setShareNotice("Link copied");
    window.setTimeout(()=>setShareNotice(""),2500);
  };
  const openInstagram=()=>{
    window.open("https://www.instagram.com/","_blank","noopener,noreferrer");
    void copyStoryLink();
  };
  return <article className={`blog-card${featured?" blog-card-featured":""}`}>
    <a href={href} className="blog-card-media" tabIndex={-1} aria-hidden="true">
      <BlogImage src={post.image} alt={post.alt}/>
      <span className="blog-card-tag">{post.category}</span>
    </a>
    <div className="blog-card-body">
      <p className="blog-card-meta"><CalendarDays className="size-3.5" aria-hidden="true"/>{post.date}<span aria-hidden="true">•</span>{post.readTime}</p>
      <h3 className="blog-card-title"><a href={href}>{post.title}</a></h3>
      <p className="blog-card-excerpt">{post.excerpt}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <Button asChild className="mr-4 h-11 rounded-md bg-wine px-5 text-primary-foreground transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-gold"><a href={href} aria-label={`View blog: ${post.title}`}>View Blog<ChevronRight className="size-4" aria-hidden="true"/></a></Button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl()}`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Share ${post.title} on WhatsApp`} title="Share on WhatsApp" className="inline-flex size-10 items-center justify-center rounded-md border border-primary/20 text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><WhatsAppMark/></a>
        <button type="button" onClick={openInstagram} aria-label={`Open Instagram and copy ${post.title} link`} title="Open Instagram (link copied)" className="inline-flex size-10 items-center justify-center rounded-md border border-primary/20 text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><Instagram className="size-4" aria-hidden="true"/></button>
        <button type="button" onClick={copyStoryLink} aria-label={`Copy link to ${post.title}`} title="Copy link" className="inline-flex size-10 items-center justify-center rounded-md border border-primary/20 text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><span aria-hidden="true">⧉</span></button>
        {shareNotice&&<span role="status" className="text-xs text-muted-foreground">{shareNotice}</span>}
      </div>
    </div>
  </article>
}

function BlogCta() {
  return <div className="blog-cta">
    <p className="display-heading text-[clamp(1.7rem,3.6vw,2.6rem)]">Planning your function at MRD Mahal?</p>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-primary-foreground/80">Share your date and requirements with us and we will help you with availability, pricing, facilities and booking terms.</p>
    <Button asChild className="mt-6 h-12 rounded-none border border-gold bg-background px-7 text-primary hover:bg-gold hover:text-primary"><a href="https://wa.me/918220013444?text=Hello%2C%20I%20read%20your%20blog%20and%20would%20like%20to%20enquire%20about%20booking%20MRD%20Mahal.%20Kindly%20share%20the%20available%20dates%2C%20pricing%20and%20booking%20terms.%20Thank%20you." target="_blank" rel="noopener noreferrer" aria-label="Enquire on WhatsApp"><WhatsAppMark/>Enquire on WhatsApp</a></Button>
  </div>
}

function BlogListView({posts}:{posts:BlogPost[]}) {
  const featured=blogPosts[0];
  return <main id="blog">
    <BlogHero eyebrow="MRD Mahal Journal" title="Our Blog" subtitle="Wedding ideas, Tamil traditions and planning tips from our grand marriage hall in Madurai."/>
    <section className="paper-texture bg-parchment py-14 md:py-20">
      <div className="section-shell">
        {featured && <BlogCard post={featured} featured/>}
        <div className="flex items-end justify-between gap-8"><h2 className="display-heading text-[clamp(2rem,4.5vw,3.6rem)] text-primary">Latest Stories</h2><div className="hidden h-px flex-1 bg-gold md:block"/></div>
        {posts.length > 0 ? <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{posts.map(p=><BlogCard key={p.slug} post={p}/>)}</div> : <p className="mt-8 rounded border border-primary/15 bg-background p-8 text-center text-muted-foreground">New stories are coming soon.</p>}
        <div className="mt-16"><BlogCta/></div>
      </div>
    </section>
  </main>
}

function BlogPostView({post,posts}:{post:BlogPost;posts:BlogPost[]}) {
  const related=posts.filter(p=>p.slug!==post.slug).slice(0,3);
  return <main id="blog">
    <BlogHero eyebrow={post.category} title={post.title}>
      <p className="blog-meta"><span><CalendarDays className="size-4" aria-hidden="true"/>{post.date}</span><span aria-hidden="true">•</span><span>{post.readTime}</span><span aria-hidden="true">•</span><span>By MRD Mahal</span></p>
    </BlogHero>
    <section className="bg-background px-5 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <a href="#blog" className="blog-back"><ChevronLeft className="size-4" aria-hidden="true"/>Back to all blogs</a>
        <div className="blog-cover-wrap"><BlogImage src={post.image} alt={post.alt}/></div>
        <article className="blog-prose">
          <p className="blog-lead">{post.excerpt}</p>
          {post.sections.map(s=><section key={s.h}><h2 className="blog-h2 display-heading">{s.h}</h2>{s.p.map((t,i)=><p key={i}>{t}</p>)}</section>)}
        </article>
        <div className="mt-14"><BlogCta/></div>
      </div>
    </section>
    <section className="paper-texture bg-parchment py-14 md:py-20">
      <div className="section-shell">
        <div className="flex items-end justify-between gap-8"><h2 className="display-heading text-[clamp(2rem,4.5vw,3.6rem)] text-primary">More Stories</h2><div className="hidden h-px flex-1 bg-gold md:block"/></div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{related.map(p=><BlogCard key={p.slug} post={p}/>)}</div>
        <div className="mt-10 text-center"><Button asChild variant="outline" className="h-11 rounded-none border-primary px-6 text-primary"><a href="#blog">View all blogs</a></Button></div>
      </div>
    </section>
  </main>
}

/* FOOTER — same footer on the Home page and the Blog pages (uses the same "section-shell" left edge as every section) */
function Footer() {
  return <footer className="bg-primary pb-8 pt-16 text-primary-foreground">
    <div className="section-shell"><div className="grid gap-12 border-b border-gold/60 pb-12 md:grid-cols-3"><div><div className="flex items-center gap-3"><Building2 className="text-gold"/><span className="display-heading text-4xl">MRD Mahal</span></div><p className="mt-5 text-sm text-primary-foreground/75">Where Every Auspicious Moment Begins </p><div className="mt-6 flex flex-wrap items-center gap-3" aria-label="Social media links">{socialLinks.map(([Icon,label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="inline-flex size-10 items-center justify-center border border-primary-foreground/25 text-primary-foreground/80 transition-colors hover:border-gold hover:text-gold focus-visible:border-gold focus-visible:text-gold">{Icon?<Icon className="size-4" strokeWidth={1.8} aria-hidden="true"/>:<svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true"><path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.427 7.627 11.194-.105-.95-.2-2.413.042-3.453.22-.937 1.416-5.98 1.416-5.98s-.362-.724-.362-1.794c0-1.68.974-2.936 2.185-2.936 1.03 0 1.527.774 1.527 1.701 0 1.036-.66 2.584-1.001 4.02-.286 1.202.604 2.18 1.79 2.18 2.149 0 3.8-2.267 3.8-5.54 0-2.897-2.08-4.92-5.05-4.92-3.44 0-5.463 2.58-5.463 5.25 0 1.04.4 2.155.899 2.76.1.12.114.224.085.346l-.334 1.353c-.053.218-.175.264-.403.159-1.507-.702-2.448-2.906-2.448-4.676 0-3.8 2.76-7.29 7.954-7.29 4.176 0 7.424 2.976 7.424 6.951 0 4.148-2.616 7.485-6.247 7.485-1.22 0-2.368-.634-2.762-1.384l-.75 2.86c-.27 1.045-1.003 2.355-1.493 3.154A12 12 0 0012 24c6.628 0 12-5.372 12-12S18.628 0 12 0z"/></svg>}</a>)}</div></div><div><h3 className="display-heading text-2xl">Quick Links</h3><ul className="mt-5 space-y-3 text-sm text-primary-foreground/75"><li><a href="#about">About Us</a></li><li><a href="#halls">Our Halls</a></li><li><a href="#quick-enquiry">Check Availability</a></li><li><a href="#gallery">Gallery</a></li><li><a href="#blog">Blog</a></li></ul></div><div><h3 className="display-heading text-2xl">Contact Info</h3><ul className="mt-5 space-y-3 text-sm text-primary-foreground/75"><li>82200 13444  /  91678 64444</li><li>info@mrdmahal.com</li><li>Iravathanallur National Highway, 85, Madurai, Tamil Nadu 625009</li></ul></div></div></div>
    <div className="section-shell"><div className="mt-8 flex flex-col items-center justify-between gap-5 sm:flex-row"><p className="text-center text-xs leading-5 text-primary-foreground/65 sm:text-left">© 2026 MRD Mahal. All rights reserved. | Where Every Auspicious Moment Begins </p><div className="flex shrink-0 items-center justify-center gap-3"><span className="whitespace-nowrap text-[10px] font-semibold text-primary-foreground">DESIGN AND DEVELOPED</span><img src={buizlabWhiteLogoAsset.url} alt="BUiZLAB Business Laboratory" width={1400} height={313} loading="lazy" className="h-9 w-auto object-contain sm:h-10"/></div></div></div>
  </footer>
}

/* HOME PAGE — all the original sections (Header and Footer are added by <Index/>)
   Every section's content sits inside  className="section-shell"  (see styles.css) so the LEFT edge is identical everywhere. */
type CalendarApiValue = string | number | null | CalendarApiValue[] | { [key: string]: CalendarApiValue };
const calendarRecord = (value: CalendarApiValue | undefined): Record<string, CalendarApiValue> | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, CalendarApiValue> : undefined;
function calendarClock(value: CalendarApiValue): string {
  if (typeof value !== "string") return String(value);
  const match = value.match(/(?:T|^)(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return value;
  const hour24 = Number(match[1]);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${match[2]} ${suffix}`;
}
function findCalendarValue(value: CalendarApiValue | undefined, names: string[]): CalendarApiValue | undefined {
  const record = calendarRecord(value);
  if (!record) return undefined;
  for (const [key, child] of Object.entries(record)) if (names.includes(key.toLowerCase().replace(/[^a-z]/g, ""))) return child;
  for (const child of Object.values(record)) { const found = findCalendarValue(child, names); if (found !== undefined) return found; }
  return undefined;
}
function calendarText(value: CalendarApiValue | undefined): string[] {
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(calendarText);
  const record = calendarRecord(value);
  if (!record) return [];
  const start = record.start ?? record.from;
  const end = record.end ?? record.to;
  if (start && end) return [`${calendarClock(start)} – ${calendarClock(end)}`];
  const name = calendarRecord(record.name);
  if (name) return [String(name.ta ?? name.en ?? Object.values(name)[0] ?? "")].filter(Boolean);
  if (typeof record.name === "string" || typeof record.name === "number") return [String(record.name)];
  const text = record.text ?? record.label ?? record.title;
  if (typeof text === "string") return [text];
  return Object.values(record).flatMap(calendarText);
}

function AvailabilityCalendar() {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); });
  const calendarStatusRef = useRef<HTMLDivElement>(null);
  const bookingDetailRef = useRef<HTMLDivElement>(null);
  const [muhurthamDates, setMuhurthamDates] = useState<Record<string, true>>({});
  const [muhurthamDataMonth, setMuhurthamDataMonth] = useState<string | null>(null);
  const [muhurthamStatus, setMuhurthamStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const calendarYear = month.getFullYear();
  const calendarMonth = month.getMonth() + 1;
  const calendarMonthKey = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}`;
  const [hall, setHall] = useState<"Mini Hall" | "Max Hall">("Mini Hall");
  const [panchang, setPanchang] = useState<CalendarApiValue | null>(null);
  const [panchangLoading, setPanchangLoading] = useState(false);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const selectedInputDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const selectedLabel = selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const selectedMuhurtham = muhurthamDataMonth === calendarMonthKey && muhurthamDates[selectedInputDate];
  const selectedBooking = bookings.find((booking) => booking.date === selectedInputDate && booking.status === "booked");
  const isBooked = Boolean(selectedBooking);
  const selectedStatus = isBooked ? "Booked" : selectedMuhurtham ? "Muhurtham" : "Available";
  const statusBarClass = isBooked ? "bg-red-700 text-white" : selectedMuhurtham ? "bg-amber-400 text-primary" : "bg-green-600 text-white";
  const upcomingMuhurtham = muhurthamDataMonth === calendarMonthKey ? Object.keys(muhurthamDates).filter((date) => date.startsWith(`${calendarMonthKey}-`) && date >= selectedInputDate).sort() : [];
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  useEffect(() => {
    let active = true;
    const refresh = () => { void readBookings().then((records) => { if (active) setBookings(records); }).catch(() => { if (active) setBookings([]); }); };
    refresh();
    window.addEventListener("mrd-bookings-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("mrd-bookings-updated", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setMuhurthamStatus("loading");
    setMuhurthamDataMonth(null);
    fetch(`/api/muhurtham/${calendarYear}?month=${calendarMonth}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Muhurtham dates are unavailable"); return response.json() as Promise<{ dates: string[] }>; })
      .then(({ dates }) => {
        setMuhurthamDates(Object.fromEntries(dates.map((date) => [date, true] as const)));
        setMuhurthamDataMonth(calendarMonthKey);
        setMuhurthamStatus("ready");
      })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) { setMuhurthamDates({}); setMuhurthamDataMonth(calendarMonthKey); setMuhurthamStatus("unavailable"); } });
    return () => controller.abort();
  }, [calendarMonthKey]);
  useEffect(() => {
    const controller = new AbortController();
    setPanchangLoading(true);
    setPanchang(null);
    const params = new URLSearchParams({ date: selectedInputDate, loc: "madurai", lang: "en" });
    fetch(`https://tamilcalendar.click/api/v1/panchangam?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Panchang request failed"); return response.json() as Promise<CalendarApiValue>; })
      .then((data) => setPanchang(data))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setPanchang(null); })
      .finally(() => { if (!controller.signal.aborted) setPanchangLoading(false); });
    return () => controller.abort();
  }, [selectedInputDate]);
  const panchangPayload = findCalendarValue(panchang ?? undefined, ["panchangam", "panchang", "data", "result"]) ?? panchang ?? undefined;
  const goodTimes = calendarText(findCalendarValue(panchangPayload, ["nallaneram", "nallaneramday", "auspiciousperiods"]));
  const gowriTimes = calendarText(findCalendarValue(panchangPayload, ["gowrineram", "gowrinallaneram", "gowri"]));
  const rahuTime = calendarText(findCalendarValue(panchangPayload, ["rahukalam", "rahukaalam"]));
  const yamagandamTime = calendarText(findCalendarValue(panchangPayload, ["yamagandam", "yamakandam"]));
  const gulikaiTime = calendarText(findCalendarValue(panchangPayload, ["gulikai", "kuligai"]));
  const tamilCalendar = calendarRecord(findCalendarValue(panchangPayload, ["tamil"]));
  const tamilMonths: Record<string, string> = { chithirai: "சித்திரை", vaikasi: "வைகாசி", aani: "ஆனி", aadi: "ஆடி", aavani: "ஆவணி", purattasi: "புரட்டாசி", aippasi: "ஐப்பசி", karthigai: "கார்த்திகை", margazhi: "மார்கழி", thai: "தை", maasi: "மாசி", panguni: "பங்குனி" };
  const tamilMonth = typeof tamilCalendar?.month === "string" ? tamilMonths[tamilCalendar.month.toLowerCase()] ?? tamilCalendar.month : "";
  const tamilDate = tamilMonth && tamilCalendar?.date != null ? `${tamilMonth} ${tamilCalendar.date}` : "";
  const inauspiciousTimes = [...rahuTime.map((time) => `Rahu Kalam: ${time}`), ...yamagandamTime.map((time) => `Yamagandam: ${time}`), ...gulikaiTime.map((time) => `Gulikai: ${time}`)];
  const tithi = calendarText(findCalendarValue(panchangPayload, ["tithi"]));
  const nakshatra = calendarText(findCalendarValue(panchangPayload, ["nakshatra", "natchathiram"]));
  const festivals = calendarText(findCalendarValue(panchangPayload, ["festivals", "festival"]));
  const inquire = () => {
    const params = new URLSearchParams({ enquiryDate: selectedInputDate, hall });
    window.location.href = `/?${params.toString()}#quick-enquiry`;
  };
  return <section id="calendar" className="scroll-mt-24 bg-[#f7f5ec] py-16 md:py-24">
    <div className="section-shell"><SectionTitle>Availability Calendar</SectionTitle><p className="mt-3 max-w-2xl text-muted-foreground">Choose a date to view its details and start an enquiry.</p>
      <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,.8fr)_minmax(0,1.2fr)] lg:gap-8">
        <aside className="order-2 min-w-0 border border-primary/10 bg-white p-4 shadow-sm sm:p-5 md:p-6 lg:order-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">◉ {isToday ? "இன்று · Today" : "Selected date"}</p>
          <h3 className="display-heading mt-1.5 text-2xl leading-[1.05] text-primary">{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })},<br/>{selectedDate.getFullYear()}</h3>
          {selectedBooking && <div ref={bookingDetailRef} className="mt-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-950"><p className="font-bold">Booking details · Booked</p><p className="mt-1">Date: {selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} / {selectedBooking.tamilMonth}</p><p>Event: <strong>{selectedBooking.function}</strong></p><p>Booked under: {selectedBooking.customerName}</p><p>Location: {selectedBooking.location}</p></div>}
          <div className="mt-3 flex items-start gap-3 border-b border-primary/10 pb-3"><span className="display-heading text-4xl leading-none text-primary">{selectedDate.getDate()}</span><div className="border-l border-gold pl-3 text-xs text-muted-foreground"><p className="font-medium text-primary">{tamilDate || (panchangLoading ? "தமிழ் தேதி ஏற்றப்படுகிறது…" : "தமிழ் தேதி கிடைக்கவில்லை")}</p><p className="mt-1">{selectedDate.toLocaleDateString("ta-IN", { weekday: "long" })}</p>{nakshatra[0] && <p className="mt-1">நட்சத்திரம்: {nakshatra[0]}</p>}{tithi[0] && <p className="mt-1">திதி: {tithi[0]}</p>}</div></div>
          <div aria-label="Daily auspicious and inauspicious times" className="mt-2 max-h-36 space-y-2 overflow-y-auto overscroll-contain pr-1 touch-pan-y sm:max-h-40">
            {([["NALLA NERAM", goodTimes, "bg-[#f5f3eb] text-primary", "☀"], ["GOWRI NALLA NERAM", gowriTimes, "bg-emerald-50 text-emerald-800", "✦"], ["INAUSPICIOUS TIMES", inauspiciousTimes, "bg-red-50 text-red-700", "⊘"]] as const).map(([label, times, style, icon]) => <div key={label} className={`grid min-w-0 grid-cols-1 gap-x-2 gap-y-1 px-3 py-2 text-[11px] min-[400px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${style}`}><span className="flex items-center gap-2 font-semibold"><span className="text-base" aria-hidden="true">{icon}</span>{label}</span><div className="min-w-0 text-left min-[400px]:text-right">{panchangLoading ? <span>Loading…</span> : times.length ? times.map((time, index) => <p key={`${time}-${index}`} className="break-words">{time}</p>) : <span className="text-muted-foreground">Unavailable</span>}</div></div>)}
          </div>
          <div className="mt-3 border-b border-primary/10 pb-2"><h4 className="text-[11px] font-semibold uppercase tracking-[.12em] text-primary">{isToday ? "Today’s Festivals" : "Festivals on this date"}</h4>{festivals.length ? <ul className="mt-1.5 space-y-1">{festivals.slice(0, 2).map((festival) => <li key={festival} className="text-xs text-foreground">✧ {festival}</li>)}</ul> : <p className="mt-1.5 text-xs text-muted-foreground">{panchangLoading ? "Loading…" : "No festival information available."}</p>}</div>
          <div className="mt-2"><h4 className="text-[11px] font-semibold uppercase tracking-[.12em] text-primary">Upcoming Muhurtham Dates</h4>{muhurthamStatus === "loading" ? <p className="mt-1.5 text-xs text-muted-foreground">Loading dates…</p> : muhurthamStatus === "unavailable" ? <p className="mt-1.5 text-xs text-muted-foreground">Muhurtham dates are not available for {month.getFullYear()}.</p> : <ul className="mt-1.5 space-y-1">{upcomingMuhurtham.map((date) => <li key={date} className="flex gap-2 text-xs text-primary"><span className="text-[#8b7418]">★</span><span>{new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · Muhurtham</span></li>)}</ul>}</div>
          <label className="mt-2 block text-xs font-medium">Choose hall<select value={hall} onChange={(event) => setHall(event.target.value as "Mini Hall" | "Max Hall")} className="mt-1 h-9 w-full border border-input bg-background px-3 text-sm"><option>Mini Hall</option><option>Max Hall</option></select></label>
          <div className="mt-2 grid gap-1.5"><Button type="button" onClick={inquire} className="h-9 rounded-none text-xs">Enquire Now</Button>{/* <Button type="button" variant="outline" onClick={inquire} className="h-9 rounded-none text-xs">Book Now</Button> */}</div>
        </aside>
        <div className="order-1 min-w-0 border border-primary/10 bg-white p-4 shadow-sm sm:p-5 md:p-8 lg:order-2"><div className="flex items-center justify-between gap-3"><Button type="button" variant="outline" size="icon" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft/></Button><h3 className="display-heading text-center text-xl text-primary sm:text-2xl">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h3><Button type="button" variant="outline" size="icon" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight/></Button></div>
          <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">{cells.map((date, index) => { if (!date) return <span key={`empty-${index}`} aria-hidden="true" className="aspect-square min-h-10"/>; const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; const isMuhurtham = muhurthamDataMonth === calendarMonthKey && Boolean(muhurthamDates[dayKey]); const isBookedDate = bookings.some((booking) => booking.date === dayKey && booking.status === "booked"); const isSelected = date.toDateString() === selectedDate.toDateString(); return <button key={date.toISOString()} type="button" aria-label={`${date.toLocaleDateString("en-IN", { dateStyle: "full" })}${isBookedDate ? ", booked" : isMuhurtham ? ", Muhurtham" : ", available"}`} aria-pressed={isSelected} onClick={() => { setSelectedDate(date); window.requestAnimationFrame(() => (isBookedDate ? bookingDetailRef.current : calendarStatusRef.current)?.scrollIntoView({ behavior: "smooth", block: "nearest" })); }} style={isSelected ? { outline: "2px solid #000", outlineOffset: "-3px" } : undefined} className={`box-border aspect-square min-h-9 border-2 border-transparent rounded-sm text-xs font-semibold transition-colors sm:min-h-10 sm:text-sm ${isBookedDate ? "bg-red-700 text-white hover:bg-red-800" : isMuhurtham ? "bg-amber-400 text-primary hover:bg-amber-500" : "bg-green-600 text-white hover:bg-green-700"} ${isSelected ? "z-10" : ""}`}>{date.getDate()}</button>; })}</div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-wide"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-400"/>Muhurtham</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-700"/>Booked</span><span className="flex items-center gap-1.5 text-green-800"><span className="size-2.5 rounded-full bg-green-600"/>Available</span></div>
          <div ref={calendarStatusRef} aria-live="polite" className={`mt-4 flex min-h-11 items-center justify-center gap-2 px-4 py-2 text-xs font-semibold ${statusBarClass}`}><span className={`size-3 rounded-sm ${isBooked ? "bg-red-500" : selectedMuhurtham ? "bg-amber-500" : "bg-green-500"}`} aria-hidden="true"/><span>Selected Date: {selectedLabel} · {selectedStatus}</span></div>
        </div>
      </div>
    </div>
  </section>;
}

function HomePage() {
  const [lightbox,setLightbox]=useState<number|null>(null); const [success,setSuccess]=useState(false); const [bookingChoice,setBookingChoice]=useState<"mahal"|"mini"|"other">("mahal");
  const [prefillDate] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("enquiryDate") ?? "");
  const [prefillHall] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("hall") ?? "");
  const [testimonialRef,testimonialApi]=useEmblaCarousel({loop:true,align:"center",containScroll:false}); const [activeTestimonial,setActiveTestimonial]=useState(0);
  const today = new Date();
  const minEventDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  useEffect(()=>{if(lightbox===null)return;const fn=(e:KeyboardEvent)=>{if(e.key==="Escape")setLightbox(null)};document.addEventListener("keydown",fn);return()=>document.removeEventListener("keydown",fn)},[lightbox]);
  useEffect(()=>{if(!testimonialApi)return;const updateActive=()=>setActiveTestimonial(testimonialApi.selectedScrollSnap());testimonialApi.on("select",updateActive);testimonialApi.on("reInit",updateActive);updateActive();return()=>{testimonialApi.off("select",updateActive);testimonialApi.off("reInit",updateActive)}},[testimonialApi]);
  const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;const d=new FormData(f);const v=(k:string)=>String(d.get(k)??"").trim()||"Not provided";
    const msg=`Hello, I would like to enquire about booking MRD Mahal.\n\nName: ${v("name")}\nPhone: ${v("phone")}\nEvent Type: ${v("event")}\nPreferred Date: ${v("date")}\nPreferred Hall: ${v("hall")}\n\nPlease share the availability, pricing, facilities, and booking terms.\n\nThank you.`;
    window.open(`https://wa.me/918220013444?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer");setSuccess(true)};
  const hallFeatures=[
    {name:"MRD Max Hall",label:"MRD Mahal",heading:"Max Hall",subtitle:"Grand Celebrations Made Perfect",desc:"Our Max Hall is ideal for large-scale weddings, receptions, and cultural events. Designed to accommodate grand gatherings comfortably, this hall enhances every celebration with its spacious layout and elegant interiors.",features:["Comfortably Accommodates 1,000 Guests","Grand Stage Setup","Centralized Lighting & Decoration Flexibility","700+ peoples Separate Dining Area","Premium Ventilation & Ambience"],image:maxHallImage,alt:"MRD Max Hall with decorated wedding stage, red carpet aisle and rows of seating"},
    {name:"MRD Mini Hall",label:"MRD Mini Hall",heading:"MRD Mini Hall",subtitle:"Intimate & Elegant Functions",desc:"Perfect for smaller functions such as engagement ceremonies, birthdays, and family gatherings, the Mini Hall offers a warm and elegant atmosphere while maintaining the same quality standards as our main hall.",features:["200 seats for small & medium gatherings","Compact yet elegant interiors","Budget-friendly option","Same premium facilities"],image:miniHallImage,alt:"MRD Mini Hall with flower-decorated stage and cream chairs on both sides of the aisle"}
  ];
  const selectedGallery = lightbox === null ? undefined : gallery[lightbox];
  return <>
    {/* HERO — solid wine nav bar on top; the banner photo fills the rest of the first screen; heading sits on the photo's empty red wall */}
    <section aria-labelledby="hero-title" className="hero-section flex flex-col bg-primary text-primary-foreground">
      <div className="hero-media relative min-h-0 flex-1 overflow-hidden">
        <img src={heroBanner} alt="Golden wedding mandapam stage with red and gold flower garlands and guest seating at MRD Mahal" width={1671} height={941} fetchPriority="high" decoding="async" className="hero-image absolute inset-0 h-full w-full object-cover"/>
        <div className="hero-bottom-fade" aria-hidden="true"/>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-4 text-center sm:px-8 md:pt-7 lg:pt-9">
          <h1 id="hero-title" className="display-heading hero-title-gold mx-auto text-balance text-[clamp(1.45rem,3.3vw,3.3rem)] leading-[1.12]">
            <span className="block lg:inline">Your Dream Moments</span>{" "}
            <span className="block lg:inline">with Our MRD Mahal</span>
          </h1>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-5xl px-5 pb-5 text-center sm:px-8 md:pb-7">
          <p className="stat-number mx-auto max-w-3xl text-xs font-semibold leading-6 text-primary-foreground [text-shadow:0_1px_3px_rgb(0_0_0/0.95),0_0_10px_rgb(0_0_0/0.85)] sm:text-sm">25+ Years | 1000+ Guests | 7+ Rooms | 60+ Parking</p>
          <div className="mx-auto mt-3 grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Event booking selection">
            <Button type="button" variant="outline" aria-pressed={bookingChoice==="mahal"} onClick={()=>{setBookingChoice("mahal");scrollTo("max-hall")}} className={`flex min-h-11 items-center justify-center gap-2 rounded-md border-gold bg-foreground/90 px-5 text-center text-sm leading-tight text-background transition-all hover:bg-foreground hover:text-background ${bookingChoice==="mahal"?"ring-2 ring-gold ring-offset-2 ring-offset-primary":""}`}><WhatsAppMark/>Book Mahal for Wedding</Button>
            <Button type="button" variant="outline" aria-pressed={bookingChoice==="mini"} onClick={()=>{setBookingChoice("mini");scrollTo("mini-hall")}} className={`flex min-h-11 items-center justify-center gap-2 rounded-md border-gold bg-foreground/90 px-5 text-center text-sm leading-tight text-background transition-all hover:bg-foreground hover:text-background ${bookingChoice==="mini"?"ring-2 ring-gold ring-offset-2 ring-offset-primary":""}`}><WhatsAppMark/>Book Minihall for Meeting</Button>
            <Button type="button" variant="outline" aria-pressed={bookingChoice==="other"} onClick={()=>{setBookingChoice("other");scrollTo("quick-enquiry")}} className={`min-h-11 rounded-md border-gold bg-foreground/90 px-5 text-center text-sm leading-tight text-background transition-all hover:bg-foreground hover:text-background ${bookingChoice==="other"?"ring-2 ring-gold ring-offset-2 ring-offset-primary":""}`}>Book for Other Events</Button>
          </div>
        </div>
        <div className="scroll-mark absolute bottom-4 right-6 z-10 hidden h-10 w-px bg-gold lg:block" aria-hidden="true"/>
      </div>
    </section>

    {/* OUR LEGACY — the envelope picture (qqr.png) is the section background (whole picture, never cropped on desktop).
        The text sits on its empty left side inside "section-shell", so its LEFT edge is the same as every other section.
        The 3 photos are laid exactly over the 2 photo frames + the small stamp of the picture (see <LegacyPhotos/>). */}
    <section id="about" className="legacy-section">
      <div className="legacy-content"><div className="section-shell">
        <div className="reveal legacy-copy text-center lg:text-left">
          <p className="mb-4 text-xs uppercase text-accent">Our Journey Since 2001</p><SectionTitle>{" Our Legacy \n\n"}</SectionTitle>
          <p className="mt-5 text-base leading-8 text-foreground/75 lg:leading-7 xl:text-lg xl:leading-8">Founded in 2001, MRD Mahal — Maharajan Ambalam Rajammal Thirumana Maaligai — Began with a vision to create a welcoming space where families could celebrate their most special moments. Over the past 25 years, MRD Mahal has grown into a trusted celebration destination in Madurai, hosting countless weddings, receptions and family occasions. Blending Tamil tradition with modern comfort, we continue to create memorable experiences while carrying forward the values of trust, hospitality and togetherness. 25 Years of Trust. Thousands of Celebrations. One MRD Family.</p>
        </div>
      </div></div>
      <div className="legacy-stage">
        <div className="legacy-canvas">
          <img src={legacyBg} alt="Maroon MRD Mahal envelope with vintage photographs and the line Together in every Celebration, established 2001" width={1920} height={870} loading="lazy" decoding="async" draggable={false} className="legacy-bg"/>
          {legacyBg&&<LegacyPhotos/>}
        </div>
      </div>
    </section>

    {/* OUR HALLS — both photos use the SAME 4:3 box and the SAME column width, so they always look equal in size.
        Content sits inside "section-shell" = same left space as the other sections. */}
    <section id="halls" className="paper-texture bg-parchment py-16 md:py-24"><div className="section-shell"><SectionTitle>Our Halls</SectionTitle>
      <div className="mt-8 space-y-12 md:mt-10 md:space-y-16">{hallFeatures.map((hall,i)=><article id={i===0?"max-hall":"mini-hall"} key={hall.name} className={`reveal scroll-mt-24 grid items-center gap-7 md:gap-10 lg:gap-12 ${i===0?"lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]":"lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]"}`}>
        <div className={`group relative min-w-0 overflow-hidden border border-gold/60 shadow-lg ${i===0?"order-2 lg:order-2":"order-2 lg:order-1"}`}>
          <img loading="lazy" src={hall.image} alt={hall.alt} width={1600} height={1200} className={`hall-photo ${i===1?"hall-photo-mini":"hall-photo-max"} transition-transform duration-700 ease-out group-hover:scale-[1.025]`}/>
          <div className="pointer-events-none absolute inset-4 border border-background/55" aria-hidden="true"/>
        </div>
        <div className={`min-w-0 py-2 md:py-4 ${i===0?"order-1 lg:order-1":"order-1 lg:order-2"}`}>
          <div className="border-l-2 border-gold pl-5 sm:pl-7"><span className="display-heading text-2xl text-accent">{hall.label}</span><h3 className="display-heading mt-2 text-[clamp(3.3rem,6vw,6.2rem)] leading-[1.05] text-primary">{hall.heading}</h3><p className="mt-3 font-display text-xl text-accent sm:text-2xl">{hall.subtitle}</p></div>
          <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{hall.desc}</p>
          <div className="mt-5 border-t border-gold/45 pt-4"><p className="font-semibold text-primary">Key Features:</p><div className="mt-3 space-y-2">{hall.features.map(f=><p key={f} className="reveal flex gap-3 text-sm leading-6 text-foreground"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true"/>{f}</p>)}</div></div>
          <Button asChild className="mt-5 h-11 rounded-md bg-wine px-5 text-primary-foreground transition-colors hover:bg-primary focus-visible:ring-2 focus-visible:ring-gold"><a href={i===0?"https://wa.me/918220013444?text=Hello%2C%20I%20am%20interested%20in%20booking%20MRD%20Max%20Hall%20for%20an%20upcoming%20large-scale%20event.%20Kindly%20share%20the%20available%20dates%2C%20seating%20capacity%2C%20venue%20facilities%2C%20pricing%2C%20and%20booking%20terms.%20Thank%20you.":"https://wa.me/918220013444?text=Hello%2C%20I%20am%20interested%20in%20booking%20MRD%20Mini%20Hall%20for%20an%20upcoming%20intimate%20event.%20Kindly%20share%20the%20available%20dates%2C%20seating%20capacity%2C%20facilities%2C%20pricing%2C%20and%20booking%20terms.%20Thank%20you."} target="_blank" rel="noopener noreferrer" aria-label={i===0?"Book MRD Max Hall on WhatsApp":"Book MRD Mini Hall on WhatsApp"}><MessageCircle className="size-4" aria-hidden="true"/>Book mahal</a></Button>
        </div>
      </article>)}</div></div></section>

    <section className="bg-primary py-16 text-primary-foreground md:py-24"><div className="section-shell grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-20"><div className="lg:sticky lg:top-32 lg:self-start"><SectionTitle light>Why We’re the Perfect Choice</SectionTitle><div className="mt-8 h-px w-24 bg-gold"/></div><div className="border-t border-gold/45">{benefits.map(([ReasonIcon,title,text],i)=><article key={title} tabIndex={0} className="reveal group grid gap-4 border-b border-gold/35 py-7 transition-transform duration-300 hover:translate-x-1 focus-visible:translate-x-1 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-6"><span className="flex size-12 shrink-0 items-center justify-center border border-primary-foreground/25 text-primary-foreground transition-colors group-hover:border-gold group-hover:text-gold group-focus-visible:border-gold group-focus-visible:text-gold"><ReasonIcon className="size-6" strokeWidth={1.8} aria-hidden="true"/></span><div className="min-w-0"><div className="flex items-baseline gap-4"><span className="stat-number text-xs text-gold">0{i+1}</span><h3 className="display-heading text-2xl text-primary-foreground md:text-3xl">{title}</h3></div><p className="mt-3 text-sm leading-6 text-primary-foreground/70">{text}</p></div></article>)}</div></div></section>

    <AvailabilityCalendar/>

    {/* EVENT TYPES — page-turning photo book on a maroon hard cover; it turns a page by itself every 3 seconds (see AUTO_FLIP_MS) */}
    <section className="events-section overflow-hidden py-16 md:py-24" style={eventsBg?{backgroundImage:`url("${eventsBg}")`}:undefined}>
      <div className="section-shell"><SectionTitle>Event Types We Host</SectionTitle></div>
      <div className="mx-auto mt-10 max-w-[90rem] px-3 sm:px-6 md:mt-14">
        <PhotoBook items={eventTypes.map((t,i)=>[eventImages[i],t,eventDescriptions[i]] as const)} cover={eventBookCover} label="Event types photo book"/>
      </div>
    </section>

    <section className="bg-primary py-16 md:py-24"><div className="section-shell grid gap-16 lg:grid-cols-[.7fr_1.3fr]"><SectionTitle light>Facilities & Amenities</SectionTitle><div className="grid md:grid-cols-2">{facilities.map(([Icon,title,text])=><article key={title} className="reveal border-b border-gold/50 p-6 text-primary-foreground"><Icon className="mb-5 size-6 text-gold"/><h3 className="display-heading text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-primary-foreground/75">{text}</p></article>)}</div></div></section>

    {/* VENUE HIGHLIGHTS — expanding strips */}
    <section id="gallery" className="overflow-hidden bg-parchment py-16 md:py-24">
      <div className="section-shell"><div className="flex items-end justify-between gap-8"><SectionTitle>{"Venue Highlights\n\n"}</SectionTitle><div className="hidden h-px flex-1 bg-gold md:block"/></div></div>
      <div className="section-shell mt-10 md:mt-14">
        <VenueStrips items={gallery} onView={setLightbox}/>
      </div>
    </section>
    {selectedGallery&&<div role="dialog" aria-modal="true" aria-label={selectedGallery[1]} className="fixed inset-0 z-50 flex items-center justify-center bg-primary/95 p-5" onClick={()=>setLightbox(null)}><Button autoFocus variant="secondary" size="icon" aria-label="Close gallery" className="absolute right-5 top-5 min-h-11 min-w-11" onClick={()=>setLightbox(null)}><X/></Button><div className="h-[70dvh] w-full max-w-5xl overflow-hidden" onClick={e=>e.stopPropagation()}>{selectedGallery[0]?<img className="h-full w-full object-contain" src={selectedGallery[0]} alt={selectedGallery[2]} width={1920} height={1024}/>:<p className="flex h-full items-center justify-center text-primary-foreground/80">Photo coming soon</p>}</div></div>}

    <section className="paper-texture px-5 py-16 font-body md:py-24"><div className="mx-auto max-w-6xl"><div className="text-center"><h2 className="display-heading text-[clamp(2.7rem,6vw,5.8rem)] text-primary">What Our Clients Say</h2></div><div className="mt-9" aria-roledescription="carousel" aria-label="Customer testimonials"><div className="overflow-hidden" ref={testimonialRef}><div className="flex touch-pan-y">{testimonials.map(([quote,name],index)=><div key={name} className="min-w-0 flex-[0_0_100%] px-2 transition-all duration-500 md:flex-[0_0_84%] lg:flex-[0_0_72%]" role="group" aria-roledescription="slide" aria-label={`${name}, ${index+1} of ${testimonials.length}`} aria-hidden={activeTestimonial!==index}><blockquote className={`flex min-h-[250px] flex-col justify-between border border-gold bg-background px-5 py-6 shadow-sm transition-all duration-500 sm:px-8 md:min-h-[280px] md:px-10 md:py-8 ${activeTestimonial===index?"scale-100 opacity-100 shadow-md":"scale-[0.92] opacity-50"}`}><p className="font-body text-lg leading-relaxed text-primary sm:text-xl md:text-2xl">“{quote}”</p><footer className="mt-6 border-t border-gold/50 pt-4 font-body text-sm font-semibold text-muted-foreground">{name}</footer></blockquote></div>)}</div></div><div className="mt-5 flex items-center justify-between gap-4"><Button type="button" variant="outline" size="icon" className="size-11 rounded-full" aria-label="Previous testimonial" onClick={()=>testimonialApi?.scrollPrev()}><ChevronLeft aria-hidden="true"/></Button><div className="flex items-center gap-1" aria-label="Select testimonial">{testimonials.map(([_,name],index)=><Button key={name} type="button" variant="ghost" size="icon" aria-label={`Show testimonial ${index+1}`} aria-current={activeTestimonial===index?"true":undefined} onClick={()=>testimonialApi?.scrollTo(index)} className="size-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span className={`size-2.5 rounded-full border border-primary ${activeTestimonial===index?"bg-primary":"bg-transparent"}`} aria-hidden="true"/></Button>)}</div><Button type="button" variant="outline" size="icon" className="size-11 rounded-full" aria-label="Next testimonial" onClick={()=>testimonialApi?.scrollNext()}><ChevronRight aria-hidden="true"/></Button></div><p className="sr-only" aria-live="polite">Testimonial {activeTestimonial+1} of {testimonials.length}</p></div></div></section>

    <section id="quick-enquiry" className="grid scroll-mt-20 bg-primary lg:grid-cols-2"><div className="px-6 py-16 text-primary-foreground md:px-16 md:py-20 lg:px-[max(4rem,calc((100vw-80rem)/2))]"><SectionTitle light>Quick Enquiry & Contact</SectionTitle><h3 className="display-heading mt-12 text-3xl">Get in Touch</h3><div className="mt-8 space-y-6 text-sm"><p className="flex gap-4"><Phone className="size-5 shrink-0 text-gold"/><span>Call / WhatsApp — <a href="tel:+918220013444" className="underline underline-offset-4 focus-visible:outline-2">082200 13444</a></span></p><p className="flex gap-4"><Mail className="size-5 shrink-0 text-gold"/>Email — info@mrdmahal.com</p><p className="flex gap-4"><MapPin className="size-5 shrink-0 text-gold"/><span>Address — <a href="https://maps.app.goo.gl/RF14vSjpUZpm2W5Q6" target="_blank" rel="noopener noreferrer" aria-label="View MRD Mahal location on Google Maps" className="underline underline-offset-4 focus-visible:outline-2">Iravathanallur National Highway, 85, Madurai, Tamil Nadu 625009</a></span></p></div><a href="https://maps.app.goo.gl/RF14vSjpUZpm2W5Q6" target="_blank" rel="noopener noreferrer" aria-label="View MRD Mahal location on Google Maps" className="mt-12 flex min-h-52 items-center justify-center border border-gold/60 bg-wine focus-visible:outline-2"><MapPin className="size-12 text-gold" aria-hidden="true"/></a></div>
      <div className="paper-texture bg-parchment px-5 py-16 md:px-16 md:py-20"><form onSubmit={submit} className="mx-auto max-w-xl bg-background p-7 shadow-xl md:p-10" noValidate={false}>{success?<div role="status" className="py-24 text-center"><Check className="mx-auto size-12 text-gold"/><p className="mt-6 text-lg text-primary">Your enquiry message has been prepared in WhatsApp. Please review and send it to complete your enquiry.</p></div>:<div className="space-y-6">
        <label className="block text-sm font-medium">Name *<input required name="name" maxLength={100} placeholder="Your full name" className="mt-2 h-12 w-full border border-input bg-background px-4 placeholder:text-muted-foreground"/></label>
        <label className="block text-sm font-medium">Phone Number *<input required name="phone" type="tel" maxLength={20} pattern="[0-9+ ()-]{7,20}" placeholder="Your contact number" className="mt-2 h-12 w-full border border-input bg-background px-4 placeholder:text-muted-foreground"/></label>
        <label className="block text-sm font-medium">Event Type *<select required name="event" defaultValue="" className="mt-2 h-12 w-full border border-input bg-background px-4 text-foreground"><option value="" disabled>Select event type</option>{eventTypes.map(e=><option key={e}>{e}</option>)}</select></label>
        <label className="block text-sm font-medium">Preferred Event Date<input name="date" type="date" min={minEventDate} defaultValue={prefillDate} className="mt-2 h-12 w-full border border-input bg-background px-4 text-foreground"/></label>
        <fieldset><legend className="text-sm font-medium">Hall Selection *</legend><div className="mt-3 flex gap-7"><label className="flex items-center gap-2"><input required type="radio" name="hall" value="Max Hall" defaultChecked={prefillHall === "Max Hall"} className="size-4 accent-primary"/>Max Hall</label><label className="flex items-center gap-2"><input type="radio" name="hall" value="Mini Hall" defaultChecked={prefillHall !== "Max Hall"} className="size-4 accent-primary"/>Mini Hall</label></div></fieldset>
        <Button type="submit" aria-label="Submit enquiry through WhatsApp" className="h-12 w-full rounded-none">Submit Enquiry</Button>
      </div>}</form></div></section>

    <section className="px-5 py-16 md:py-24"><div className="mx-auto max-w-5xl"><SectionTitle>Frequently Asked Questions</SectionTitle><div className="mt-10 space-y-3">{["How many people can be seated at a time in the MRD Max Hall?","How many people can be seated at a time in the MRD Mini Hall?","Do you provide decoration arrangements such as Thoranam,and other traditional decorations?","How far is MRD Mahal from the Theppakulam?"].map(q=><details key={q} className="group border border-primary bg-background"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-6 text-primary focus-visible:outline-2"><span>{q}</span><ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden="true"/></summary><p className="border-t border-primary/20 px-6 py-5 text-sm text-muted-foreground">Please contact MRD Mahal for details.</p></details>)}</div></div></section>
  </>;
}

/* PAGE SWITCHER — #blog = blog list, #blog/<slug> = one blog post, anything else = Home page */
function Index() {
  const hash=useHash();
  const isBlog=hash==="blog"||hash.startsWith("blog/");
  const slug=hash.startsWith("blog/")?hash.slice(5):"";
  const [latestStories,setLatestStories]=useState(blogPosts.slice(1));
  const stories=[blogPosts[0],...latestStories].filter((story):story is BlogPost=>Boolean(story));
  const post=stories.find(p=>p.slug===slug);
  const first=useRef(true);
  useEffect(()=>{readLatestStories(blogPosts.slice(1),blogPosts[0]?.slug??"").then(setLatestStories).catch(error=>console.error("Could not load saved Latest Stories",error))},[]);
  useEffect(()=>{
    if(first.current){first.current=false;if(!hash)return}
    if(isBlog||!hash||hash==="top"){window.scrollTo({top:0,behavior:"instant" as ScrollBehavior});return}
    const t=window.setTimeout(()=>document.getElementById(hash)?.scrollIntoView({behavior:"smooth"}),60);
    return()=>window.clearTimeout(t);
  },[hash,isBlog]);
  useEffect(()=>{
    document.title=isBlog?(post?`${post.title} | MRD Mahal Blog`:"Blog | MRD Mahal"):"MRD Mahal | Grand Wedding Venue";
  },[isBlog,post]);
  return <div id="top" className="overflow-x-hidden bg-background"><Header isBlog={isBlog}/>
    {isBlog?(post?<BlogPostView post={post} posts={stories}/>:<BlogListView posts={latestStories}/>):<HomePage/>}
    <Footer/>
  </div>;
}
