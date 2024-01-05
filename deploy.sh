#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git checkout -b main || true
git add -A
git commit -m 'deploy'

# git push -f git@github.com:tgerk/tgerk.github.io.git main
git push -f git@github.com:tgerk/minesweeper.git main:gh-pages

# would like some connection from version-tagged main-branch commit
#  to orphan commits on gh-pages branch
