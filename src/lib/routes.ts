import type { Route } from "next";

// Page addresses for links. With typedRoutes on in next.config.ts, the type check finds an address
// that is not a page of the app. A literal address in a Link needs no helper.

/**
 * Check an address that the code writes, for example in a list of links. A literal or a template
 * such as `/learn/${slug}` must match a page. The check is done at type-check time only.
 * @param href The address of a page of the app.
 * @returns The same address.
 * @example
 * const links = [{ href: route("/learn"), title: "Learn" }];
 */
export function route<T extends string>(href: Route<T>): Route<T> {
  return href;
}

/**
 * Use an address from content or saved data as a page address, for example a link in a Markdown
 * file. TypeScript cannot check it, so the caller must make sure that it is a page of the app.
 * @param address The address of a page, for example "/learn/caching".
 * @returns The same address, with the type of a page address.
 * @example
 * <Link href={pageAddress(item.href)}>{item.title}</Link>
 */
export function pageAddress(address: string): Route {
  return address as Route;
}
