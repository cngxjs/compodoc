#!/usr/bin/env bash
# Copy-paste reference: build versioned docs for one or more git refs.
# Adapt to your project's tag pattern. Not part of the compodocx build —
# this is purely a starting point.
#
# Usage:
#     scripts/build-versioned-docs.sh                  # builds the defaults
#     scripts/build-versioned-docs.sh v0.1.0 v0.2.0    # builds the supplied tags
#
# Output layout:
#     public/
#         v0.1.0/
#         v0.2.0/
#         …
#
# Deploy public/ to any static host. See docs/versioned-docs.md for the
# full pattern and deployment recipes.

set -euo pipefail

VERSIONS=("${@:-v0.1.0 v0.2.0}")
TSCONFIG="${TSCONFIG:-tsconfig.json}"
OUT_ROOT="${OUT_ROOT:-public}"
RESTORE_REF="${RESTORE_REF:-main}"

mkdir -p "$OUT_ROOT"

for v in "${VERSIONS[@]}"; do
    echo "Building $v…"
    git checkout "$v"
    npx compodocx -p "$TSCONFIG" -d "$OUT_ROOT/$v" -n "$v" --silent
done

git checkout "$RESTORE_REF"
echo "Done. Deploy $OUT_ROOT/ to a static host."
