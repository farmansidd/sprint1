# Resume Builder Implementation Guide

This directory contains the client-side Resume Builder logic.

## Components

- **ResumeBuilder.js**: Main container. Manages state (resume data, active theme) and renders the split-view layout.
- **ResumeForm.jsx**: The left-side interactive form. Handles user input for all resume sections including dynamic lists.
- **ResumePreview.jsx**: The right-side live preview. Renders semantic HTML and injects the selected theme CSS.

## Themes

Themes are standard CSS files located in `public/themes/`.
- `theme-1.css` (Corporate)
- `theme-2.css` (Modern)
- `theme-3.css` (Creative)
- `theme-4.css` (Technical)
- `theme-5.css` (Elegant)

Each theme uses the same HTML structure, targeting classes like `.resume-header`, `.resume-section`, etc.
To add a new theme, simply add a CSS file to `public/themes/` and update the `THEMES` array in `ResumeBuilder.js`.

## Integration Guides

### 1. Connecting "Enhance Text" to an LLM

The `handleEnhanceText` function in `ResumeBuilder.js` is currently a stub. To connect it to a real API (e.g., OpenAI, Gemini):

1.  **Backend Endpoint**: Create a standard API route in Next.js (e.g., `app/api/enhance-text/route.js`).
2.  **Client Logic**:
    Update the `handleEnhanceText` function:

    ```javascript
    const handleEnhanceText = async () => {
        const textPayload = {
            summary: resumeData.summary,
            experience: resumeData.experience.map(e => e.bullets)
        };
        
        try {
            const response = await fetch('/api/enhance-text', {
                method: 'POST',
                body: JSON.stringify(textPayload)
            });
            const suggestions = await response.json();
            // TODO: Display 'suggestions' in a Modal for user approval
        } catch (error) {
            console.error(error);
        }
    };
    ```

### 2. Production PDF Export

The current implementation uses `window.print()` with a print stylesheet, which is robust and simple. For a discrete file download without the print dialog:

**Option A: Client-side (html2pdf.js)**
1.  Install: `npm install html2pdf.js`
2.  Import: `import html2pdf from 'html2pdf.js';`
3.  Update logic:
    ```javascript
    const handleDownloadPDF = () => {
        const element = document.querySelector('.resume-preview-container');
        html2pdf().from(element).save('resume.pdf');
    };
    ```

**Option B: Server-side (Puppeteer)**
1.  Send the `resumeData` and `activeTheme` to a backend API.
2.  The backend renders the HTML, launches a headless browser (Puppeteer), generates the PDF, and streams it back. This ensures exact cross-browser consistency.
