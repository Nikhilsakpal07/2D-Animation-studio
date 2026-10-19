# 🎨 2D Animation Studio

An expressive, tactile, and animated web application for creating, rigging, and sequencing 2D vector animations with 24 FPS precision. Powered by foundational Computer Graphics algorithms, 3×3 homogeneous transformation matrices, and hierarchical forward kinematics.

![Preview](public/icon.svg)

---

## 🌟 Key Features

### 1. Computer Graphics Mathematical Core
- **3×3 Homogeneous Matrices**: Real-time evaluation of 2D Affine Transformations:
  - Translation: $[T(dx, dy)]$
  - Rotation: $[R(\theta)]$ around arbitrary pivot points
  - Scaling: $[S(sx, sy)]$
  - Shear / Skew: $[Sh(kx, ky)]$
- **Sequential Transformation Blocks**: Chain multiple transform actions sequentially across frames on the timeline.
- **Hierarchical Rigging**: Forward kinematics using parent-child matrix chaining ($M_{world} = M_{parent} \times M_{local}$).
- **Interactive Graphics Lab**:
  - DDA Line Drawing
  - Bresenham's Line Algorithm
  - Midpoint Circle Algorithm
  - Midpoint Ellipse Algorithm
  - Scanline & Flood Fill

### 2. Infinite Canvas & Stage Navigation
- **Pan & Zoom Controls**:
  - Smooth zoom from `25%` to `400%` (`Ctrl + Mouse Wheel` or toolbar controls)
  - Infinite stage panning (`Spacebar + Drag`, `Middle Click Drag`, or `Hand Tool (H)`)
  - Center canvas reset (`Ctrl + 0` / *"Fit to Screen"*)
- **Multi-Object Selection & Grouping**:
  - Shift-click selection and rubber-band marquee selection
  - Group (`Ctrl + G`) and Ungroup (`Ctrl + Shift + G`) with dynamic bounding boxes

### 3. Bottom Timeline & Web Audio Sequencer
- **24 FPS Sequential Timeline**: Keyframe sequencer with easing curves (Linear, Ease-In, Ease-Out, Cubic, Elastic).
- **Dedicated Audio Track**:
  - Offline synthesized Web Audio background presets (*"Upbeat Chiptune"*, *"Cozy Lo-Fi"*, *"Cinematic Synth"*)
  - Custom `.mp3` / `.wav` upload support
  - Frame-accurate Sound Cues (*"Whoosh"*, *"Jump / Boing"*, *"Pop"*, *"Car Horn"*, *"Chime"*)
  - Interactive live audio waveform visualization

### 4. Authentication Gate & User Profile Dashboard
- **Authentication Gate**: Secure Firebase Authentication (Google One-Tap and Email/Password).
- **User Profile & Workspace Dashboard**:
  - Live creator statistics (*Total Animations Saved*, *Custom Assets Built*, *Transform Blocks*)
  - Editable Bio and Role
  - Saved Work Gallery with one-click **`▷ Resume in Studio`**, **`Duplicate`**, **`Download .cgproj`**, and **`Delete`**
  - Custom CG Assets Library
  - Chronological Activity History Feed (*"What I Did"*)
- **Cloud Firestore + LocalStorage Dual-Sync**: Automatically saves projects to Cloud Firestore with instant LocalStorage offline fallbacks.

### 5. Export & Project Management
- **Project Files (`.cgproj`)**: Save, load, and share complete animation states in portable JSON format.
- **Video & Image Export**: Render animations to MP4, WebM, animated GIF, or PNG sequence.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nikhilsakpal07/2D-Animation-studio.git
   cd 2D-Animation-studio
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file based on `.env.example`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (Turbopack, App Router)
- **Language**: TypeScript
- **UI & Micro-Interactions**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), `canvas-confetti`
- **Audio Engine**: Web Audio API
- **Backend / Authentication**: Firebase Authentication & Cloud Firestore
- **Styling**: Vanilla CSS with custom Warm Cream & Coral design system (`#FAF6F0`, `#D65A47`, `#7B6DAF`)

---

## 📄 License
This project is open source and available under the MIT License.
