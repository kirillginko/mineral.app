import fs from "fs/promises";
import path from "path";

// Default initial posts
const initialPosts = [
  {
    id: "1",
    title: "11.03.2025",
    description: {
      tracklist: [
        { time: "00:00", title: "Catania" },
        { time: "07:44", title: "Nashwa" },
        { time: "17:22", title: "An Evening With Jerry" },
        { time: "24:26", title: "When The Lights Go Out" },
        { time: "31:40", title: "Storyteller" },
        { time: "40:32", title: "Ornette Never Sleeps" },
        { time: "44:36", title: "Nadim" },
        { time: "54:15", title: "Wishing Well" },
      ],
      credits: [
        { role: "Alto Saxophone", name: "Sonny Fortune" },
        { role: "Bass", name: "Glen Moore" },
        {
          role: "Drum [South Indian Drums], Percussion",
          name: "Ramesh Shotham",
        },
        { role: "Frame Drum [Frame Drums], Percussion", name: "Nabil Khaiat" },
        {
          role: "Oud, Composed By [Compositions By], Producer, Cover, Design [Cover Design By]",
          name: "Rabih Abou-Khalil",
        },
        { role: "Photography By", name: "Ralph Weber" },
        { role: "Copyright ©", name: "Enja Records Matthias Winckelmann GmbH" },
      ],
    },
    videoId: "fPggjsFr55c",
  },
  {
    id: "2",
    title: "11.04.2025",
    description: {
      tracklist: [
        { time: "00:00", title: "Track 1" },
        { time: "05:00", title: "Track 2" },
      ],
      credits: [{ role: "Artist", name: "Artist Name" }],
    },
    videoId: "x-qqE7nPlAk",
  },
  {
    id: "3",
    title: "11.05.2025",
    description: {
      tracklist: [
        { time: "00:00", title: "Track 1" },
        { time: "04:30", title: "Track 2" },
      ],
      credits: [{ role: "Artist", name: "Artist Name" }],
    },
    videoId: "44WVPMYuqys",
  },
  {
    id: "4",
    title: "11.06.2025",
    description: {
      tracklist: [
        { time: "00:00", title: "Track 1" },
        { time: "04:30", title: "Track 2" },
      ],
      credits: [{ role: "Artist", name: "Artist Name" }],
    },
    videoId: "IyvqVDAGU0s",
  },
];

// Path to the JSON file that will store posts
const JSON_FILE_PATH = path.join(
  process.cwd(),
  "src",
  "app",
  "data",
  "posts.json"
);

// Function to initialize the posts file if it doesn't exist
async function initPostsFile() {
  try {
    await fs.access(JSON_FILE_PATH);
  } catch (error) {
    // File doesn't exist, create it with initial posts
    await fs.writeFile(JSON_FILE_PATH, JSON.stringify(initialPosts, null, 2));
  }
}

// Function to get all posts
async function getAllPosts() {
  await initPostsFile();
  const postsJson = await fs.readFile(JSON_FILE_PATH, "utf8");
  return JSON.parse(postsJson);
}

// Function to add a new post
async function addPost(post) {
  const posts = await getAllPosts();
  posts.unshift(post); // Add to the beginning
  await fs.writeFile(JSON_FILE_PATH, JSON.stringify(posts, null, 2));
  return post;
}

// Function to get a post by ID
async function getPostById(id) {
  const posts = await getAllPosts();
  return posts.find((post) => post.id === id) || null;
}

// Function to delete a post
async function deletePost(id) {
  const posts = await getAllPosts();
  const updatedPosts = posts.filter((post) => post.id !== id);
  await fs.writeFile(JSON_FILE_PATH, JSON.stringify(updatedPosts, null, 2));
}

// For client-side import compatibility (Next.js)
export default initialPosts;

// For server-side usage
export { getAllPosts, addPost, getPostById, deletePost };
