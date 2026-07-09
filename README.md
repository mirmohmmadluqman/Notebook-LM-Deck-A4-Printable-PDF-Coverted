# PDF Imposition Tool

A simple, fast, and secure tool designed to convert your exported NotebookLM PDFs (or any other PDF) into highly printable 4-up (2x2 grid) or 2-up layouts. Perfect for printing study guides or slide decks efficiently.

## Features

- **100% Client-Side:** Processes your PDFs entirely in your browser using `pdf-lib`. No files are ever sent to a server.
- **Vercel Friendly:** Next.js application that easily deploys anywhere.
- **Multiple Layouts:** Choose between 4-up (2x2 grid) or 2-up (side-by-side) on A4 Landscape.
- **Aspect Ratio Preserved:** Pages are scaled perfectly without distortion.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

This project uses Vitest to validate the underlying logic. To run the tests, execute:
```bash
npm run test
```
