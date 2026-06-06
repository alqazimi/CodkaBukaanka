import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";



const linkClass = "text-white/75 transition-colors duration-200 hover:text-white";



export async function Footer() {

  const t = await getTranslations("nav");

  const tFooter = await getTranslations("footer");

  const year = new Date().getFullYear();



  return (

    <footer className="relative border-t border-white/10 bg-white/5 text-white/75 backdrop-blur-2xl">
      <div className="footer-accent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-3">

          <div>

            <h3 className="font-serif text-xl font-semibold tracking-tight text-white">CodkaBukaanka</h3>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">{tFooter("tagline")}</p>

          </div>

          <div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">{tFooter("legalHeading")}</h4>

            <ul className="mt-4 space-y-2.5 text-sm">

              <li><Link href="/about" prefetch className={linkClass}>{t("about")}</Link></li>

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

        <p className="mt-10 border-t border-white/15 pt-8 text-center text-xs text-white/50">

          {tFooter("copyright", { year })}

        </p>

      </div>

    </footer>

  );

}

