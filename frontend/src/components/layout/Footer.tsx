import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { FACEBOOK_URL, WHATSAPP_PHONE_DISPLAY, WHATSAPP_URL } from "@/lib/contact";

export async function Footer() {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer id="site-footer" className="footer-shell relative backdrop-blur-2xl">
      <div className="footer-accent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <SiteLogo size="lg" />
            <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-white/65">{tFooter("tagline")}</p>
          </div>
          <div>
            <h4 className="footer-heading">{tFooter("legalHeading")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" prefetch className="footer-link">{t("about")}</Link></li>
              <li><Link href="/privacy" prefetch className="footer-link">{t("privacy")}</Link></li>
              <li><Link href="/terms" prefetch className="footer-link">{t("terms")}</Link></li>
              <li><Link href="/corrections" prefetch className="footer-link">{t("corrections")}</Link></li>
              <li><Link href="/contact" prefetch className="footer-link">{t("contact")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">{tFooter("archiveHeading")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/search" prefetch className="footer-link">{t("search")}</Link></li>
              <li><Link href="/hospitals" prefetch className="footer-link">{t("hospitals")}</Link></li>
              <li><Link href="/patients" prefetch className="footer-link">{t("patients")}</Link></li>
              <li><Link href="/doctors" prefetch className="footer-link">{tFooter("doctors")}</Link></li>
              <li><Link href="/medications" prefetch className="footer-link">{tFooter("medications")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">{tFooter("contactHeading")}</h4>
            <div className="mt-4 space-y-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-phone block"
              >
                {WHATSAPP_PHONE_DISPLAY}
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-social inline-flex items-center gap-2"
              >
                <FacebookIcon />
                <span>{tFooter("facebookLink")}</span>
              </a>
              <p className="text-sm font-medium leading-relaxed text-white/55">{tFooter("contactNote")}</p>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-white/15 pt-8 text-center text-xs text-white/50">
          {tFooter("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
