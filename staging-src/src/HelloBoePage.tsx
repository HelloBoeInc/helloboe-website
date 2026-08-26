/**
 * HelloBoePage — the whole marketing site.
 *
 * There is deliberately NO COPY AND NO URL in this file. Every word and every
 * link comes from ../content.json, so Kim and Andrew can change the site
 * without touching code (see EDITING.md). If you find yourself typing a
 * sentence in here, it belongs in content.json instead.
 *
 * What DOES live here: layout, colour, type scale, and motion. Those are
 * design decisions and are intentionally not editable from the CMS.
 */
import { useEffect, useState } from "react";
import content from "../content.json";
import { BadgeApple, BadgeGoogle } from "@/components/StoreBadges";

import imgHelloBoeLogoBlack3 from "@/imports/IPhone161/d9d170e65fafae60c9eb717c157fabe25967e9a6.webp";
import imgVector4 from "@/imports/IPhone161/f74aad6e3b5409aad265b525113d47a5c2ac8d56.webp";
import imgFamilyDimensions4 from "@/imports/IPhone161/90eee4a3b6c09a6e4d7b26669057259f21ef7e30.webp";
import imgHelloBoeAppIcon10243 from "@/imports/IPhone161/c6220e2ce5ce6de91798baaeb5b7c001c09c6db4.webp";
import imgMaverick3 from "@/imports/IPhone161/9d76c5b22c22764c23649a5175dcb28002aa1bd9.webp";
import imgInventor3 from "@/imports/IPhone161/2f334ecd46ff54f7d2f987bfee3cee6d5a9a7ce9.webp";
import imgEmpath4 from "@/imports/IPhone161/e97fa6464c28ab5432db6d79f72a2190c0eaffeb.webp";
import imgDetective4 from "@/imports/IPhone161/c6c0c4a91ecbdaf6037bdebc06d9f5010da83706.webp";
import imgPhilosopher4 from "@/imports/IPhone161/f2e543fdc3b253b08cb6091928406aeec4877d4c.webp";
import imgNavigator4 from "@/imports/IPhone161/2228ac3a11c28c0e705214da340ae180c8708bb8.webp";
import imgDecodeRing from "@/imports/IPhone161/b84887adad7f8042e505b8d1e90fa41a6dced3cf.webp";
import imgImg18782 from "@/imports/IPhone161/d0708f75ba8563e72b04bacada6a912a459d749e.webp";
import imgImg18861 from "@/imports/IPhone161/2a046a02107edde7da1a68cf73937cf1f14a661b.webp";
import imgImg18822 from "@/imports/IPhone161/87903bbbcee3baad054688a3a4b6786578ad4425.webp";
import imgImg18851 from "@/imports/IPhone161/d3c9ba111307aeafa00cf10e124ffc745e4f710e.webp";
import imgBoeChatIcon from "@/imports/IPhone161/aaf8ff088ced9b69dfa243ee9c65e8087aab11f4.webp";

const C = content;

/* ---------------------------------------------------------------------------
   Design constants — NOT editable from the CMS, on purpose.
   Profile colours are brand-locked and map to the app's archetype palette;
   letting them drift from a content file is how a brand comes apart.
--------------------------------------------------------------------------- */
const PROFILE_STYLE: Record<string, { color: string; img: string }> = {
  maverick: { color: "#f30", img: imgMaverick3 },
  inventor: { color: "#007adc", img: imgInventor3 },
  empath: { color: "#bc310a", img: imgEmpath4 },
  detective: { color: "#005296", img: imgDetective4 },
  philosopher: { color: "#db8102", img: imgPhilosopher4 },
  navigator: { color: "#e99800", img: imgNavigator4 },
};

const FEATURE_IMG: Record<string, string> = {
  navigate: imgImg18861,
  playshelf: imgImg18822,
  checkins: imgImg18851,
};

const POPPINS = { fontFamily: "'Poppins', sans-serif" } as React.CSSProperties;
const NUNITO = {
  fontFamily: "'Nunito Sans', sans-serif",
  fontVariationSettings: '"YTLC" 500, "wdth" 100',
} as React.CSSProperties;

/* ---------------------------------------------------------------------------
   Link resolution
   ---------------------------------------------------------------------------
   Any href in content.json may be written as "@links.press", meaning "use
   whatever is in the links block". That keeps a URL in exactly one place even
   when it appears in the nav and the footer.
--------------------------------------------------------------------------- */
type LinkKey = keyof typeof C.links;

