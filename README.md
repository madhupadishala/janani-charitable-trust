# Janani Charitable Trust — Publishing CMS + Public Site

Source package for Janani Charitable Trust's public website and team Publishing Studio.

## Included

- **Public homepage** (`public/index.html`) — Our Work, live photo gallery, and contact sections.
- **Publishing Studio** (`public/admin.html`) — authenticated story publishing and homepage photo management.
- **Story viewer** (`public/story.html`) — individual published posts.
- **Backend** — Express, SQLite, authenticated uploads, and audit logging.

## Homepage photographs

The homepage gallery is populated from photographs uploaded in Publishing Studio. The newest 12 uploads appear on the homepage; the newest photograph is also used as the hero background. Each upload includes a short description used as its accessible image text and gallery caption.

To add genuine Janani photographs:

1. Start the application with `npm install && npm start`.
2. Sign in at `/admin.html`.
3. Open **Photo gallery**, enter a factual description, and upload a JPEG, PNG, or WebP image (maximum 3 MB).
4. The uploaded photograph is stored in the configured media directory and appears on the homepage automatically.

The application stores uploaded files under `JANANI_DATA_DIR/media` (default: `data/media`). Configure `JANANI_DATA_DIR` to a persistent volume in production; the default local filesystem is not durable on ephemeral hosting platforms.

**Important:** Original WhatsApp photographs must be uploaded by the Janani team. No claim is made that the original 12 photographs are present in this repository.

## Publishing workflow

Administrators create writer accounts. Writers sign in, create stories, upload cover or inline images, select a website section, and publish. Homepage gallery uploads are managed separately in the Photo gallery tab.

## Development

```bash
npm install
npm test
npm start
```

Open http://localhost:3000 (or the configured port).

Do not commit `.env`, tokens, database files, or uploaded private data.
