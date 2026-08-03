---
layout: home

hero:
  name: Typed Firestore
  tagline: Elegant, typed abstractions for Firestore across server, edge, React and React Native
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/0x80/typed-firestore

features:
  - title: Type Your Database Once
    details: Define typed collection refs once, and let all functions infer the rest. No need to import and apply types everywhere.
  - title: Mutable Documents
    details: Get back documents with typed update and delete methods attached. The original ref is always accessible too.
  - title: Non-Intrusive API
    details: Thin typed wrappers around the official Firebase SDKs. No lock-in, easy to adopt, and familiar to use.
  - title: Consistent Across Platforms
    details: The same concepts and API patterns on server (firebase-admin), web (Firebase JS SDK), mobile (React Native Firebase), and any runtime with fetch (REST).
  - title: Runs On The Edge
    details: The REST package has no dependencies and needs only fetch and Web Crypto, so it works on Cloudflare Workers, Deno and Bun, where firebase-admin cannot run at all.
  - title: Collection Processing
    details: Iterate over entire collections with constant memory usage via automatic pagination. Process documents one-by-one or in chunks.
  - title: Cloud Function Helpers
    details: Get typed data from 2nd gen cloud function events with simple utility functions.
---
