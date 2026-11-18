import type { WikiPage } from "./wiki-pages";

export type TreeNode = { page: WikiPage; children: WikiPage[] };

// Put the pages of a section in a tree: a page with a parent goes under that parent.
// With search words, keep the pages whose title has the words. A parent that matches keeps all
// of its children. A child that matches keeps its parent, so the reader sees where it belongs.
export function sectionTree(pages: WikiPage[], words = ""): TreeNode[] {
  const query = words.trim().toLowerCase();
  const matches = (page: WikiPage) => !query || page.title.toLowerCase().includes(query);
  const nodes: TreeNode[] = [];
  for (const page of pages) {
    if (page.parent) continue;
    const children = pages.filter((child) => child.parent === page.slug);
    if (matches(page)) nodes.push({ page, children });
    else {
      const found = children.filter(matches);
      if (found.length > 0) nodes.push({ page, children: found });
    }
  }
  return nodes;
}
