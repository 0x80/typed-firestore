import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Typed Firestore",
  description:
    "Elegant, typed abstractions for Firestore across server, React and React Native",
  base: "/",
  cleanUrls: true,

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
          { text: "Migration Guide", link: "/reference/migration" },
        ],
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