function resolveHref(href: string): string {
  if (href.startsWith("@links.")) {
    const key = href.slice("@links.".length) as LinkKey;
    return (C.links[key] as string) ?? "";
  }
  return href;
}

const isLive = (href: string) => resolveHref(href).length > 0;
const storesLive = isLive(C.links.appStore) || isLive(C.links.googlePlay);

/** A real anchor when there is a destination, a dimmed unclickable span when
 *  there is not. Layout is identical either way, so an empty URL in
 *  content.json never breaks the page — it just greys the link out. */
function MaybeLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const url = resolveHref(href);
  if (!url) {
    return (
      <span className={`${className} hb-inactive`} aria-disabled="true">
        {children}
      </span>
    );
  }
  // Our own pages (privacy, terms, disclaimer, delete-account, …) open in the
  // SAME tab so the reader can come back with the back button; only links that
  // leave helloboe.com get a new tab.
  const external =
    url.startsWith("http") && !/^https?:\/\/([a-z0-9-]+\.)*helloboe\.com(\/|$)/i.test(url);
  return (
    <a
      href={url}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * Renders a three-part heading: plain text, a coloured italic word, plain text.
 *
 * whitespace-pre-line is deliberate. A line break inside a headline is a design
 * decision the copywriter needs control of ("One size / fits none."), and a
 * newline typed in content.json is the only way to express that without
 * putting HTML in a content file.
 */
function Heading({
  parts,
  color,
  className = "",
  as: Tag = "h2",
  style,
  ...rest
}: {
  parts: { before: string; highlight: string; after: string };
  color: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
} & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    // style is MERGED, not replaced: a caller passing an animation delay must
    // not silently drop the Poppins font.
    <Tag className={`whitespace-pre-line ${className}`} style={{ ...POPPINS, ...style }} {...rest}>
      {parts.before}
      {parts.highlight ? <span className="italic" style={{ color }}>{parts.highlight}</span> : null}
      {parts.after}
    </Tag>
  );
}

/** Report a store badge click to Plausible (cookieless; the queue stub emitted
 *  by build-staging.mjs guarantees window.plausible exists even if the script
 *  is still loading or blocked). Shows up as the "Download Click" goal with a
 *  `store` breakdown of apple vs google. */
function trackDownload(store: "apple" | "google") {
  (window as unknown as { plausible?: (e: string, o?: object) => void }).plausible?.(
    "Download Click",
    { props: { store } },
  );
}

function AppBadges() {
  const badge = (kind: "apple" | "google") => {
    const href = kind === "apple" ? C.links.appStore : C.links.googlePlay;
    const Art = kind === "apple" ? BadgeApple : BadgeGoogle;
    const label = kind === "apple" ? "Download HelloBoe on the App Store" : "Get HelloBoe on Google Play";
    if (!isLive(href)) {
      return (
        <span className="hb-badge" data-live="false" aria-disabled="true" role="img" aria-label={`${label}. Not yet available.`}>
          <Art />
        </span>
      );
    }
    return (
      <a
        href={resolveHref(href)}
        target="_blank"
        rel="noopener noreferrer"
        className="hb-badge"
        data-live="true"
        aria-label={label}
        onClick={() => trackDownload(kind)}
      >
        <Art />
      </a>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap gap-3 justify-center">
        {badge("apple")}
        {badge("google")}
      </div>
      {!storesLive && C.links.preLaunchNote ? (
        <p className="text-[#6d6358] text-[11px] leading-[1.3] tracking-[0.2px]">{C.links.preLaunchNote}</p>
      ) : null}
    </div>
  );
}

function PhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[197px] drop-shadow-[0px_4px_8px_rgba(0,0,0,0.15)] shrink-0">
      <div className="bg-[#252325] rounded-[25px] overflow-hidden border-[3px] border-[#566a87]">
        <img src={src} alt={alt} loading="lazy" className="w-full rounded-[22px] object-cover" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Motion
   ---------------------------------------------------------------------------
   One IntersectionObserver for the page. Elements marked [data-reveal] get
   data-shown="true" the first time they enter view, then stop being observed.

   data-js is set on <html> as the first act. The hidden-by-default CSS is
   scoped to html[data-js], so if this code never runs nothing is ever hidden
   and the page renders plain and complete rather than blank.
--------------------------------------------------------------------------- */
function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-js", "");

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealAll = () => targets.forEach((el) => el.setAttribute("data-shown", "true"));

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-shown", "true");
          observer.unobserve(entry.target);
        });
      },
      // Start slightly before the element reaches the bottom edge, so the
      // movement finishes as the reader arrives rather than starting then.
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => observer.observe(el));

    // Anything already on screen at mount reveals immediately.
    requestAnimationFrame(() => {
      targets.forEach((el) => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) {
          el.setAttribute("data-shown", "true");
          observer.unobserve(el);
        }
      });
    });

    // Printing does not scroll, so anything not yet reached would print blank.
    window.addEventListener("beforeprint", revealAll);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", revealAll);
    };
  }, []);
}

