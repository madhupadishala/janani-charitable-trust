# Janani Charitable Trust — homepage photographs

The public homepage reads its gallery from the media records created by authenticated Publishing Studio uploads. Do not add hardcoded image paths to `public/index.html`.

## Upload workflow

1. Sign in to `/admin.html`.
2. Open **Photo gallery**.
3. Add a factual caption and upload a JPEG, PNG, or WebP photograph (maximum 3 MB).
4. The latest 12 uploaded photographs appear on the homepage. The newest photograph is also used as the hero background.

Uploaded files are stored outside the static source directory at `JANANI_DATA_DIR/media` (default `data/media`) and served through `/uploads/`. Production deployments must mount this directory on persistent storage.

Only upload authentic photographs approved for public display by Janani Charitable Trust. Obtain appropriate consent before publishing identifiable beneficiaries, especially children. The repository does not currently contain the original WhatsApp photo collection.
