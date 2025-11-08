# StyleGenie

AI-assisted personal styling powered by Vite, React, shadcn-ui, and Tailwind CSS.

## Getting Started

Make sure you have a recent Node.js LTS release (or use [nvm](https://github.com/nvm-sh/nvm)) and npm installed.

```sh
git clone <YOUR_GIT_URL>
cd style_genie/frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` by default.

## Available Scripts

- `npm run dev` – start Vite in development mode with hot module replacement.
- `npm run build` – generate the production bundle in `dist/`.
- `npm run build:dev` – production build using development mode flags.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run ESLint across the project.

## Tech Stack

- React 18 + TypeScript
- Vite for tooling/bundling
- Tailwind CSS with shadcn-ui components
- Radix UI primitives and supporting libraries (React Query, React Hook Form, Zod, etc.)

## Deployment

1. Run `npm run build`.
2. Serve the contents of `dist/` with your preferred static host (e.g., Vercel, Netlify, AWS S3 + CloudFront, etc.).
3. Ensure environment variables or API keys referenced by the app are provided by your host as needed.

## Contributing

1. Fork the repo and create a feature branch.
2. Make your changes with accompanying tests or documentation updates.
3. Run `npm run lint` and `npm run build` to verify.
4. Submit a pull request describing the change.
