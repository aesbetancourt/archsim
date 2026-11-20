import type { Route } from "next";

// Page addresses for links. With typedRoutes on in next.config.ts, the type check finds an address
// that is not a page of the app. A literal address in a Link needs no helper.

// Check an address that the code writes, for example in a list of links. A literal or a template
// such as `/learn/${slug}` must match a page.
export function route<T extends string>(href: Route<T>): Route<T> {
  return href;
}

// An address from content or saved data, for example a link in a Markdown file. TypeScript cannot
// check it, so the caller must make sure that it is a page of the app.
export function pageAddress(address: string): Route {
  return address as Route;
}
