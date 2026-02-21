# PDFify Frontend

> Modern React frontend for PDFify - PDF Tools SaaS
<img width="1498" height="784" alt="image" src="https://github.com/user-attachments/assets/c910fb0e-69f5-4cc0-a66b-37fb01e6040e" />

## 🚀 Features

- All-in-one document solution
- Reduced dependency on multiple tools
- Faster document workflows
- Mobile-first accessibility
- Monetisation via premium subscriptions

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

## 🎨 Adding Shadcn/ui Components

PDFify uses Shadcn/ui for UI components. To add a new component:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```


## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

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
