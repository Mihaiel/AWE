// ---------------------------------------------------------------------
// DOCUMENT TITLE SYNC - Exercise 6, Demo 2's real, justified useEffect
// ---------------------------------------------------------------------
// Demo 2 explicitly asks for a genuine useEffect use that isn't data
// fetching (that's Demo 5's job) - this is the exercise's own suggested
// example: syncing document.title to the current view. `document.title`
// is a browser API outside React's own tree entirely, nothing in props/
// state renders it - exactly the kind of "reach outside the component"
// work Demo 1's rule puts in an effect, not in render. Previously
// react.html just had one static <title>, never updated as routes
// changed.
//
// Renders nothing (returns null) - its only job is the effect. Needs to
// live inside <HashRouter> to call useLocation(). The dependency array
// is [location.pathname], not empty and not omitted: this must re-run
// every time the route changes (so the tab title tracks navigation),
// but there's no reason to re-run it on a render where the path didn't
// change (e.g. EvidencePage's own state updates triggering re-renders
// shouldn't also rewrite document.title every time).
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_TITLE = "Project ReMotion – React shell";

function titleForPath(pathname: string): string {
  if (pathname === "/") return `Dashboard | ${BASE_TITLE}`;
  if (pathname.startsWith("/evidence")) return `Evidence Catalogue | ${BASE_TITLE}`;
  if (pathname.startsWith("/team/locations")) return `Locations | ${BASE_TITLE}`;
  if (pathname.startsWith("/team")) return `People & Locations | ${BASE_TITLE}`;
  if (pathname.startsWith("/timeline")) return `Timeline | ${BASE_TITLE}`;
  if (pathname.startsWith("/workspace")) return `Workspace | ${BASE_TITLE}`;
  return BASE_TITLE;
}

export default function DocumentTitleSync() {
  const location = useLocation();

  useEffect(() => {
    document.title = titleForPath(location.pathname);
  }, [location.pathname]);

  return null;
}
