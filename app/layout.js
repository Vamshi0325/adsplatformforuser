import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/auth-context";
import "../styles/globals.css";

export const metadata = {
  title: "SwiftAds",
  description: "SwiftAds - The Next Generation of Ads",
  icon: "/images/icons/swift_ads.png",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" cz-shortcut-listen="true">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
