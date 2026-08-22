// The VECHTER mark — the real artwork, not a redraw.
//
// The path below is lifted verbatim from the supplied vechter-app-icon.svg (also
// vendored at public/vechter-app-icon.svg and served as the browser tab icon via
// app/icon.svg). Do not "tidy" it: fill-rule evenodd is what cuts the fuller line out
// of the blade, and the single-path construction is what keeps the sword, the roof
// wedges and the posts reading as one object.
//
// Geometry, for anyone adjusting the layout around it: the artwork occupies
// 0 0 340 360 in its own coordinate space — TALLER than it is wide. The app-icon file
// centres it on a 512 tile; here it is used untiled so it sits inline like a glyph.
//
// Monochrome and inherits currentColor: white on the dark green header, --logo-ink on
// paper. The `tile` prop reproduces the rounded app-icon container when that is what
// you actually want.

/** Native aspect ratio of the artwork (340 wide x 360 tall). */
const ASPECT = 340 / 360;

const MARK_PATH =
  "M166 0H174L181 8V85H159V8L166 0ZM127 85H213L217 103L212 99H128L123 103L127 85ZM150 " +
  "115L0 238H22V318H45V238L150 152V115ZM190 115L340 238H318V318H295V238L190 152V115ZM170 " +
  "99L190 115V327L170 360L150 327V115L170 99ZM166 99H174V325L170 335L166 325V99Z";

export default function VechterMark({
  size = 34,
  fg = "currentColor",
  tile = false,
  tileFill = "#fcfcfc",
  title = "VECHTER Home Solutions",
}) {
  if (tile) {
    // The app icon exactly as delivered: mark centred on a rounded square.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={title}
        fill="none"
      >
        <rect width="512" height="512" rx="115" fill={tileFill} />
        <g transform="translate(114.5 106) scale(0.8333)">
          <path fill={fg} fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      // Height drives the size; width follows the artwork's real proportions rather
      // than being forced square, which would letterbox it.
      width={Math.round(size * ASPECT)}
      height={size}
      viewBox="0 0 340 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      fill="none"
    >
      <path fill={fg} fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

/**
 * The full stacked lockup — mark over VECHTER over HOME SOLUTIONS, as the icon is
 * laid out. Use where there is vertical room; the header uses the bare mark beside
 * horizontal text instead, because a stacked lockup does not fit a 62px bar.
 */
export function VechterLogo({ size = 62, className = "" }) {
  return (
    <div className={`vechter-logo ${className}`}>
      <VechterMark size={size} />
      <span className="vechter-logo-name">VECHTER</span>
      <span className="vechter-logo-sub">Home Solutions</span>
    </div>
  );
}
