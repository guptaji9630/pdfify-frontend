# PDFify Frontend

> Modern React frontend for PDFify - PDF Tools SaaS

<img width="1908" height="966" alt="image" src="https://github.com/user-attachments/assets/c69fd0f3-ca03-41cc-99c1-1756a2cde053" />


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
