import type { BlogPost } from "@/routes/index";

const DB_NAME = "mrd-mahal-blog";
const DB_VERSION = 2;
const STORIES_STORE = "stories";
const LATEST_STORIES_KEY = "latest";
const LEGACY_STORIES_KEY = "published";
const SESSION_KEY = "mrd-blog-admin-session-v2";

// Edit these values to change the dashboard login.
export const BLOG_ADMIN_USERNAME = "Mrdmahal";
export const BLOG_ADMIN_PASSWORD = "Mrdmahal@123";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORIES_STORE)) {
        request.result.createObjectStore(STORIES_STORE);
      }
      if (!request.result.objectStoreNames.contains("bookings")) {
        request.result.createObjectStore("bookings");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open blog storage."));
  });
}

export async function readLatestStories(defaultStories: BlogPost[], protectedFeaturedSlug: string): Promise<BlogPost[]> {
  const database = await openDatabase();
  try {
    const saved = await new Promise<{ latest: BlogPost[] | undefined; previous: BlogPost[] | undefined }>((resolve, reject) => {
      const transaction = database.transaction(STORIES_STORE, "readonly");
      const store = transaction.objectStore(STORIES_STORE);
      const latestRequest = store.get(LATEST_STORIES_KEY);
      const legacyRequest = store.get(LEGACY_STORIES_KEY);
      let latest: BlogPost[] | undefined;
      let previous: BlogPost[] | undefined;
      let completed = 0;
      const finish = () => { completed += 1; if (completed === 2) resolve({ latest, previous }); };
      latestRequest.onsuccess = () => { latest = latestRequest.result as BlogPost[] | undefined; finish(); };
      latestRequest.onerror = () => reject(latestRequest.error ?? new Error("Could not read Latest Stories."));
      legacyRequest.onsuccess = () => { previous = legacyRequest.result as BlogPost[] | undefined; finish(); };
      legacyRequest.onerror = () => reject(legacyRequest.error ?? new Error("Could not read saved stories."));
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not read saved stories."));
    });
    if (saved.latest) return saved.latest;
    if (saved.previous) return saved.previous.filter((story) => story.slug !== protectedFeaturedSlug);
    return defaultStories;
  } finally {
    database.close();
  }
}

export async function writeLatestStories(stories: BlogPost[]): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORIES_STORE, "readwrite");
      transaction.objectStore(STORIES_STORE).put(stories, LATEST_STORIES_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save blog stories."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Saving blog stories was cancelled."));
    });
  } finally {
    database.close();
  }
}

export async function signInAdmin(username: string, password: string): Promise<boolean> {
  if (username.trim() !== BLOG_ADMIN_USERNAME || password !== BLOG_ADMIN_PASSWORD) return false;
  localStorage.setItem(SESSION_KEY, "active");
  return true;
}

export function isAdminSignedIn(): boolean {
  return localStorage.getItem(SESSION_KEY) === "active";
}

export function signOutAdmin(): void {
  localStorage.removeItem(SESSION_KEY);
}
