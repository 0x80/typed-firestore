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
run is not. A `pre*` bump with an empty `preid` is rejected rather than
silently producing npm's numeric form (`1.2.4-0`).

Because prereleases live on `next` while stable releases live on `latest`, a
`pre*` bump resolves its base from whichever of the two tags is **higher**, and
a stable bump always resolves from `latest`. That keeps a second prerelease
continuing the line the first one started, rather than recomputing a version
that is already published — and it stays correct when `next` is left behind by
a prerelease that has since been finalized.

## What a run produces

For each released package:

1. A single commit carrying every version bump in the run
2. An annotated tag per package, `@typed-firestore/<name>@<version>`
3. An npm publish with [provenance](https://docs.npmjs.com/generating-provenance-statements)
4. A GitHub release with generated notes

The order is deliberate. Every check that can fail cheaply runs first: the run
aborts immediately if its checkout is no longer `main`'s tip — which happens
when it queued behind another release — then versions resolve, and it aborts
again if any of its tags already exist locally or on the origin. Then packages publish, the commit is pushed, and only once the branch
has settled are the tags created and pushed — tagging last means a rebase
during the push can't strand a tag on a commit that is no longer on the branch.
GitHub releases are created last and skip any tag that already has one, so a
re-run fills in what is missing instead of failing.

`npm publish` is the one step that cannot be repeated for the same version,
which is why it comes after everything cheap and before everything retryable.

### When a run fails partway

If the second of three packages fails to publish, the run stops there but still
records what did happen: the packages published before the failure get their
commit, tags and GitHub releases, and the job then fails with a summary naming
the package that could not publish. If the very first package fails, nothing is
published and nothing is pushed.

Recovery is to re-run the workflow with only the packages that did not publish.
Because versions resolve from the registry, the already-published packages
resolve to versions that exist, and the failed ones resolve to exactly the
versions they were going to get.

The pushed commit carries the version bump for the package that failed too,
since the commit is made before publishing. That is harmless — the next run
resolves that package from the registry, which never saw the failed version,
and rewrites its `package.json` accordingly.

The push is the one place where a failure costs manual work. `main` advancing
mid-run is the realistic cause, and the workflow handles it by rebasing and
retrying up to three times. If it still can't push — a genuine conflict in a
`package.json` — the packages are already on npm, and the version commit and
its tags have to be recreated by hand. Nothing is lost; it just isn't automatic.

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

4. Add an input for the package to `.github/workflows/publish.yml`, named after
   its directory with dashes replaced by underscores (`react-native` →
   `react_native`), and add it to the input table near the top of this page.
   The workflow discovers packages from the workspace itself, so there is no
   second list to update — a package with no matching input is reported as a
   warning on every run rather than silently sitting unreleasable.

From then on the package releases through the workflow like the others.
