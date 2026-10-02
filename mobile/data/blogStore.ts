import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { BlogPost } from "@/data/blogPosts";
import { db } from "@/firebaseConfig";

type BlogPostDoc = {
  title?: string;
  summary?: string;
  body?: string;
  author?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  viewCount?: number;
  uniqueViewerCount?: number;
  avgCompletion?: number;
  completionTotal?: number;
  completionSamples?: number;
};

type CreateBlogPostInput = {
  title: string;
  summary: string;
  body: string;
  author?: string;
};

type UpdateBlogPostInput = {
  title: string;
  summary?: string;
  body: string;
};

const BLOG_COLLECTION = "blogPosts";

function toIsoString(value?: Timestamp) {
  return value ? value.toDate().toISOString() : new Date(0).toISOString();
}

function mapBlogPost(id: string, value: BlogPostDoc): BlogPost {
  return {
    id,
    title: value.title?.trim() || "Untitled",
    excerpt: value.summary?.trim() || "",
    content: value.body?.trim() || "",
    createdAt: toIsoString(value.createdAt),
    viewCount: value.viewCount ?? 0,
    uniqueViewerCount: value.uniqueViewerCount ?? 0,
    avgCompletion: value.avgCompletion ?? 0,
  };
}

export function subscribeToBlogPosts(
  onPosts: (posts: BlogPost[]) => void,
  onError?: (error: unknown) => void
) {
  const postsQuery = query(collection(db, BLOG_COLLECTION), orderBy("createdAt", "desc"));

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs.map((docItem) => mapBlogPost(docItem.id, docItem.data() as BlogPostDoc));
      onPosts(posts);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export function subscribeToBlogPost(
  id: string,
  onPost: (post: BlogPost | undefined) => void,
  onError?: (error: unknown) => void
) {
  const postRef = doc(db, BLOG_COLLECTION, id);

  return onSnapshot(
    postRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onPost(undefined);
        return;
      }
      onPost(mapBlogPost(snapshot.id, snapshot.data() as BlogPostDoc));
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function createBlogPost(input: CreateBlogPostInput) {
  const title = input.title.trim();
  const summary = input.summary.trim();
  const body = input.body.trim();
  const author = input.author?.trim();

  const docRef = await addDoc(collection(db, BLOG_COLLECTION), {
    title,
    summary,
    body,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    viewCount: 0,
    uniqueViewerCount: 0,
    avgCompletion: 0,
    completionTotal: 0,
    completionSamples: 0,
    ...(author ? { author } : {}),
  });

  return { id: docRef.id };
}

export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  await updateDoc(doc(db, BLOG_COLLECTION, id), {
    title: input.title.trim(),
    summary: input.summary?.trim() || "",
    body: input.body.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBlogPost(id: string) {
  await deleteDoc(doc(db, BLOG_COLLECTION, id));
}

export async function recordBlogPostView(id: string, incrementUniqueViewer: boolean) {
  const postRef = doc(db, BLOG_COLLECTION, id);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(postRef);
    if (!snap.exists()) {
      return;
    }

    const data = snap.data() as BlogPostDoc;
    const currentViewCount = data.viewCount ?? 0;
    const currentUniqueCount = data.uniqueViewerCount ?? 0;

    transaction.update(postRef, {
      viewCount: currentViewCount + 1,
      uniqueViewerCount: incrementUniqueViewer ? currentUniqueCount + 1 : currentUniqueCount,
    });
  });
}

export async function recordBlogPostCompletion(id: string, completionPercent: number) {
  const postRef = doc(db, BLOG_COLLECTION, id);
  const boundedCompletion = Math.max(0, Math.min(100, Math.round(completionPercent)));

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(postRef);
    if (!snap.exists()) {
      return;
    }

    const data = snap.data() as BlogPostDoc;
    const currentTotal = data.completionTotal ?? 0;
    const currentSamples = data.completionSamples ?? 0;
    const nextTotal = currentTotal + boundedCompletion;
    const nextSamples = currentSamples + 1;
    const nextAverage = Number((nextTotal / nextSamples).toFixed(1));

    transaction.update(postRef, {
      completionTotal: nextTotal,
      completionSamples: nextSamples,
      avgCompletion: nextAverage,
      updatedAt: serverTimestamp(),
    });
  });
}