/** True once the page has scrolled far enough for the nav to need a backdrop. */
function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Staggers a list: item n waits n * step milliseconds. */
const stagger = (index: number, step = 70) =>
  ({ "--reveal-delay": `${index * step}ms` }) as React.CSSProperties;

/* ========================================================================= */

export default function HelloBoePage() {
  useScrollReveal();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on Escape, and when the viewport grows to desktop
  // (otherwise the panel stays mounted, invisible, and can trap focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <div className="bg-[#fdf4e9] min-h-screen w-full overflow-x-hidden" style={{ fontFamily: "'Nunito Sans', sans-serif" }}>

      {/* ---------------------------------------------------------------- NAV */}
      <div className="hb-nav sticky top-0 z-50" data-scrolled={scrolled ? "true" : "false"}>
        <nav className="flex items-center justify-between px-6 lg:px-10 py-4 max-w-[1280px] mx-auto">
          <a href="#top" aria-label="HelloBoe, back to top" className="shrink-0">
            <img src={imgHelloBoeLogoBlack3} alt="HelloBoe" className="h-5 object-contain" />
          </a>

          <div className="hidden lg:flex items-center gap-8">
            {C.nav.items.map((item) => (
              <MaybeLink key={item.label} href={item.href} className="hb-navlink text-[#6d6358] text-[9px] font-semibold hover:text-black transition-colors">
                <span style={NUNITO}>{item.label}</span>
              </MaybeLink>
            ))}
            <a href="#download" className="bg-[#4a4642] text-[#fdf4e9] text-[9px] font-semibold rounded-[4px] px-5 py-[6px] hover:bg-[#2e2b28] transition-colors" style={NUNITO}>
              {C.nav.cta}
            </a>
          </div>

          <button
            type="button"
            className="lg:hidden text-black relative z-10"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" stroke="black" strokeWidth="2" strokeLinecap="round"
                style={{ transition: "transform .3s cubic-bezier(.22,.61,.36,1)", transformOrigin: "center", transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
              <line x1="3" y1="12" x2="21" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round"
                style={{ transition: "opacity .2s ease", opacity: menuOpen ? 0 : 1 }} />
              <line x1="3" y1="18" x2="21" y2="18" stroke="black" strokeWidth="2" strokeLinecap="round"
                style={{ transition: "transform .3s cubic-bezier(.22,.61,.36,1)", transformOrigin: "center", transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
            </svg>
          </button>
        </nav>

        <div
          id="mobile-menu"
          className="hb-menu lg:hidden absolute right-4 left-4 top-[56px] bg-[#fdf4e9] border border-[#e6dfd5] rounded-[14px] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)] p-5"
          data-open={menuOpen ? "true" : "false"}
          aria-hidden={!menuOpen}
        >
          <div className="flex flex-col gap-4" onClick={() => setMenuOpen(false)}>
            {C.nav.items.map((item) => (
              <MaybeLink key={item.label} href={item.href} className="text-[#4a4642] text-[13px] font-semibold">
                <span style={NUNITO}>{item.label}</span>
              </MaybeLink>
            ))}
            <a href="#download" className="bg-[#4a4642] text-[#fdf4e9] text-[13px] font-semibold rounded-[6px] px-5 py-[10px] text-center" style={NUNITO}>
              {C.nav.cta}
            </a>
          </div>
        </div>
      </div>

      <span id="top" aria-hidden="true" />

      {/* -------------------------------------------------------------- HERO */}
      <section className="px-6 lg:px-10 pt-8 pb-12 max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center text-center">
          <Heading
            as="h1"
            data-hero
            style={stagger(0, 90)}
            parts={C.hero.heading}
            color="#ff4a00"
            className="text-[42px] sm:text-[54px] lg:text-[64px] font-extrabold leading-[1.05] tracking-[0.64px] mb-6"
          />
          <p data-hero style={stagger(1, 90)} className="text-[#6d6358] text-[16px] lg:text-[20px] leading-[1.3] mb-8 max-w-[460px] lg:max-w-[920px]">
            {C.hero.subhead}
          </p>

          {/* data-hero (fade up) and data-float (slow drift) must sit on
              SEPARATE elements: both drive `animation`, so on one element the
              second rule wins and the first never runs. */}
          <div data-hero style={stagger(2, 90)} className="mb-4">
            <div data-float className="relative w-[240px] h-[240px] lg:w-[246px] lg:h-[246px]">
              <img src={imgVector4} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
              <img src={imgFamilyDimensions4} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            </div>
          </div>

          <p data-hero style={stagger(3, 90)} className="text-[#6d6358] text-[12px] leading-[1.3] mb-6">
            {C.hero.ageNote}
          </p>

          <div data-hero style={stagger(4, 90)} className="flex flex-col items-center gap-4">
            <div className="relative w-[79px] h-[79px]">
              <img src={imgHelloBoeAppIcon10243} alt="HelloBoe app icon" className="w-full h-full object-cover rounded-[20px]" />
              <div className="absolute inset-0 rounded-[20px] border border-[#e6dfd5] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
            </div>
            <AppBadges />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- PROBLEM */}
      <section data-reveal className="bg-[#f6efe2] px-6 lg:px-10 py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto text-center">
          <p className="text-[#f45422] text-[13px] font-semibold tracking-[1.95px] mb-6" style={POPPINS}>{C.problem.eyebrow}</p>
          <Heading parts={C.problem.heading} color="#f45422" className="text-[36px] sm:text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-8 max-w-[519px] mx-auto" />
          <div className="max-w-[600px] mx-auto">
            {C.problem.body.map((para, i) => (
              <p key={i} className={`text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3] ${i === C.problem.body.length - 1 ? "mb-12" : "mb-4"}`}>
                {para}
              </p>
            ))}
          </div>
          <p className="text-[22px] lg:text-[24px] font-extrabold leading-[1.05] tracking-[0.25px] max-w-[550px] mx-auto" style={POPPINS}>
            {C.problem.closer}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ SIX PROFILES */}
      <section data-reveal id="six-profiles" className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto text-center">
        <p className="text-[#0177d7] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{C.profiles.eyebrow}</p>
        <Heading parts={C.profiles.heading} color="#e99800" className="text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-6" />
        <p className="text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3] mb-12 max-w-[600px] mx-auto">{C.profiles.intro}</p>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5 mb-10 max-w-[900px] mx-auto">
          {C.profiles.cards.map((p, i) => {
            const style = PROFILE_STYLE[p.key];
            return (
              <div key={p.key} data-reveal="scale" style={stagger(i, 80)} className="hb-card bg-white border border-[rgba(0,0,0,0.1)] rounded-[17px] lg:rounded-[32px] p-3 lg:p-4 flex flex-col items-center text-center">
                <img src={style?.img} alt="" loading="lazy" className="hb-card-icon w-10 h-10 lg:w-[87px] lg:h-[87px] object-contain mb-2" />
                <p className="text-[7px] lg:text-[13.75px] font-semibold tracking-[1px] lg:tracking-[2px] leading-[1.4] mb-1" style={{ ...POPPINS, color: style?.color }}>{p.name}</p>
                <p className="text-[#6d6358] text-[6px] lg:text-[12px] leading-[1.3]">{p.desc}</p>
              </div>
            );
          })}
        </div>

        <MaybeLink href={C.links.primaryCta} className="hb-cta inline-block bg-[#0177d7] text-[#fdf4e9] text-[11px] font-bold rounded-[7px] px-8 py-3 tracking-[0.5px]">
          <span style={{ fontFamily: "'Nunito Sans', sans-serif" }}>{C.profiles.cta}</span>
        </MaybeLink>
      </section>

      {/* ------------------------------------------------------ HOW IT WORKS */}
      <section data-reveal className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:gap-16 lg:text-left">
          <div className="flex justify-center lg:justify-start lg:w-[405px] shrink-0 mb-10 lg:mb-0">
            <img src={imgDecodeRing} alt="" loading="lazy" className="w-[207px] h-[207px] lg:w-[405px] lg:h-[405px] object-contain" />
          </div>

          <div className="flex-1">
            <p className="text-[#0177d7] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{C.howItWorks.eyebrow}</p>
            <Heading parts={C.howItWorks.heading} color="#3174cb" className="text-[36px] lg:text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-10" />

            <div className="flex flex-col gap-8 text-left">
              {C.howItWorks.steps.map((step, i) => (
                <div key={step.n}>
                  {i > 0 && <div className="border-t border-[#E6DFD5] mb-8" />}
                  <div className="flex gap-4 items-start">
                    <span className="font-black bg-[#0177d7] text-[#fdf4e9] rounded-full w-9 h-9 lg:w-auto lg:h-auto lg:rounded-none lg:bg-transparent lg:text-[#0177d7] lg:text-[40px] lg:leading-[1.3] flex items-center justify-center shrink-0 text-[13px]" style={POPPINS}>
                      {step.n}
                    </span>
                    <div>
                      <p className="text-[13px] lg:text-[24px] font-extrabold leading-[1.05] mb-1 lg:mb-2" style={POPPINS}>{step.title}</p>
                      <p className="text-[#6d6358] text-[10px] lg:text-[16px] leading-[1.3]">{step.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ THE REVEAL */}
      <section data-reveal className="bg-gradient-to-b from-[#005296] to-[#163252] px-6 lg:px-10 py-20 text-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto text-center">
          <p className="text-[#e99800] text-[13px] font-semibold tracking-[1.95px] mb-6" style={POPPINS}>{C.reveal.eyebrow}</p>
          <Heading parts={C.reveal.heading} color="#e99800" className="text-[36px] lg:text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-8 max-w-[525px] mx-auto" />
          <p className="text-[14px] lg:text-[16px] leading-[1.3] mb-12 max-w-[427px] mx-auto">{C.reveal.body}</p>
          <div className="flex justify-center">
            <div className="relative w-[145px] lg:w-[218px] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]">
              <div className="bg-[#252325] rounded-[22px] overflow-hidden border-[3px] border-[#566a87]">
                <img src={imgImg18782} alt="The HelloBoe temperament report" loading="lazy" className="w-full rounded-[19px] object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- INSIDE THE APP */}
      <section data-reveal id="the-app" className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-[#0076ce] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{C.app.eyebrow}</p>
          <Heading parts={C.app.heading} color="#f15a29" className="text-[36px] lg:text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-6 max-w-[760px] mx-auto" />
          <p className="text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3] max-w-[488px] mx-auto">{C.app.intro}</p>
        </div>

        {C.app.features.map((f, i) => (
          <div
            key={f.key}
            data-reveal={i % 2 === 0 ? "right" : "left"}
            className={`flex flex-col items-center lg:items-center lg:gap-16 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} ${i < C.app.features.length - 1 ? "mb-16 lg:mb-24" : ""}`}
          >
            <div className="flex-1 text-left mb-8 lg:mb-0">
              <p className="text-[#0076ce] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{f.eyebrow}</p>
              <Heading as="h3" parts={f.heading} color="#f15a29" className="text-[24px] font-extrabold leading-[1.05] mb-4" />
              <p className="text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3]">{f.body}</p>
            </div>
            <PhoneMockup src={FEATURE_IMG[f.key]} alt={f.eyebrow.toLowerCase()} />
          </div>
        ))}
      </section>

      {/* ------------------------------------------------------- DIFFERENCE */}
      <section data-reveal className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:gap-16 lg:text-left">
          <div className="flex-1 mb-10 lg:mb-0">
            <p className="text-[#0076ce] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{C.difference.eyebrow}</p>
            <Heading parts={C.difference.heading} color="#f15a29" className="text-[24px] lg:text-[32px] font-extrabold leading-[1.05] tracking-[0.24px] mb-6" />
            <p className="text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3] max-w-[400px] mx-auto lg:mx-0">{C.difference.body}</p>
          </div>

          <div className="bg-[#f5f0ea] rounded-2xl p-4 w-full max-w-[420px] lg:max-w-[480px]">
            <div className="flex justify-end mb-4">
              <div className="bg-[#007adc] text-white text-[9px] rounded-tl-[5px] rounded-tr-[5px] rounded-bl-[5px] px-3 py-2 max-w-[70%] leading-[1.4]">
                {C.difference.chat.question}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {C.difference.chat.replies.map((m, i) => (
                <div key={i} data-reveal="left" style={stagger(i, 110)} className="flex gap-2 items-start">
                  <img src={imgBoeChatIcon} alt="" loading="lazy" className="w-[22px] h-[22px] rounded-full shrink-0 mt-4" />
                  <div className="flex-1">
                    <p className="text-[3.8px] font-semibold tracking-[2.4px] mb-1" style={{ ...POPPINS, color: PROFILE_STYLE[m.profile]?.color }}>
                      {m.archetype} <span className="text-[#9a9385]">• {C.difference.chat.ageLabel}</span>
                    </p>
                    <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-tl-[5px] rounded-tr-[5px] rounded-br-[5px] px-3 py-2">
                      <p className="text-[7.5px] leading-[1.4] text-black">{m.msg}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- SCIENCE */}
      <section data-reveal id="the-science" className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto text-center">
        <p className="text-[#0076ce] text-[13px] font-semibold tracking-[1.95px] mb-4" style={POPPINS}>{C.science.eyebrow}</p>
        <Heading parts={C.science.heading} color="#0076ce" className="text-[36px] lg:text-[40px] font-extrabold leading-[1.05] tracking-[0.4px] mb-8 max-w-[600px] mx-auto" />
        <p className="text-[#6d6358] text-[14px] lg:text-[16px] leading-[1.3] mb-12 max-w-[600px] mx-auto">{C.science.body}</p>

        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-24 gap-8 mb-12">
          {C.science.stats.map((s, i) => (
            <div key={i} data-reveal="scale" style={stagger(i, 100)} className="text-center">
              <p className="text-[#0076ce] text-[40px] font-semibold leading-[1.3]" style={POPPINS}>{s.stat}</p>
              <p className="text-[#6d6358] text-[16px] leading-[1.3] whitespace-pre-line">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[23px] p-6 max-w-[500px] mx-auto">
          <p className="text-[#0076ce] text-[10px] font-semibold tracking-[1.5px] mb-3" style={POPPINS}>{C.science.advisor.eyebrow}</p>
          <p className="text-[#6d6358] text-[12px] leading-[1.3]">
            <span className="font-extrabold text-[12px]">{C.science.advisor.name}</span>{" "}
            {C.science.advisor.body}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- DOWNLOAD */}
      <section data-reveal id="download" className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1280px] mx-auto text-center">
        <Heading parts={C.download.heading} color="#0177d7" className="text-[56px] sm:text-[64px] font-extrabold leading-[1.05] tracking-[0.64px] mb-8" />
        <p className="text-[#6d6358] text-[16px] leading-[1.3] mb-4">{C.download.sub}</p>
        <p className="text-[#6d6358] text-[16px] leading-[1.3] mb-10 font-bold">{C.download.subBold}</p>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[79px] h-[79px]">
            <img src={imgHelloBoeAppIcon10243} alt="HelloBoe app icon" loading="lazy" className="w-full h-full object-cover rounded-[20px]" />
            <div className="absolute inset-0 rounded-[20px] border border-[#e6dfd5] shadow-[4px_4px_4px_0px_rgba(0,0,0,0.25)]" />
          </div>
          <AppBadges />
        </div>
      </section>

      {/* --------------------------------------------------------- FOOTER */}
      <footer data-reveal className="border-t border-[#E6DFD5] px-6 lg:px-10 pt-10 pb-6 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {C.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[8px] font-bold tracking-[1.2px] mb-3" style={POPPINS}>{col.title}</p>
              {col.items.map((item) => (
                <p key={item.label} className="text-[8px] leading-[1.4] mb-1" style={POPPINS}>
                  <MaybeLink href={item.href} className="text-black hover:underline">{item.label}</MaybeLink>
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <img src={imgHelloBoeLogoBlack3} alt="HelloBoe" loading="lazy" className="h-6 object-contain" />
        </div>

        <p className="text-[#6d6358] text-[10px] leading-[1.3] text-center font-light">{C.footer.copyright}</p>
      </footer>
    </div>
  );
}
