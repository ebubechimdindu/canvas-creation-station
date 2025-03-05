# School Ride Transport System

A real-time transportation management system designed to connect students with drivers for safe and reliable rides.

## Features

- Student and Driver authentication
- Real-time ride tracking
- Secure payment processing
- Route optimization
- Rating system
- Bank account management
- Driver earnings tracking

## Prerequisites

- Node.js 16.x or later
- npm 8.x or later
- Modern web browser with JavaScript enabled
- Supabase account for backend services
- Mapbox API key for maps functionality

## Getting Started

1. **Download the project**
   - Visit the GitHub repository
   - Click the green "Code" button
   - Select "Download ZIP"
   - Extract the ZIP file to your desired location

2. **Open the project**
```sh
cd path/to/school-ride-transport-system
```

3. **Install dependencies**
```sh
npm install
```

4. **Environment Setup**

Create a `.env` file in the root directory and add:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

5. **Start the development server**
```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

[Rest of README content remains the same...]