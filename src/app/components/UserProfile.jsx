"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function UserProfile({ user, onUpdate }) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(user?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const isCurrentUser = session?.user.email === user?.email;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create FormData
      const formData = new FormData();
      formData.append("image", file);

      // Upload to Cloudinary
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { url } = await uploadResponse.json();

      // Update user profile with new image URL
      const response = await fetch(`/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Update local state through parent component
      const updatedUser = await response.json();
      if (onUpdate) {
        onUpdate(updatedUser);
      }
    } catch (err) {
      console.error("Error updating profile image:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedUser = await response.json();
      if (onUpdate) {
        onUpdate(updatedUser);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0 relative group">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500 text-xl">
              {(user.name || "User").charAt(0)}
            </span>
          </div>
        )}
        {isCurrentUser && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isSubmitting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isSubmitting}
            />
          </>
        )}
      </div>

      <div className="flex-grow">
        <h2 className="text-xl font-semibold">
          {user.name || "Anonymous User"}
        </h2>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short description about yourself"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
              disabled={isSubmitting}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <div className="flex space-x-2 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setDescription(user.description || "");
                }}
                className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-1">
            <p className="text-gray-600">
              {user.description || "No description yet."}
            </p>
            {isCurrentUser && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-blue-500 mt-1 hover:underline"
              >
                {user.description ? "Edit description" : "Add description"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
