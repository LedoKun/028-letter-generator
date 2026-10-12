# Docker UI failure on LAN HTTP

Confirmed on 12 October 2026 for `ghcr.io/ledokun/028-letter-generator:latest`, registry index digest `sha256:74b081da3ebfed06042aa9b3f58450d6666fbc2c65c962a590a6ecbe904778cf`.

The published image serves its HTML, styles, JavaScript, fonts and logos correctly. A fresh localhost session renders the editor, but a non-loopback HTTP origin reproduces the reported startup failure:

```text
isSecureContext: false
crypto.randomUUID: undefined
crypto.getRandomValues: function
error: globalThis.crypto.randomUUID is not a function
editor: false
toolbar count: 0
A4 page count: 0
```

Initial template hydration generated field occurrence IDs with the secure-context-only UUID method. The error occurred after the workspace DOM was created but before the editor, toolbar and page layers were initialised, explaining the partially drawn screen.

The fix centralises ID generation in `newId()` in `public/editor/model.mjs`. It retains native UUID generation where available and falls back to 16 random bytes from `getRandomValues()` on HTTP. Field hydration/synchronisation, block menus, medicine rows and inherited travel medicines all use the helper. IDs are opaque internal strings; existing IDs and clinical values remain unchanged. No global Crypto object is modified and no dependency is added. See [randomUUID](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) and [getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) API documentation.

Executed checks:

- `npm test`: 185 passed, including native UUID and fallback uniqueness/template hydration.
- `npm run build`: passed.
- Targeted Playwright HTTP-ID and keyboard-insertion tests: 46 passed in Chromium/Firefox.
- `docker build --progress=plain -t letter-generator:http-id-fix .`: passed on linux/amd64.
- Rebuilt container served over a genuine non-loopback HTTP IP: all 16 template/language/browser scenarios passed, including initial focus, UI, PDF Preview/Download, footer logo and non-destructive state. [Machine results](docker-http-verification.json).

The published/user container was not stopped, replaced or modified. The temporary QA container was removed after testing. The fixed local image is `letter-generator:http-id-fix`; GHCR `latest` has not been republished by this investigation. Publish a build containing this source fix before pulling/recreating the remote deployment.

The original checks used localhost, which browsers treat as a secure context. The new tests cover the previously missed HTTP case. Microsoft Edge itself and ARM runtime were not tested; Chromium and Firefox were. Service-worker offline installation/reload still requires HTTPS or localhost.
