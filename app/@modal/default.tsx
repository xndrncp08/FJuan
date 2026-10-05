/**
 * app/@modal — floating windows for detail pages opened from the site.
 *
 * Intercepting routes ((.)races, (.)tracks, (.)teams/…/car) render their
 * page inside a FloatingWindow on soft navigation; a direct load or
 * refresh renders the normal full page. Nothing is shown otherwise.
 */
export default function ModalDefault() {
  return null;
}
