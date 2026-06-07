/** Static blood + lake background — same layered look, zero JS or canvas. */
const DRIPS: { left: string; height: string; width: string; opacity: number }[] = [
  { left: "6%", height: "38%", width: "3px", opacity: 0.55 },
  { left: "11%", height: "52%", width: "4px", opacity: 0.7 },
  { left: "18%", height: "28%", width: "2.5px", opacity: 0.45 },
  { left: "24%", height: "44%", width: "3.5px", opacity: 0.6 },
  { left: "31%", height: "22%", width: "2px", opacity: 0.4 },
  { left: "38%", height: "48%", width: "4px", opacity: 0.65 },
  { left: "52%", height: "35%", width: "3px", opacity: 0.5 },
  { left: "58%", height: "58%", width: "4.5px", opacity: 0.72 },
  { left: "64%", height: "26%", width: "2.5px", opacity: 0.42 },
  { left: "71%", height: "41%", width: "3px", opacity: 0.58 },
  { left: "78%", height: "30%", width: "2.5px", opacity: 0.48 },
  { left: "84%", height: "46%", width: "3.5px", opacity: 0.62 },
  { left: "91%", height: "33%", width: "3px", opacity: 0.52 },
  { left: "96%", height: "40%", width: "2.5px", opacity: 0.5 },
];

export function StaticSiteBackground() {
  return (
    <div className="site-bg site-bg--static" aria-hidden>
      <div className="site-bg__base" />
      <div className="site-bg__radial-red" />
      <div className="site-bg__aurora" />
      <div className="site-bg__aurora site-bg__aurora--2" />
      <div className="site-bg__water-mist" />
      <div className="site-bg__mesh-wrap">
        <div className="site-bg__mesh" />
      </div>
      <div className="site-bg__blood-specks" />
      <div className="site-bg__blood-drips">
        {DRIPS.map((d, i) => (
          <span
            key={i}
            className="site-bg__drip"
            style={{
              left: d.left,
              height: d.height,
              width: d.width,
              opacity: d.opacity,
            }}
          />
        ))}
      </div>
      <div className="site-bg__blood-pool" />
      <div className="site-bg__water-surface" />
      <div className="site-bg__water-fog" />
      <div className="site-bg__water-wrap">
        <div className="site-bg__water-mesh" />
      </div>
      <div className="site-bg__blob site-bg__blob--1">
        <div className="site-bg__blob-shape site-bg__blob-shape--1" />
      </div>
      <div className="site-bg__blob site-bg__blob--2">
        <div className="site-bg__blob-shape site-bg__blob-shape--2" />
      </div>
      <div className="site-bg__blob site-bg__blob--3">
        <div className="site-bg__blob-shape site-bg__blob-shape--3" />
      </div>
      <div className="site-bg__blob site-bg__blob--4">
        <div className="site-bg__blob-shape site-bg__blob-shape--4" />
      </div>
      <div className="site-bg__blob site-bg__blob--5">
        <div className="site-bg__blob-shape site-bg__blob-shape--5" />
      </div>
      <div className="site-bg__blob site-bg__blob--6">
        <div className="site-bg__blob-shape site-bg__blob-shape--6" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--1">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--1" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--2">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--2" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--3">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--3" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--4">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--4" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--5">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--5" />
      </div>
      <div className="site-bg__wave site-bg__wave--1" />
      <div className="site-bg__wave site-bg__wave--2" />
      <div className="site-bg__wave site-bg__wave--3" />
      <div className="site-bg__wave site-bg__wave--4" />
      <div className="site-bg__wave site-bg__wave--5" />
      <div className="site-bg__water-ribbon" />
      <div className="site-bg__shimmer" />
      <div className="site-bg__scrim" />
      <div className="site-bg__vignette" />
      <div className="site-bg__grain" />
    </div>
  );
}
