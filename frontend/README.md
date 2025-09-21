# SewaBazaar Frontend

A modern web application for connecting local service providers with customers in Nepal.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Hooks
- **Forms:** React Hook Form + Zod
- **API Client:** Axios
- **Icons:** Lucide React
- **Theme:** next-themes

## Project Structure

``` bash
frontend/
├── src/
│   ├── app/                    # App router pages and layouts
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   ├── forms/             # Form-related components
│   │   ├── features/          # Feature-specific components
│   │   └── theme/             # Theme-related components
│   ├── lib/                    # Third-party library configurations
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── services/              # API and external service integrations
│   ├── types/                 # TypeScript type definitions
│   ├── styles/                # Global styles and CSS modules
│   ├── contexts/              # React context providers
│   └── config/                # Configuration files
├── public/                    # Static assets
└── package.json
```

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/sewabazaar.git
cd sewabazaar/frontend
```

2.Install dependencies:

```bash
npm install
```

3.Create a `.env.local` file:

```bash
cp .env.example .env.local
```

4.Start the development server:

```bash
npm run dev
```

### Turbopack Development Server

For faster development with Turbopack (beta):

```bash
npm run dev:turbopack
```

> Note: Turbopack is currently in beta and may have some limitations compared to the traditional Webpack-based development server.

## Development

- **Format Code:** `npm run format`
- **Lint Code:** `npm run lint`
- **Build for Production:** `npm run build`
- **Start Production Server:** `npm run start`

## Components

### AdvancedBookingsCalendar

Reusable month-view calendar that aggregates events per day into category badges and shows a selected-day details panel. Lives at `src/components/calendar/AdvancedBookingsCalendar.tsx`.

Usage example:

```tsx
import AdvancedBookingsCalendar from "@/components/calendar/AdvancedBookingsCalendar"

const events = [
  { id: 1, date: new Date(), title: "Work Order", category: "work", status: "confirmed" },
]

<AdvancedBookingsCalendar
  events={events}
  initialDate={new Date()}
  onSelectDate={(d) => console.log(d)}
  onSelectEvent={(e) => console.log(e)}
/>
```

Feature flag in customer schedule page: set `NEXT_PUBLIC_ADVANCED_CALENDAR=true` to enable.

## Project Features

- 🌙 Dark Mode Support
- 📱 Responsive Design
- ♿ Accessibility Features
- 🔍 SEO Optimized
- 🚀 Performance Optimized
- 🔒 Type Safety
- 🎨 Modern UI/UX

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
