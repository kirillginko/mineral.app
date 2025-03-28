import localFont from "next/font/local";
import "./globals.css";
import ClientSideMotion from "./components/ClientSideMotion";
import { PostsProvider } from "./contexts/PostsContext";
import ClientMenu from "./components/ClientMenu";
import TopBorder from "./components/TopBorder";
import CornerImage from "./components/CornerImage";
import AuthProvider from "./providers/AuthProvider";
import ClientMenuWrapper from "./components/ClientMenuWrapper";
import { VideoPlayerProvider } from "./contexts/VideoPlayerContext";
import MinimizedVideoPlayer from "./components/MinimizedVideoPlayer";
import NavigationHandler from "./components/NavigationHandler";
import { VideoPlayerWrapper } from "./components/VideoPlayerWrapper";

const ASCAfont = localFont({
  src: "./fonts/ASCA.ttf",
  variable: "--font-asca",
  weight: "100 200 300 400 500 600 700 800 900",
});

const TwentyFiveTF = localFont({
  src: "./fonts/205tf.woff2",
  variable: "--font-twentyfive",
  weight: "100 200 300 400 500 600 700 800 900",
});

const Alternative1 = localFont({
  src: "./fonts/alternative1.woff2",
  variable: "--font-alternative1",
  weight: "100 200 300 400 500 600 700 800 900",
});
const Alternative2 = localFont({
  src: "./fonts/alternative2.woff2",
  variable: "--font-alternative2",
  weight: "100 200 300 400 500 600 700 800 900",
});
const Alternative3 = localFont({
  src: "./fonts/alternative3.woff2",
  variable: "--font-alternative3",
  weight: "100 200 300 400 500 600 700 800 900",
});

export const metadata = {
  title: "Mineral.ltd | The Curated Future",
  description: "The Future Curated",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${ASCAfont.variable} ${TwentyFiveTF.variable} ${Alternative1.variable} ${Alternative2.variable} ${Alternative3.variable}`}
      >
        <VideoPlayerProvider>
          <NavigationHandler />

          {/* Place MinimizedVideoPlayer and VideoPlayerWrapper directly here for maximum persistence */}
          <MinimizedVideoPlayer />
          <VideoPlayerWrapper />

          <AuthProvider>
            <PostsProvider>
              <div className="page-layout">
                {/* Corners */}
                <div className="border-container top-left-corner"></div>
                <div className="border-container top-right-corner">
                  <CornerImage />
                </div>
                <div className="border-container bottom-left-corner">
                  {/* Bottom Left Corner Content */}
                </div>
                <div className="border-container bottom-right-corner">
                  {/* Bottom Right Corner Content */}
                </div>

                {/* Borders */}
                <div className="border-container top-border">
                  <TopBorder />
                </div>
                <div className="border-container bottom-border">
                  {/* Bottom Border Content */}
                </div>
                <div className="border-container left-border">
                  {/* Left Border Content */}
                </div>
                <div className="border-container right-border">
                  {/* Right Border Content */}
                </div>

                {/* Main Content */}
                <div className="main-section">
                  <div className="container">
                    {/* Left Column - Menu Bubbles */}
                    <div className="leftColumn">
                      <ClientMenuWrapper />
                    </div>

                    {/* Right Column - Content Area */}
                    <div className="rightColumn">
                      <ClientSideMotion>{children}</ClientSideMotion>
                    </div>
                  </div>
                </div>
              </div>
            </PostsProvider>
          </AuthProvider>
        </VideoPlayerProvider>
      </body>
    </html>
  );
}
