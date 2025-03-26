import React, { createContext, useState, useCallback, useMemo } from "react";

interface VideoPlayerState {
  currentVideo: string | null;
  isMinimized: boolean;
  isPlaying: boolean;
}

interface VideoPlayerActions {
  playVideo: (url: string) => void;
  toggleMinimize: () => void;
  pauseVideo: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerState & VideoPlayerActions>(
  {
    currentVideo: null,
    isMinimized: false,
    isPlaying: false,
    playVideo: () => {},
    toggleMinimize: () => {},
    pauseVideo: () => {},
  }
);

export function VideoPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<VideoPlayerState>({
    currentVideo: null,
    isMinimized: false,
    isPlaying: false,
  });

  const playVideo = useCallback((url: string) => {
    setState((prev) => ({
      currentVideo: url,
      isMinimized: false,
      isPlaying: true,
    }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const pauseVideo = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      playVideo,
      toggleMinimize,
      pauseVideo,
    }),
    [state, playVideo, toggleMinimize, pauseVideo]
  );

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}
