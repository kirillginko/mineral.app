/**
 * Configuration for music channels to fetch videos from
 * Format:
 * - id: Channel ID (if known) or null
 * - username: Channel username or custom URL identifier
 * - title: Display name for the channel
 * - tags: Array of tags/categories for filtering
 * - isActive: Whether to include this channel when fetching new videos
 */
const musicChannels = [
  {
    id: null,
    username: "TheLonelyCrowd",
    title: "The Lonely Crowd",
    tags: ["jazz", "soul"],
    isActive: true,
  },
  {
    id: null,
    username: "yellowbalkan",
    title: "Yellow Balkan",
    tags: ["world", "balkan"],
    isActive: true,
  },
  {
    id: null,
    username: "SoulsSounds",
    title: "Soul Sounds",
    tags: ["soul", "funk"],
    isActive: true,
  },
  {
    id: "UCOxqgCwgOqC2lMqC5PYz_Dg",
    username: null,
    title: "Jazz Funk",
    tags: ["jazz", "funk"],
    isActive: true,
  },
  {
    id: "UCDVTVrFuqRxr5nULpFXxXuw",
    username: null,
    title: "Colors of Jazz",
    tags: ["jazz"],
    isActive: true,
  },
];

export default musicChannels;
