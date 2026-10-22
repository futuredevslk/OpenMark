# Future Mark 📝
> **An ultra-minimalist, distraction-free, zero-cost paper grading & marking web application for teachers by Future Developers.**

Future Mark (part of the **Future LMS** & **Future Exam** family) allows educators to grade and mark student PDF submissions and photo assignments directly in their browser with instant feedback, 1-click stamps, automatic mark tallying, stylus/pressure support, and client-side PDF export.

---

## ✨ Key Features

- **Minimalist Workspace**: Left vertical tool rail keeping 95% of your screen focused on the student's paper.
- **1-Click Quick Stamps**:
  - `1` : Checkmark (✓)
  - `2` : Cross (✗)
  - `3` : Question Mark (?)
  - `4` : Half / Partial Credit (½)
  - `5` : Star (★)
- **Grading Pen & Highlighter**:
  - Smooth Bezier strokes with Red, Green, Blue, and Black inks.
  - Apple Pencil / Wacom stylus pressure sensitivity.
  - Fluorescent text highlighter with multiply blending.
- **Automatic Score Tally**:
  - Place `+1`, `+2`, `+5`, or `-1` badges next to questions.
  - Live total score calculator in the top bar.
  - One-click stamp to burn the final score onto Page 1!
- **Text Comments & Comment Bank**:
  - Reusable feedback snippets (*"Show complete working"*, *"Great analysis!"*, etc.).
- **Night Mode Paper Filter**:
  - Toggle between authentic white paper and an eye-friendly inverted night filter for late-night grading sessions.
- **Fullscreen & Zen Mode**:
  - Hit `Z` to collapse all toolbars into distraction-free mode.
  - Fullscreen toggle (`⛶`).
- **Batch Multi-Student Grading**:
  - Upload multiple PDFs at once.
  - Navigate between students using `Alt + ]` and `Alt + [`.
  - Export individual graded PDFs or download all papers as a single `.zip` archive.
- **100% Privacy & Zero Server Cost**:
  - Runs entirely in client-side WebAssembly / JavaScript.
  - **No database, no user accounts, no tracking, no backend server.**
  - Papers and student data never leave the teacher's browser.
  - Auto-saves locally in IndexedDB so a browser refresh never loses progress.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1` | Checkmark Stamp (✓) |
| `2` | Cross Stamp (✗) |
| `3` | Question Mark Stamp (?) |
| `4` | Partial Credit Stamp (½) |
| `5` | Star Stamp (★) |
| `P` | Grading Pen |
| `H` | Highlighter |
| `E` | Eraser |
| `T` | Text Feedback |
| `V` | Select / Pointer |
| `Z` | Zen Mode (Toggle minimal view) |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Alt + ]` | Next Student Paper |
| `Alt + [` | Previous Student Paper |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 22)
- pnpm or npm

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/your-username/future-mark.git
cd future-mark

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:5173` in your browser. Click **"Try Demo with Sample Exam Paper"** to immediately test grading!

### Building for Production
```bash
pnpm run build
```
The output will be in the `dist/` directory, ready to deploy to any static host (GitHub Pages, Cloudflare Pages, Vercel, Netlify) for **$0/month**.

---

## 🔒 Security & Privacy

Future Mark processes all documents strictly within the browser's execution sandbox. No PDF bytes, annotations, or personal data are ever uploaded to any cloud server or third-party service. This makes Future Mark inherently compliant with FERPA, GDPR, and COPPA institutional standards.

---

## 📄 License

MIT License. Free for educators, schools, tutors, and developers worldwide.
