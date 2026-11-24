import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import axios from "axios";
import { canonicalUrl, SITE_NAME } from "@/lib/seo";

type WordPressPost = {
  id: number;
  link: string;
  title?: { rendered: string };
  content?: { rendered: string };
  featured_media?: number;
  featured_media_details?: { source_url: string };
};

const WORDPRESS_API = "http://localhost/headlesscms/wordpress/wp-json/wp/v2";

const Blog = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get<WordPressPost[]>(`${WORDPRESS_API}/posts`);
        const postsWithData = await Promise.all(
          response.data.map(async (post) => {
            if (post.featured_media) {
              const mediaResponse = await axios.get<{ source_url: string }>(`${WORDPRESS_API}/media/${post.featured_media}`);
              return { ...post, featured_media_details: mediaResponse.data };
            }
            return post;
          })
        );
        setPosts(postsWithData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  // Function to truncate content to a specific number of words
  const truncateContent = (content: string, numWords: number) => {
    const words = content.replace(/<[^>]*>/g, " ").trim().split(/\s+/);
    return words.slice(0, numWords).join(" ") + (words.length > numWords ? "..." : "");
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-16 pt-32 text-foreground">
      <h1 className="display-heading mb-10 text-center text-5xl text-primary">Blog</h1>
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="overflow-hidden border border-primary/15 bg-white shadow-sm">
            <div className="p-5">
              <a href={post.link}>
                {post.featured_media_details && (
                  <img
                    src={post.featured_media_details.source_url}
                    alt={post.title?.rendered ?? ""}
                    className="mb-5 aspect-[16/10] w-full object-cover"
                  />
                )}
              </a>
              <h2 className="display-heading mb-3 text-2xl text-primary"><a href={post.link}>{post.title?.rendered}</a></h2>
              <p className="text-sm leading-6 text-muted-foreground">{truncateContent(post.content?.rendered ?? "", 20)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/blog")({
  head: () => ({
    links: canonicalUrl("/blog") ? [{ rel: "canonical", href: canonicalUrl("/blog")! }] : [],
    meta: [
      { title: `Blog | ${SITE_NAME}` },
      { name: "description", content: `Stories and updates from ${SITE_NAME}.` },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: `Blog | ${SITE_NAME}` },
      { property: "og:description", content: `Stories and updates from ${SITE_NAME}.` },
      { property: "og:type", content: "website" },
      ...(canonicalUrl("/blog") ? [{ property: "og:url", content: canonicalUrl("/blog")! }] : []),
    ],
  }),
  component: Blog,
});

export default Blog;
