import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { blogPosts, type BlogPost } from "@/routes/index";
import {
  isAdminSignedIn,
  readLatestStories,
  signInAdmin,
  signOutAdmin,
  writeLatestStories,
} from "@/data/blogPosts";

type StoryDraft = { title: string; category: string; date: string; readTime: string; excerpt: string; alt: string; image: string };
const emptyDraft: StoryDraft = { title: "", category: "Wedding Planning", date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), readTime: "4 min read", excerpt: "", alt: "", image: "" };
const fieldClass = "mt-1.5 w-full rounded border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary";

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read image file."));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export default function BlogAdmin() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [stories, setStories] = useState<BlogPost[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSignedIn(isAdminSignedIn());
    readLatestStories(blogPosts.slice(1), blogPosts[0]?.slug ?? "")
      .then(setStories)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load stories."));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!selectedImage) { setSelectedImagePreview(""); return; }
    const previewUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  function updateDraft<K extends keyof StoryDraft>(key: K, value: StoryDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const success = await signInAdmin(username, password);
      if (!success) { setError("Username or password is incorrect."); return; }
      setSignedIn(true);
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    }
  }

  function startEdit(story: BlogPost) {
    setEditingSlug(story.slug);
    setDraft({ title: story.title, category: story.category, date: story.date, readTime: story.readTime, excerpt: story.excerpt, alt: story.alt, image: story.image });
    setSelectedImage(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEditor() {
    setEditingSlug(null);
    setDraft({ ...emptyDraft, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) });
    setSelectedImage(null);
    setError("");
  }

  async function saveStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!editingSlug && !selectedImage) throw new Error("Choose an image for the new story.");
      if (selectedImage && selectedImage.size > 5 * 1024 * 1024) throw new Error("Please choose an image smaller than 5 MB.");
      const image = selectedImage ? await fileAsDataUrl(selectedImage) : draft.image;
      const baseSlug = slugify(draft.title);
      if (!baseSlug) throw new Error("Enter a story title.");
      const slug = editingSlug ?? `${baseSlug}${stories.some((story) => story.slug === baseSlug) ? `-${Date.now().toString(36)}` : ""}`;
      const nextStory: BlogPost = { slug, title: draft.title.trim(), category: draft.category.trim(), date: draft.date.trim(), readTime: draft.readTime.trim(), excerpt: draft.excerpt.trim(), image, alt: draft.alt.trim() || draft.title.trim(), sections: editingSlug ? (stories.find((story) => story.slug === editingSlug)?.sections ?? []) : [] };
      const nextStories = editingSlug ? stories.map((story) => story.slug === editingSlug ? nextStory : story) : [nextStory, ...stories];
      await writeLatestStories(nextStories);
      setStories(nextStories);
      resetEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save story.");
    } finally {
      setSaving(false);
    }
  }

  async function removeStory(story: BlogPost) {
    if (!window.confirm(`Delete “${story.title}”? This cannot be undone.`)) return;
    const nextStories = stories.filter((item) => item.slug !== story.slug);
    try {
      await writeLatestStories(nextStories);
      setStories(nextStories);
      if (editingSlug === story.slug) resetEditor();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete story.");
    }
  }

  function startNewStory() {
    resetEditor();
    document.getElementById("story-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function logout() {
    signOutAdmin();
    setSignedIn(false);
  }

  if (!ready) return <main className="min-h-screen bg-background" />;

  return <main className="min-h-screen bg-[#f7f3eb] px-4 py-8 text-foreground sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-primary/15 pb-6">
        <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-gold">MRD Mahal</p><h1 className="display-heading mt-1 text-4xl text-primary">Blog Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Manage posts shown in Latest Stories. The existing banner and featured post stay unchanged.</p></div>
        <div className="flex flex-wrap gap-3">{signedIn && <button type="button" onClick={startNewStory} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-wine">+ Add New Blog</button>}<a href="/#blog" className="rounded border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">View blog</a>{signedIn && <button type="button" onClick={logout} className="rounded border border-primary/20 px-4 py-2 text-sm font-medium text-primary">Sign out</button>}</div>
      </header>

      {!signedIn ? <section className="mx-auto max-w-md rounded-lg border border-primary/10 bg-white p-6 shadow-sm">
        <h2 className="display-heading text-2xl text-primary">Admin sign in</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the dashboard username and password.</p>
        <form className="mt-6 space-y-4" onSubmit={handleAuth}>
          <label className="block text-sm font-medium">Username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className={fieldClass}/></label>
          <label className="block text-sm font-medium">Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass}/></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="w-full rounded bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-wine">Sign in</button>
        </form>
      </section> : <div className="grid items-start gap-8 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <section id="story-editor" className="scroll-mt-6 rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
          <h2 className="display-heading text-2xl text-primary">{editingSlug ? "Edit story" : "Add a story"}</h2>
          <form className="mt-5 space-y-4" onSubmit={saveStory}>
            <label className="block text-sm font-medium">Title<input required maxLength={120} value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} className={fieldClass}/></label>
            <label className="block text-sm font-medium">Category<input required maxLength={50} value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} className={fieldClass}/></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Display date<input required value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} className={fieldClass}/></label><label className="block text-sm font-medium">Read time<input required value={draft.readTime} onChange={(event) => updateDraft("readTime", event.target.value)} className={fieldClass}/></label></div>
            <label className="block text-sm font-medium">Description<textarea required rows={5} maxLength={600} value={draft.excerpt} onChange={(event) => updateDraft("excerpt", event.target.value)} className={fieldClass}/><span className="mt-1 block text-right text-xs text-muted-foreground">{draft.excerpt.length}/600</span></label>
            <label className="block text-sm font-medium">Story image<input type="file" accept="image/*" onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"/><span className="mt-1 block text-xs text-muted-foreground">JPG, PNG or WebP · up to 5 MB {editingSlug && "· leave empty to keep current image"}</span></label>
            {(selectedImagePreview || draft.image) && <img src={selectedImagePreview || draft.image} alt="Story preview" className="aspect-[16/9] w-full rounded object-cover"/>}
            <label className="block text-sm font-medium">Image description for accessibility<input value={draft.alt} onChange={(event) => updateDraft("alt", event.target.value)} className={fieldClass}/></label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-3"><button disabled={saving} className="flex-1 rounded bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : editingSlug ? "Save changes" : "Add story"}</button>{editingSlug && <button type="button" onClick={resetEditor} className="rounded border border-primary/25 px-4 py-3 text-sm text-primary">Cancel</button>}</div>
          </form>
        </section>

        <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="display-heading text-2xl text-primary">Latest Stories</h2><p className="mt-1 text-sm text-muted-foreground">{stories.length} stories · the featured story and main banner stay unchanged</p></div><div className="flex items-center gap-4"><button type="button" onClick={startNewStory} className="rounded border border-primary/25 px-3 py-2 text-sm font-semibold text-primary">+ Add New</button><Link to="/" className="text-sm font-medium text-primary underline">Back to site</Link></div></div>
          <div className="space-y-3">{stories.map((story, index) => <article key={story.slug} className="flex gap-4 rounded border border-primary/10 p-3">
            <img src={story.image} alt="" className="size-24 shrink-0 rounded object-cover"/>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-gold">Latest · {story.category}</p><h3 className="mt-1 line-clamp-2 font-semibold text-primary">{story.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{story.excerpt}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><button type="button" onClick={() => startEdit(story)} className="text-sm font-semibold text-primary underline">Edit</button><button type="button" onClick={() => void removeStory(story)} className="text-sm font-semibold text-red-700 underline">Delete</button></div></div>
          </article>)}{stories.length === 0 && <p className="rounded bg-primary/5 px-4 py-8 text-center text-sm text-muted-foreground">No stories yet. Add one using the form.</p>}</div>
        </section>
      </div>}
      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-muted-foreground">Storage note: stories and login are saved in this browser only. They will not sync to other devices or browsers.</p>
    </div>
  </main>;
}
