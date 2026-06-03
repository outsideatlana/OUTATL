import "./index.css";
import { LaunchStatus } from "./client.tsx";

export function Root(props: { url: URL }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="OutsideAtl experimental React Server Components experience."
        />
        <title>OutsideAtl RSC Experience</title>
      </head>
      <body>
        <App {...props} />
      </body>
    </html>
  );
}

function App(props: { url: URL }) {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">[ OutsideAtl / RSC Lab ]</p>
        <h1>
          Outside<span>Atl</span>
        </h1>
        <p className="lede">
          A production-safe workspace for testing future server-rendered event, admin, and campaign
          experiences without disturbing the main site.
        </p>
        <div className="actions">
          <a href="../" className="button primary">
            Main Site
          </a>
          <a href="./_.rsc" className="button">
            RSC Payload
          </a>
        </div>
      </section>

      <section className="panel">
        <h2>Runtime</h2>
        <dl>
          <div>
            <dt>Request URL</dt>
            <dd>{props.url?.href}</dd>
          </div>
          <div>
            <dt>Package</dt>
            <dd>@outsideatl/rsc-experience</dd>
          </div>
        </dl>
        <LaunchStatus />
      </section>
    </main>
  );
}
