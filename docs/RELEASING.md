# Releasing a new version

- build the project (`npm run build`)

- Make sure all tests are passing (`npm run test`)

- Update the version in `package.json` and `package-lock.json` (`npm version <major|minor|patch>`)

- run `npm run changelog` to generate an intermediate changelog file CH.md

- copy the content of CH.md from first line to previous release tag and paste it in CHANGELOG.md under the new version tag

- replace UNREALEASED and HEAD by the new version tag in CHANGELOG.md

- add an HTML anchor : <a name="1.1.26"></a> (replace 1.1.26 with the new version) just before the new version section in CHANGELOG.md

- remove commit from PRs of renovate

- commit all changes (`git commit -am "chore(release): <new version>"`)

- push to github (`git push origin main && git push --tags`)

- publish to npm (`npm publish --access public`)

- create a new release on github with the new version tag and copy/paste the content of CHANGELOG.md for this version in the description

- delete CH.md
