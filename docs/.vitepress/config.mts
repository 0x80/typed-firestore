import { defineConfig } from "vitepress";

const hostname = "https://typed-firestore.codecompose.dev";
const siteTitle = "Typed Firestore";
const siteDescription =
  "Elegant, typed abstractions for Firestore across server, React and React Native";
const ogImage = `${hostname}/og-image.png`;

export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  base: "/",
  cleanUrls: true,
  lastUpdated: true,

  sitemap: { hostname },

  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: siteTitle }],
    ["meta", { property: "og:image", content: ogImage }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:image", content: ogImage }],
  ],

  /**
   * Emit a canonical URL and page-specific social tags for every page. Without
   * these, search engines have to guess which URL is authoritative and every
   * shared link renders with the same generic preview.
   */
  transformPageData(pageData) {
    const path = pageData.relativePath
      .replace(/(^|\/)index\.md$/, "$1")
      .replace(/\.md$/, "");
    const url = `${hostname}/${path}`;
    const title = path === "" ? siteTitle : `${pageData.title} | ${siteTitle}`;
    const description = pageData.description || siteDescription;

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
    );
  },

  themeConfig: {
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Typing Your Database", link: "/typing-your-database" },
          { text: "Sharing Types", link: "/sharing-types" },
        ],
      },
      {
        text: "Server",
        items: [
          { text: "Documents", link: "/server/documents" },
          { text: "Collections", link: "/server/collections" },
          { text: "Processing", link: "/server/processing" },
          { text: "Cloud Functions", link: "/server/cloud-functions" },
        ],
      },
      {
        text: "REST",
        items: [
          { text: "Getting Started", link: "/rest/getting-started" },
          { text: "Values and Conversion", link: "/rest/values" },
        ],
      },
      {
        text: "React",
        items: [
          { text: "Hooks", link: "/react/hooks" },
          { text: "Functions", link: "/react/functions" },
          { text: "Write Functions", link: "/react/write-functions" },
          { text: "Error Handling", link: "/react/error-handling" },
        ],
      },
      {
        text: "React Native",
        items: [
          { text: "Hooks", link: "/react-native/hooks" },
          { text: "Functions", link: "/react-native/functions" },
          { text: "Write Functions", link: "/react-native/write-functions" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Document Types", link: "/reference/document-types" },
          {
            text: "Create and Preconditions",
            link: "/reference/preconditions",
          },
          { text: "Migration Guide", link: "/reference/migration" },
        ],
      },
      {
        text: "Contributing",
        items: [{ text: "Releasing", link: "/contributing/releasing" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/0x80/typed-firestore" },
    ],

    footer: {
      message: "Released under the Apache-2.0 License.",
      copyright: "Copyright &copy; Thijs Koerselman",
    },
  },
});
