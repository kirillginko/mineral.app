const posts = [
  {
    id: "1",
    title: "Post 1",
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
    videoId: "fPggjsFr55c", // Example: YouTube video ID
  },
  {
    id: "2",
    title: "Post 2",
    description: {
      tracklist: [
        { time: "00:00", title: "Track 1" },
        { time: "05:00", title: "Track 2" },
      ],
      credits: [{ role: "Artist", name: "Artist Name" }],
    },
    videoId: "x-qqE7nPlAk", // Example: YouTube video ID
  },
  {
    id: "3",
    title: "Post 3",
    description: {
      tracklist: [
        { time: "00:00", title: "Track 1" },
        { time: "04:30", title: "Track 2" },
      ],
      credits: [{ role: "Artist", name: "Artist Name" }],
    },
    videoId: "44WVPMYuqys", // Example: YouTube video ID
  },
];

export default posts;
