# Releasing

Every package in this monorepo is versioned and published independently. There
are no dependencies between them, so there is no ordering to respect and no
version to keep in sync — a release is simply one or more packages going out at
whatever version each one has earned.

Releases run from the `Publish` workflow on GitHub, manually triggered from the
Actions tab against `main`.

## Running a release

The workflow takes one bump per package, each defaulting to `skip`:

| Input          | Values                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| `server`       | `skip`, `patch`, `minor`, `major`, `prepatch`, `preminor`, `premajor`, `prerelease` |
| `react`        | same                                                                                |
| `react_native` | same                                                                                |
| `rest`         | same                                                                                |
| `preid`        | `alpha`, `beta`, `rc` — applied to every `pre*` bump in the run                     |
| `dry_run`      | resolve versions and stop, without publishing anything                              |

Set a bump for each package you want to release and leave the rest on `skip`.
One run can release any combination, so shipping a coordinated change across
three packages is a single trigger rather than three sequential ones.

Selecting nothing fails the run immediately rather than producing an empty
release.

## Versions come from npm, not package.json

The bump is applied to **the version currently published on npm**, not the
version checked into `package.json`. The published version is the only thing
that can't drift, which makes a whole category of release problems impossible:

- A hand-edited version in a PR can't cause the workflow to skip a release or
  compute one that already exists on the registry.
- A `package.json` that has fallen behind the registry — which happens when a
  package was once published from elsewhere — can't produce a version conflict.

`package.json` is updated to the resolved version as part of the release
commit, so the repository is corrected on every release rather than being the
thing the release depends on.

A package with no published version yet is the one exception: there is no base
to bump from, so the version already in `package.json` is published as-is and
the requested bump is ignored for that run.

## Prereleases

Any `pre*` bump produces a prerelease version, which is published under the
`next` dist tag instead of `latest` and marked as a prerelease on GitHub. The
`preid` input applies to every `pre*` bump in the run, so a run mixing stable
and prerelease bumps is fine, but two different prerelease identifiers in one
run is not.

## What a run produces

For each released package:

1. A single commit carrying every version bump in the run
2. An annotated tag per package, `@typed-firestore/<name>@<version>`
3. An npm publish with [provenance](https://docs.npmjs.com/generating-provenance-statements)
4. A GitHub release with generated notes

Packages are published **before** the commit and tags are pushed. This ordering
is deliberate: `npm publish` cannot be repeated for the same version, while
`git push` can be retried freely. If the push fails after a successful publish,
retrying costs nothing.

### When a run fails partway

If the second of three packages fails to publish, the first stays published,
nothing is pushed, and the runner's local commit and tags are discarded.

Recovery is to re-run the workflow with only the packages that did not publish.
Because versions resolve from the registry, the already-published package would
resolve to a version that exists, and the failed ones resolve to exactly the
versions they were going to get. There is no state to reconcile by hand.

## Trusted publishing

Publishing authenticates through
[OIDC trusted publishing](https://docs.npmjs.com/trusted-publishers) rather than
an `NPM_TOKEN` secret. The workflow requests an identity token from GitHub and
npm verifies it against a trusted publisher configured on the package itself.

This has one consequence worth knowing before adding a package: **trusted
publishers are configured per package, on npmjs.com, and a package must already
exist before it can be configured.** A brand-new package therefore cannot be
published by this workflow — npm cannot match the token to any publisher,
treats the request as anonymous, and rejects it with a `404` that says nothing
about the real cause.

### Adding a new package

1. Publish the first version manually, once, from a local `npm login`:

   ```sh
   pnpm build
   cd packages/<name> && npm publish
   ```

   Omit `--provenance`; it requires the OIDC token that only CI has. This one
   version ships without an attestation, and every later one has one.

2. Configure the trusted publisher on npmjs.com under the package's Settings:

   | Field                | Value             |
   | -------------------- | ----------------- |
   | Organization or user | `0x80`            |
   | Repository           | `typed-firestore` |
   | Workflow filename    | `publish.yml`     |
   | Environment          | _(empty)_         |

   Configurations created after 2026-05-20 require explicitly selecting at
   least one allowed action — select `npm publish`. npm does not validate any
   of this on save; mistakes surface only as another `404` at publish time.

3. Tag and release the manual publish so the history matches what CI would have
   produced:

   ```sh
   git tag -a "@typed-firestore/<name>@<version>" -m "@typed-firestore/<name>@<version>"
   git push origin --follow-tags
   gh release create "@typed-firestore/<name>@<version>" --generate-notes
   ```

4. Add the package to the workflow inputs and to the resolve loop's package
   list in `.github/workflows/publish.yml`.

From then on the package releases through the workflow like the others.
