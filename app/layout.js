import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MetaPixel from "@/components/MetaPixel";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL("https://new.jabalun.com"),
  title: "জাবালুন — আধুনিক খিমার ও হিজাব",
  description: "আত্মবিশ্বাসী পর্দাশীল নারীর জন্য আধুনিক খিমার ডিজাইন — সম্পূর্ণ আরামে ও স্টাইলে।",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
        <MetaPixel />
      </body>
    </html>
  );
}
