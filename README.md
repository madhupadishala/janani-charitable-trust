# Janani Charitable Trust — Publishing CMS

Source package for the Janani *Our Work & Stories* editorial system.

## Intended workflow
An administrator creates writer accounts. Writers authenticate, create posts with images, select a website section, and publish directly without a reviewer step. Published content is intended to appear on the public website.

## Current status
This is an initial source repository, **not a production-ready deployment**. The full implementation is in the previously supplied `Janani_Publishing_CMS_Source.zip` source archive, and still requires a persistent hosted database, media storage, and integration testing before launch.

The current implementation uses local SQLite and disk storage. Do not deploy it to stateless Vercel functions as-is. Do not commit `.env`, tokens, database files or uploaded private data.

Run `npm install` to generate `package-lock.json`, then `npm test` after bringing in the full application source. The lockfile is not included yet because package registry access failed in the build environment.
