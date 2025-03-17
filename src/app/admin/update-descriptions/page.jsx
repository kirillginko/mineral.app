"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UpdateDescriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Check authentication and redirect if not admin
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const updateDescriptions = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch("/api/posts/update-descriptions", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update descriptions");
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Update Post Descriptions</h1>
      <p className="mb-4">
        This utility will update all posts that don't have descriptions by
        fetching them from YouTube.
      </p>

      <button
        onClick={updateDescriptions}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Descriptions"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Results</h2>
          <div className="mb-3">
            <p>
              <span className="font-medium">Updated:</span> {results.updated}{" "}
              posts
            </p>
            <p>
              <span className="font-medium">Failed:</span> {results.failed}{" "}
              posts
            </p>
          </div>

          {results.updatedPosts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Updated Posts</h3>
              <ul className="list-disc list-inside">
                {results.updatedPosts.map((post) => (
                  <li key={post.id}>
                    ID: {post.id} (Video ID: {post.videoId})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.failedPosts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Failed Posts</h3>
              <ul className="list-disc list-inside">
                {results.failedPosts.map((post) => (
                  <li key={post.id}>
                    ID: {post.id} - Reason: {post.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
