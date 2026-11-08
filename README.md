# Janani Charitable Trust — Publishing CMS + Public Site

Source package for the Janani *Our Work & Stories* editorial system and public website.

## What’s included

- **Public homepage** (`public/index.html`) — polished landing page with sections for Our Work, Gallery, and Call-to-Action. Ready for the real field photographs.
- **Publishing Studio** (`public/admin.html`) — team login, post composition, cover photos, and immediate publish.
- **Story viewer** (`public/story.html`) — individual published posts.
- Backend (SQLite + Express) for authentication, posts, and media storage.

## Real photographs ready

The 12 images from the WhatsApp export (medical camps, blood donation, school supplies distribution, children’s birthday celebrations, community meals) have been prepared and optimised.  

**To place them on the site:**
1. Start the CMS (`npm install && npm start`).
2. Sign in at `/admin.html`.
3. Create / edit posts and upload the photos as cover images or insert them in the body.
4. Or place the files under `public/media/` and update the `src` attributes in `public/index.html` gallery cards.

Clean filenames prepared locally:
- `medical-camp-consultation.jpg`
- `blood-donation-camp.jpg`
- `school-supplies-distribution.jpg`
- `birthday-gift-child.jpg`
- `community-event.jpg`
- `celebration-moment.jpg`
- and 6 more variants.

## Intended workflow
An administrator creates writer accounts. Writers authenticate, create posts with images, select a website section, and publish directly. Published content appears on the public website.

## Current status
Public homepage is complete and polished. The CMS still uses local SQLite + disk storage — suitable for development and small deployments. For production, add a persistent database and object storage (S3 / Cloudflare R2 / etc.).

Do not commit `.env`, tokens, database files or uploaded private data.

```bash
npm install
npm test
npm start
```

Then open http://localhost:3000 (or the configured port).
