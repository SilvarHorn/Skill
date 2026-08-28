import "./globals.css";
// import RoleSwitcher from "../components/shared/RoleSwitcher";
import Navbar from "../components/shared/Navbar";


export const metadata = {
  title: "Skill Bridge",
  name: "Skill Bridge",
  logo: {
      "@type": "ImageObject",
      url: `/logo.png`,
      width: 2048,
      height: 2048,
    },
  description: "Industry Collaboration Platform for Skill Mapping, Internships and Placement Matching",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
        {/* <RoleSwitcher /> */}
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
          Skill Bridge -2026. -- Team Rising Phoenix --
        </footer>
      </body>
    </html>
  );
}
