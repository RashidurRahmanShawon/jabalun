import Script from "next/script";
import PixelPageView from "./PixelPageView";

// Meta Pixel base code (PageView only). Purchase is sent by the WordPress plugin.
// Renders nothing — and loads no Meta file — when NEXT_PUBLIC_META_PIXEL_ID is empty.
export default function MetaPixel() {
  const pixelId = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  // Pixel IDs are numeric; anything else is ignored so it can't inject into the script
  if (!/^\d+$/.test(pixelId)) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('set','autoConfig',false,'${pixelId}');
fbq('init','${pixelId}');
fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's tracking pixel, not content */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
      <PixelPageView />
    </>
  );
}
