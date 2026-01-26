# PDFify Frontend

> Modern React frontend for PDFify - PDF Tools SaaS

## 🚀 Features

- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **TailwindCSS** + **Shadcn/ui** for beautiful UI
- **React Query** for data fetching
- **Zustand** for state management
- **React Router** for navigation

## 📋 Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

## 🛠️ Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `VITE_API_URL` to your backend URL:

```bash
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### 3. Start Development Server

```bash
pnpm dev
```

Frontend will start at http://localhost:5173

## 🏗️ Project Structure

```
pdfify-frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn/ui components
│   │   └── shared/       # Common components (Header, Footer)
│   ├── pages/             # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Dashboard.tsx
│   ├── lib/
│   │   ├── api.ts         # API client (Axios)
│   │   └── utils.ts       # Utility functions
│   ├── store/
│   │   └── authStore.ts   # Zustand auth store
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## 🎨 Adding Shadcn/ui Components

PDFify uses Shadcn/ui for UI components. To add a new component:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## 🔐 Authentication Flow

1. User registers/logs in
2. JWT token received from backend
3. Token stored in LocalStorage + Zustand
4. Token added to all API requests via Axios interceptor
5. Protected routes check auth state

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://your-backend.railway.app
# VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx

# Production deployment
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
pnpm build

# Deploy
netlify deploy --prod --dir=dist
```

### Cloudflare Pages

Push to GitHub and connect repository in Cloudflare Pages dashboard.

Build settings:
- Build command: `pnpm build`
- Build output: `dist`

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## 🎯 Next Steps

Week 1-2 tasks:
- [x] Basic project setup
- [x] Auth pages (Login/Register)
- [x] Dashboard layout
- [ ] File uploader component
- [ ] PDF tool pages (Merge, Compress, Split)
- [ ] Razorpay payment integration

## 💡 Tips

### Hot Reload
Vite provides instant HMR (Hot Module Replacement). Save any file and see changes immediately.

### TypeScript
All API responses are typed for better development experience.

### Styling
Use Tailwind utility classes. For custom components, extend theme in `tailwind.config.js`.

## 🐛 Troubleshooting

### API Connection Error

Make sure backend is running and `VITE_API_URL` is correct in `.env`.

### Build Errors

Clear node_modules and reinstall:

```bash
rm -rf node_modules
pnpm install
```

## 📄 License

MIT

## 💬 Support

- Email: support@pdfify.com
- Docs: https://docs.pdfify.com
