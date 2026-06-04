import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/outsideatl-logo.jpg.asset.json";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border">
      <Link to="/" aria-label="OutsideAtl home" className="block">
        <img src={logoAsset.url} alt="OutsideAtl" className="h-10 w-auto mix-blend-screen invert" />
      </Link>
      <div className="hidden md:flex gap-8 items-center text-[10px] font-mono uppercase tracking-widest">
        <Link to="/" hash="events" className="hover:text-accent transition-colors">
          Events
        </Link>
        <Link to="/" hash="apply" className="hover:text-accent transition-colors">
          Work With Us
        </Link>
        <Link
          to="/apply/$type"
          params={{ type: "artist" }}
          className="hover:text-accent transition-colors"
        >
          DJ Submit
        </Link>
        <Link to="/" hash="contact" className="hover:text-accent transition-colors">
          Contact
        </Link>
        <Link to="/member" className="hover:text-accent transition-colors">
          Member Access
        </Link>
        <Link
          to="/"
          hash="rsvp"
          className="px-3 py-2 bg-accent text-accent-foreground font-bold hover:scale-105 transition-transform"
        >
          RSVP
        </Link>
      </div>
      <Link
        to="/member"
        className="md:hidden px-3 py-2 bg-accent text-accent-foreground font-mono text-[10px] font-bold uppercase"
      >
        Member
      </Link>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="px-6 py-16 border-t border-border flex flex-col md:flex-row justify-between items-start gap-12"
    >
      <div className="space-y-4">
        <img src={logoAsset.url} alt="OutsideAtl" className="h-20 w-auto mix-blend-screen invert" />
        <div className="font-mono text-[10px] text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} OUTSIDEATL</p>
          <p>ATLANTA, GA</p>
          <p>ALL RIGHTS RESERVED</p>
        </div>
        <Link
          to="/admin"
          className="inline-block mt-4 px-3 py-2 border border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent transition-colors"
        >
          Admin
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-16">
        <div className="space-y-4">
          <h5 className="font-mono text-[10px] text-accent uppercase font-bold">Socials</h5>
          <ul className="font-display text-lg uppercase space-y-1">
            <li>
              <a
                href="https://instagram.com/outsid3.atl"
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://tiktok.com/@outsid3.atl"
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                TikTok
              </a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h5 className="font-mono text-[10px] text-accent uppercase font-bold">Apply</h5>
          <ul className="font-display text-lg uppercase space-y-1">
            <li>
              <Link to="/apply/$type" params={{ type: "artist" }} className="hover:text-accent">
                DJs/Artists
              </Link>
            </li>
            <li>
              <Link to="/apply/$type" params={{ type: "vendor" }} className="hover:text-accent">
                Vendors
              </Link>
            </li>
            <li>
              <Link to="/apply/$type" params={{ type: "freelancer" }} className="hover:text-accent">
                Freelancers
              </Link>
            </li>
            <li>
              <Link to="/apply/$type" params={{ type: "intern" }} className="hover:text-accent">
                Interns
              </Link>
            </li>
            <li>
              <Link to="/apply/sponsor" className="hover:text-accent">
                Sponsors
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
