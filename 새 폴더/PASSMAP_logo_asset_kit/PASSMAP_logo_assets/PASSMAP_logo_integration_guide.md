# PASSMAP Logo Integration Guide

## 1. Copy assets

Copy this folder into the project as:

```txt
public/brand/
```

Recommended minimum files to keep in the repo:

```txt
public/brand/passmap-logo-horizontal-color.png
public/brand/passmap-logo-horizontal-white-wordmark.png
public/brand/passmap-symbol-color.png
public/brand/passmap-favicon-192.png
public/brand/passmap-favicon-512.png
public/favicon.ico
```

## 2. Update `index.html`

Replace the existing favicon lines with:

```html
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/brand/passmap-favicon-180.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#020E2F" />
```

## 3. Add `public/site.webmanifest`

```json
{
  "name": "PASSMAP",
  "short_name": "PASSMAP",
  "icons": [
    {
      "src": "/brand/passmap-favicon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/brand/passmap-favicon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#020E2F",
  "background_color": "#FFFFFF",
  "display": "standalone"
}
```

## 4. Use in React header

```jsx
<img
  src="/brand/passmap-logo-horizontal-color.png"
  alt="PASSMAP"
  className="h-8 w-auto object-contain"
/>
```

For dark header:

```jsx
<img
  src="/brand/passmap-logo-horizontal-white-wordmark.png"
  alt="PASSMAP"
  className="h-8 w-auto object-contain"
/>
```

## 5. Suggested brand tokens

```js
export const PASSMAP_BRAND = {
  navy: "#020E2F",
  blue: "#2357FF",
  sky: "#18B7FF",
  white: "#FFFFFF",
};
```

## 6. QA checklist

- Transparent PNG shows correctly on white, navy, and gradient backgrounds.
- Header logo height is between `h-7` and `h-9` on desktop.
- Mobile header should use symbol only when horizontal space is tight.
- Browser tab favicon updates after hard refresh.
- No stretched logo: always use `w-auto object-contain`.
