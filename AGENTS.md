# Repository agent instructions

## Releases after updates

- Every completed update to this repository must include a new version and a GitHub Release. Choose the next SemVer version based on the changes; use the next patch version for fixes, security updates, and other non-breaking maintenance.
- Add `changelog/v<version>.md` describing the update. The release workflow detects this new file on a push to `main`, synchronizes version artifacts and creates the tag and GitHub Release.
- Check the release workflow to completion and verify the published tag, target commit, and release page. Investigate and repair failures rather than treating a skipped or failed workflow as a release.
- Release automation's own artifact synchronization commit is part of the same release and must not start another version. Preserve existing tags.
