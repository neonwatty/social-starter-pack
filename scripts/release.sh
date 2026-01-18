#!/bin/bash

# Release a package by creating and pushing a prefixed tag
# Usage: ./scripts/release.sh <package-name> <version>
# Example: ./scripts/release.sh youtube-cli 1.2.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Available packages
NPM_PACKAGES=(
  "autocomplete-cli"
  "demo-recorder"
  "google-forms-cli"
  "linkedin-cli"
  "mcp-server"
  "scheduler-cli"
  "search-console-cli"
  "spawn-claude"
  "twitter-cli"
  "youtube-cli"
)

PIP_PACKAGES=(
  "reddit-market-research"
)

ALL_PACKAGES=("${NPM_PACKAGES[@]}" "${PIP_PACKAGES[@]}")

usage() {
  echo -e "${BLUE}Usage:${NC} $0 <package-name> [version]"
  echo ""
  echo -e "${BLUE}Available packages:${NC}"
  echo -e "  ${GREEN}npm:${NC} ${NPM_PACKAGES[*]}"
  echo -e "  ${GREEN}pip:${NC} ${PIP_PACKAGES[*]}"
  echo ""
  echo -e "${BLUE}Examples:${NC}"
  echo "  $0 youtube-cli 1.2.0    # Release youtube-cli@1.2.0"
  echo "  $0 youtube-cli          # Auto-detect version from package.json"
  echo ""
  exit 1
}

# Check if package is valid
is_valid_package() {
  local pkg=$1
  for p in "${ALL_PACKAGES[@]}"; do
    if [ "$p" = "$pkg" ]; then
      return 0
    fi
  done
  return 1
}

# Get package type (npm or pip)
get_package_type() {
  local pkg=$1
  for p in "${PIP_PACKAGES[@]}"; do
    if [ "$p" = "$pkg" ]; then
      echo "pip"
      return
    fi
  done
  echo "npm"
}

# Get current version from package.json or pyproject.toml
get_current_version() {
  local pkg=$1
  local pkg_type=$2
  local pkg_dir="$ROOT_DIR/packages/$pkg"

  if [ "$pkg_type" = "npm" ]; then
    if [ -f "$pkg_dir/package.json" ]; then
      grep '"version"' "$pkg_dir/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/'
    fi
  else
    if [ -f "$pkg_dir/pyproject.toml" ]; then
      grep '^version' "$pkg_dir/pyproject.toml" | head -1 | sed 's/.*= *"\([^"]*\)".*/\1/'
    fi
  fi
}

# Validate semver format
is_valid_semver() {
  local version=$1
  if [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    return 0
  fi
  return 1
}

# Main script
if [ $# -lt 1 ]; then
  usage
fi

PACKAGE=$1
VERSION=$2

# Validate package name
if ! is_valid_package "$PACKAGE"; then
  echo -e "${RED}Error:${NC} Unknown package '$PACKAGE'"
  echo ""
  echo -e "${BLUE}Available packages:${NC}"
  printf '  %s\n' "${ALL_PACKAGES[@]}"
  exit 1
fi

# Get package type
PKG_TYPE=$(get_package_type "$PACKAGE")

# Auto-detect version if not provided
if [ -z "$VERSION" ]; then
  VERSION=$(get_current_version "$PACKAGE" "$PKG_TYPE")
  if [ -z "$VERSION" ]; then
    echo -e "${RED}Error:${NC} Could not detect version. Please provide a version."
    exit 1
  fi
  echo -e "${YELLOW}Auto-detected version:${NC} $VERSION"
fi

# Validate version format
if ! is_valid_semver "$VERSION"; then
  echo -e "${RED}Error:${NC} Invalid version format '$VERSION'. Expected semver (e.g., 1.2.0)"
  exit 1
fi

TAG="${PACKAGE}@${VERSION}"

# Check if tag already exists
if git tag -l | grep -q "^${TAG}$"; then
  echo -e "${RED}Error:${NC} Tag '$TAG' already exists"
  exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}Warning:${NC} You have uncommitted changes"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Confirm release
echo ""
echo -e "${BLUE}Release Summary:${NC}"
echo -e "  Package:  ${GREEN}$PACKAGE${NC}"
echo -e "  Version:  ${GREEN}$VERSION${NC}"
echo -e "  Tag:      ${GREEN}$TAG${NC}"
echo -e "  Type:     ${GREEN}$PKG_TYPE${NC}"
echo ""
read -p "Create and push tag? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Create and push tag
echo -e "${BLUE}Creating tag...${NC}"
git tag -a "$TAG" -m "Release $PACKAGE v$VERSION"

echo -e "${BLUE}Pushing tag...${NC}"
git push origin "$TAG"

echo ""
echo -e "${GREEN}✓ Released $TAG${NC}"
echo ""
echo -e "View the release workflow at:"
echo -e "  https://github.com/neonwatty/social-starter-pack/actions"
