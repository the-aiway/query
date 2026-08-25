#!/usr/bin/env bash
#
# Release helpers for @the-aiway/query.
#
# `main` is protected by a ruleset with no bypass actors, so a version commit
# can never be pushed straight to it. That splits a stable release in two:
#
#   release.sh prepare <patch|minor|major>
#     Run on main. Bumps package.json on a branch and opens the release PR.
#     Deliberately creates no tag: main squash-merges, so a tag made here would
#     point at a commit that never lands on main.
#
#   release.sh publish
#     Run on main once that PR is merged. Tags the merge commit and publishes.
#
# Release candidates skip all of it. The ruleset only targets refs/heads/main,
# so an rc can be committed, tagged and published straight from a feature
# branch — which is the point of an rc: try it against a consumer before it is
# on main at all.
#
#   release.sh rc [prerelease|prepatch|preminor|premajor]

set -euo pipefail

die() { printf 'error: %s\n' "$1" >&2; exit 1; }
note() { printf '\n%s\n' "$1"; }

pkg_name() { node -p "require('./package.json').name"; }
pkg_version() { node -p "require('./package.json').version"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but not installed"
}

require_clean_tree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "working tree has uncommitted changes; commit or stash them first"
  fi
}

require_branch() {
  local have
  have=$(git rev-parse --abbrev-ref HEAD)
  [ "$have" = "$1" ] || die "expected to be on '$1', but on '$have'"
}

# The version commit has to sit on top of what is actually on the remote,
# otherwise the PR carries unrelated drift along with the bump.
require_synced_with_main() {
  git fetch --quiet origin main
  [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] ||
    die "local main is not in sync with origin/main; pull first"
}

cmd_prepare() {
  local kind=${1:-}
  case $kind in
  patch | minor | major) ;;
  *) die "usage: release.sh prepare <patch|minor|major>" ;;
  esac

  require_cmd gh
  require_branch main
  require_clean_tree
  require_synced_with_main

  local from to branch committed=0
  from=$(pkg_version)

  # The branch name embeds the resulting version, so the bump has to happen
  # before the branch exists. Put package.json back if we bail out before the
  # commit lands, rather than leaving main dirty. This has to be an EXIT trap,
  # not ERR: die() exits outright, which never fires ERR.
  trap '[ "$committed" = 1 ] || git checkout -- package.json 2>/dev/null || true' EXIT

  npm version "$kind" --no-git-tag-version >/dev/null
  to=$(pkg_version)
  branch="chore/release-$to"

  if git rev-parse -q --verify "refs/heads/$branch" >/dev/null; then
    die "branch $branch already exists; delete it or finish that release first"
  fi

  git checkout -q -b "$branch"
  git add package.json
  git commit -q -m "chore: bump version to $to"
  committed=1
  trap - EXIT

  git push -q -u origin "$branch"
  gh pr create \
    --title "chore: bump version to $to" \
    --base main --head "$branch" \
    --body "Release commit: \`$from\` → \`$to\`. Version only, no code changes.

Merge this, then run \`bun run release:publish\` on \`main\` to tag and publish."

  note "prepared $from -> $to on $branch
merge the PR, then: git checkout main && git pull && bun run release:publish"
}

cmd_publish() {
  require_branch main
  require_clean_tree
  require_synced_with_main

  local name version tag
  name=$(pkg_name)
  version=$(pkg_version)
  tag="v$version"

  # Catches the common mistake of running publish twice, or of running it
  # before the release PR has actually been merged into main.
  if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    die "tag $tag already exists locally"
  fi
  if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
    die "tag $tag already exists on origin"
  fi
  if npm view "$name@$version" version >/dev/null 2>&1; then
    die "$name@$version is already published"
  fi

  git tag -a "$tag" -m "$tag"
  git push -q origin "$tag"
  npm publish

  note "published $name@$version and pushed $tag"
}

cmd_rc() {
  local kind=${1:-prerelease}
  case $kind in
  prerelease | prepatch | preminor | premajor) ;;
  *) die "usage: release.sh rc [prerelease|prepatch|preminor|premajor]" ;;
  esac

  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  [ "$branch" != "main" ] ||
    die "release candidates are published from a feature branch, not main"
  require_clean_tree

  npm version "$kind" --preid rc -m 'chore: bump candidate to %s' >/dev/null
  local version
  version=$(pkg_version)

  git push -q -u origin "$branch"
  git push -q origin "v$version"
  npm publish --tag beta

  note "published $(pkg_name)@$version under the beta tag from $branch"
}

case ${1:-} in
prepare) shift && cmd_prepare "$@" ;;
publish) shift && cmd_publish "$@" ;;
rc) shift && cmd_rc "$@" ;;
*) die "usage: release.sh <prepare <patch|minor|major> | publish | rc [prerelease|prepatch|preminor|premajor]>" ;;
esac
