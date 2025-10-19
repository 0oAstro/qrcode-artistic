# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a QR code artistic generation project built with Next.js 14 and Python backend:

- **Frontend**: Next.js 14 React application with App Router
- **Backend**: Python QR code generation using Vercel Functions
- **UI Framework**: Modern component-based interface with shadcn/ui

## Development Commands

**Frontend Development:**
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome linter (if configured)
```

**Package management:** The project uses pnpm as the package manager.

## Architecture

### Frontend Application
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **UI Components**: Extensive shadcn/ui component library (buttons, forms, cards, etc.)
- **TypeScript**: Fully configured with strict typing
- **Main Component**: `PixelQrGenerator` handles image generation interface
- **Special Effects**: Uses `@paper-design/shaders-react` for dithering background effects

### Backend API (Vercel Functions)
- **Runtime**: Python 3.9 configured in vercel.json
- **QR Generation**: Uses Segno library for QR code creation
- **Image Processing**: Handles form data with image uploads
- **API Endpoint**: `/api/generate-qr` for artistic QR code generation
- **Output**: Returns generated images as direct binary data

### Key Features
- **Dual Input Modes**: File upload and URL input for images
- **HEIC Support**: Automatic conversion of HEIC images to JPEG
- **Image Compression**: Optimizes images for API performance
- **Drag & Drop**: Full drag-and-drop support for file uploads
- **Clipboard Support**: Copy generated images to clipboard
- **Progress Tracking**: Visual progress bars for long operations
- **Fullscreen Preview**: Modal for viewing generated images

## Component Architecture

### Main Components
- `PixelQrGenerator`: Main application component handling the entire UI
- UI components in `components/ui/`: Complete shadcn/ui component set
- `theme-provider`: Dark/light theme support

### State Management
The main component uses React hooks for state:
- Image uploads and previews
- Loading states and progress tracking
- Generated image management
- UI interactions (drag & drop, fullscreen, etc.)

## Tailwind CSS v4 Usage

This project uses Tailwind CSS v4:
- **Configuration**: Uses `@tailwindcss/postcss` instead of traditional config
- **PostCSS Integration**: Automatically configured through PostCSS plugin
- **Styling**: Dark theme with glass morphism effects
- **Responsive**: Mobile-first responsive design

## API Integration

### Image Generation Endpoint
```bash
POST /api/generate-qr
Content-Type: multipart/form-data

# Form fields:
- url: QR code target URL
- scale: QR code scale factor
- kind: Output image format (png, jpg, gif)
- image: Background image file
```

### Response
- Success: Returns binary image data with appropriate Content-Type
- Error: Returns JSON error message with 400/500 status codes

## Development Workflow

1. **Local Development**: Use `pnpm dev` to start the development server
2. **Component Addition**: Use `pnpm dlx shadcn@latest add [component]` for new UI components
3. **API Testing**: Test QR generation through the web interface
4. **Deployment**: Deploy to Vercel with `vercel deploy`

## File Structure

```
app/
├── api/generate-qr/index.py    # Python API endpoint
├── layout.tsx                  # Root layout
├── page.tsx                    # Home page
└── globals.css                 # Global styles

components/
├── PixelQrGenerator.tsx        # Main app component
├── theme-provider.tsx          # Theme context
└── ui/                         # shadcn/ui components

lib/
└── utils.ts                    # Utility functions
```

## Current Implementation Status

The project currently provides a fully functional image generation interface with:
- Complete UI for text-to-image and image-to-image generation
- File upload and URL input support
- Image processing capabilities (HEIC conversion, compression)
- Progress tracking and loading states
- Download and clipboard functionality
- Responsive design with modern aesthetics

Note: The current implementation appears to be set up for general image generation rather than QR code generation specifically, though the backend API supports QR code creation with background images.
