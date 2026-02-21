import { BlogPost, initialBlogPosts } from "@/data/blogPosts";

let posts: BlogPost[] = [...initialBlogPosts].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
);

function makeId(input: string) {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const fallback = `post-${Date.now()}`;
  const base = slug || fallback;
  const exists = posts.some((post) => post.id === base);

  return exists ? `${base}-${Date.now()}` : base;
}

export function listBlogPosts() {
  return [...posts];
}

export function getBlogPostById(id: string) {
  return posts.find((post) => post.id === id);
}

export function createBlogPost(input: { title: string; content: string }) {
  const title = input.title.trim();
  const content = input.content.trim();

  const post: BlogPost = {
    id: makeId(title),
    title,
    excerpt: content.slice(0, 96) + (content.length > 96 ? "..." : ""),
    content,
    createdAt: new Date().toISOString(),
  };

  posts = [post, ...posts];
  return post;
}

export function updateBlogPost(id: string, input: { title: string; content: string }) {
  const title = input.title.trim();
  const content = input.content.trim();

  posts = posts.map((post) => {
    if (post.id !== id) {
      return post;
    }

    return {
      ...post,
      title,
      excerpt: content.slice(0, 96) + (content.length > 96 ? "..." : ""),
      content,
    };
  });

  return getBlogPostById(id);
}
