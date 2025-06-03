import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/auth-context";
import "../styles/globals.css";

export const metadata = {
  title: "Next.js 15 Auth Dashboard",
  description: "Dashboard with Sidebar, Header and Auth",
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
