import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

const linkClass = "transition-colors duration-200 hover:text-teal-400";

export async function Footer() {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-900/40 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-navy-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-xl font-semibold tracking-tight text-white">CodkaBukaanka</h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy-300">{tFooter("tagline")}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">{tFooter("legalHeading")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/privacy" prefetch className={linkClass}>{t("privacy")}</Link></li>
              <li><Link href="/terms" prefetch className={linkClass}>{t("terms")}</Link></li>
              <li><Link href="/corrections" prefetch className={linkClass}>{t("corrections")}</Link></li>
              <li><Link href="/contact" prefetch className={linkClass}>{t("contact")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">{tFooter("archiveHeading")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/search" prefetch className={linkClass}>{t("search")}</Link></li>
              <li><Link href="/hospitals" prefetch className={linkClass}>{t("hospitals")}</Link></li>
              <li><Link href="/patients" prefetch className={linkClass}>{t("patients")}</Link></li>
              <li><Link href="/doctors" prefetch className={linkClass}>{tFooter("doctors")}</Link></li>
              <li><Link href="/medications" prefetch className={linkClass}>{tFooter("medications")}</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-navy-800/80 pt-8 text-center text-xs text-navy-400">
          {tFooter("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
