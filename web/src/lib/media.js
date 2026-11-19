/**
 * What to show inside the pupil, and whether to show it now.
 *
 * Plain module state (read every frame by EyeScene), like `gaze`:
 *  - shown   : true while F / the dashboard button / the bridge holds it
 *  - source  : { kind: "demo" } | { kind: "image" | "video", url }
 *  - version : bumps when the source changes so the scene reloads it
 */
export const media = { shown: false, source: { kind: "demo" }, version: 0 };

export function setMediaShown(on) {
  media.shown = !!on;
}

export function setMediaSource(source) {
  media.source = source;
  media.version++;
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

/** "image" or "video", from a MIME type or a URL's extension. */
export function mediaKind(typeOrUrl = "") {
  if (typeOrUrl.startsWith("video/")) return "video";
  if (typeOrUrl.startsWith("image/")) return "image";
  return VIDEO_EXT.test(typeOrUrl) ? "video" : "image";
}
