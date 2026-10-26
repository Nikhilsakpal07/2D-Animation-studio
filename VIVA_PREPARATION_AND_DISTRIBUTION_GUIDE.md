# 🎨 2D Animation Studio — Viva Defense & Feature Distribution Guide
### Feature-First Distribution & Presentation Script for 4 Members
**Project Repository:** `Nikhilsakpal07/2D-Animation-studio`  
**Word Document Generated:** [`PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx`](file:///d:/cg%20project/PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx)  
**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, HTML5 2D Canvas, Web Audio API, Firebase Auth & Firestore

---

## 📋 Table of Contents
1. [Core Strategy: Equal Feature-Based Distribution (4 People)](#1-core-strategy-equal-feature-based-distribution-4-people)
2. [Feature Distribution Matrix (What Each Member Built & Demos)](#2-feature-distribution-matrix-what-each-member-built--demos)
3. [Word-by-Word Live Viva Script (12–15 Minutes)](#3-word-by-word-live-viva-script-1215-minutes)
   - [Act 1: Team Introduction (0:00 – 1:30)](#act-1-team-introduction-000--130)
   - [Act 2: Member 1 — Visual Creation Studio, Graphics Lab & Scenic Backdrops (1:30 – 4:30)](#act-2-member-1--visual-creation-studio-graphics-lab--scenic-backdrops-130--430)
   - [Act 3: Member 2 — Stage Canvas, Infinite Pan/Zoom & Object Grouping (4:30 – 7:30)](#act-3-member-2--stage-canvas-infinite-panzoom--object-grouping-430--730)
   - [Act 4: Member 3 — 3×3 Homogeneous Matrices, Inspector & Rigging (7:30 – 10:30)](#act-4-member-3--33-homogeneous-matrices-inspector--rigging-730--1030)
   - [Act 5: Member 4 — 24 FPS Timeline, Procedural Audio, GIF Export & Cloud (10:30 – 13:30)](#act-5-member-4--24-fps-timeline-procedural-audio-gif-export--cloud-1030--1330)
   - [Act 6: Team Conclusion (13:30 – 14:30)](#act-6-team-conclusion-1330--1430)
4. [Step-by-Step Screen Demonstration Runbook](#4-step-by-step-screen-demonstration-runbook)
5. [Professor Cross-Questioning FAQ & Mathematical Proofs](#5-professor-cross-questioning-faq--mathematical-proofs)
6. [Quick Code File Pointers](#6-quick-code-file-pointers)

---

## 1. Core Strategy: Equal Feature-Based Distribution (4 People)

In an academic viva, evaluators grade **every team member** on the tangible website features they personally built and understand. Nobody is relegated to "only theory" or "only algorithms."

Each member owns:
1. **Interactive UI Features** they click and showcase live on screen.
2. **System Architecture & Logic** powering that feature.
3. **Foundational Computer Graphics Mathematics** justifying the implementation.

---

## 2. Feature Distribution Matrix (What Each Member Built & Demos)

| Member | Website Feature Subsystem | Live Features Demonstrated on Screen | Computer Graphics & Engineering Core | Key Code Files |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1** | **Visual Creation Studio, Graphics Lab & Scenic Backdrops** | 1. **Interactive Graphics Lab (`CG Algorithms` button)**: Pixel grid visualizer for shapes with real-time coordinate tables.<br>2. **Scenic Backgrounds Studio (`Background` button)**: Day meadow, starry night, sunset cityscape, blueprint grid, custom gradients.<br>3. **Template & Asset Library (`Templates` button)**: One-click starter scenes (bouncing balls, rigged characters, walk cycles). | • **DDA & Bresenham Line Algorithms** (integer decision $err = \Delta x - \Delta y$).<br>• **Midpoint Circle Algorithm** (8-way symmetry, $p_0 = 1 - r$).<br>• **Midpoint Ellipse Algorithm** (Region 1 & 2 slope split).<br>• **Cubic Bézier Curves** (Bernstein polynomials). | • `lib/cg-engine.ts`<br>• `components/GraphicsLabModal.tsx`<br>• `components/CustomBackgroundModal.tsx`<br>• `components/TemplatesModal.tsx` |
| **Member 2** | **Stage Canvas Architecture, Multi-Select & Object Grouping** | 1. **Infinite Stage Canvas Navigation**: Smooth panning (`Spacebar + Drag` / Hand tool), zooming 25%–400% (`Ctrl + Wheel`), Center Reset (`Ctrl + 0`).<br>2. **Marquee Rubber-Band Selection**: Multi-select drag box, Shift-click selection.<br>3. **Hierarchical Object Grouping**: Group (`Ctrl + G`), Ungroup (`Ctrl + Shift + G`), dynamic AABB bounding boxes, and layer reordering. | • **Affine Viewport Transforms**: World-to-screen & screen-to-world mapping: $P_{\text{screen}} = (P_{\text{world}} - \text{Pan}) \times \text{Zoom}$.<br>• **Inverse View Matrix** for mouse picking.<br>• **Axis-Aligned Bounding Box (AABB)** calculations. | • `components/StageCanvas.tsx`<br>• `lib/cg-canvas-renderer.ts` |
| **Member 3** | **3×3 Homogeneous Matrices, Transformation Inspector & Rigging** | 1. **Live 3×3 Matrix Inspector (`Right Panel`)**: Numerical display of the 3×3 transformation matrix $[M_{ij}]$ updating live with sliders.<br>2. **Interactive Controls**: Real-time sliders for Position X/Y, Rotation angle, Scale, and Shear (skew).<br>3. **Joint Pivot Point Picker**: Rotate limbs around elbows/knees/base rather than center.<br>4. **Hierarchical Rigging**: Parent-child linking so moving torso moves attached limbs. | • **3×3 Homogeneous Coordinates** for 2D Affine Transforms ($T, R, S, Sh$).<br>• **Composite Matrix Multiplication**: $M = T \times R \times Sh \times S$.<br>• **Arbitrary Pivot Rotation**: $M_{\text{pivot}} = T(x_p, y_p) \cdot R(\theta) \cdot T(-x_p, -y_p)$.<br>• **Forward Kinematics**: $M_{world} = M_{parent} \times M_{local}$. | • `components/RightInspector.tsx`<br>• `lib/cg-engine.ts` |
| **Member 4** | **24 FPS Animation Timeline, Audio Studio & Export Engine** | 1. **24 FPS Keyframe Sequencer (`Bottom Panel`)**: Interactive timeline, scrubber, play/pause, loop, add/delete keyframes across multiple tracks.<br>2. **Parametric Easing Curves**: Linear, Ease-In, Ease-Out, Cubic, and Elastic/Bouncy motion.<br>3. **Procedural Web Audio Engine (`Audio` button)**: 100% offline synthesizer presets (Chiptune, Lo-Fi, Synthwave), frame-accurate Sound Cues, and live waveform visualizer.<br>4. **Client-Side GIF89a & Video Exporter (`Export` button)**: In-browser GIF generation via 3-3-2 RGB quantization & LZW compression; MP4/WebM video.<br>5. **User Profile Dashboard & Cloud Store**: Firebase Auth, Creator Stats, `.cgproj` project saves, Firestore dual-sync. | • **24 FPS Fixed Time-Step Interpolation**: $\Delta t \approx 41.67\text{ ms}$.<br>• **Client-Side GIF89a LZW Encoder**: 3-3-2 RGB color quantization (24-bit to 8-bit palette) & LZW dictionary compression.<br>• **Web Audio API Graph**: Multi-oscillator synthesis with frequency/gain envelopes.<br>• **Project State Serialization**: Portable `.cgproj` JSON schema. | • `components/TimelinePanel.tsx`<br>• `components/AudioModal.tsx`<br>• `components/ExportModal.tsx`<br>• `components/ProfileDashboard.tsx`<br>• `lib/audio-engine.ts`<br>• `lib/gif-encoder.ts`<br>• `lib/cg-project.ts` |

---

## 3. Word-by-Word Live Viva Script (12–15 Minutes)

### Act 1: Team Introduction (0:00 – 1:30)
**Speaker: Member 1 (or Designated Team Lead)**

> *"Respected external examiner, professors, and faculty members: Good morning. Today, our team is presenting our Computer Graphics project: the **2D Animation Studio & Algorithmic Graphics Laboratory**.*
>
> *While most web applications treat canvas drawing and animation as a black box using high-level browser APIs, our objective was to engineer an expressive, production-grade 2D animation workstation whose core features—from drawing a single pixel line to running 24 FPS character animations with live transformation matrices and procedural sound—are directly governed by foundational Computer Graphics mathematics.*
>
> *Our team of four divided the architecture into distinct, full-featured subsystems:*
> 1. *I, **[Member 1]**, developed the **Visual Creation Studio, Graphics Lab & Scenic Backdrops**.*
> 2. ***[Member 2]** developed the **Stage Canvas Architecture, Multi-Object Selection & Grouping**.*
> 3. ***[Member 3]** developed the **3×3 Homogeneous Matrices, Transformation Inspector & Skeletal Rigging**.*
> 4. ***[Member 4]** developed the **24 FPS Animation Timeline, Procedural Web Audio, Client-Side GIF Exporter & Cloud Persistence**.*
>
> *Let us walk you through the live application feature by feature."*

---

### Act 2: Member 1 — Visual Creation Studio, Graphics Lab & Scenic Backdrops (1:30 – 4:30)
**Speaker: Member 1**  
*(Member 1 takes control of the screen)*

> *"I was responsible for the visual creation features and foundational rasterization engine of the studio.*
>
> **1. Feature 1: The Interactive Graphics Lab (`CG Algorithms` button in header)**
> *(Action: Member 1 clicks 'CG Algorithms' in header to open modal)*  
> *"When students or creators want to inspect how shapes are rasterized, they open our Interactive Graphics Lab. On screen, notice the discrete pixel grid:*
> - *We can select **Bresenham’s Line Algorithm** or **DDA**, set coordinates, and observe the line rasterized pixel-by-pixel. Below the grid is the exact table of plotted pixel coordinates $(x, y)$ and decision parameter updates.*
> - *Under the hood, I implemented Bresenham’s algorithm in [`lib/cg-engine.ts`](file:///d:/cg%20project/lib/cg-engine.ts) using pure integer arithmetic with the error accumulator $err = \Delta x - \Delta y$. By testing $2 \times err$, pixel steps require only integer additions and bit shifts ($err \ll 1$), completely eliminating floating-point rounding latency.*
> - *Selecting **Midpoint Circle** demonstrates **8-way octant symmetry** with initial decision variable $p_0 = 1 - r$. Plotting a single point simultaneously generates 8 symmetric points $(\pm x, \pm y)$ and $(\pm y, \pm x)$, reducing computation by 87.5%.*
> - *For **Midpoint Ellipse**, I implemented the two-region slope split ($|\text{slope}| < 1$ in Region 1 vs. $|\text{slope}| \ge 1$ in Region 2) at the boundary where $2r_y^2 x = 2r_x^2 y$.*
> - *For smooth curves, I implemented **Parametric Cubic Bézier Curves** using Bernstein polynomials.*
>
> **2. Feature 2: Scenic Backgrounds Studio (`Background` button)**
> *(Action: Closes modal, clicks 'Background' in top toolbar)*  
> *"Animations need rich scenic environments. I built the Scenic Backgrounds Studio where users can toggle animated presets like Sunny Meadow, Sunset City, Deep Space, Blueprint Grid, or construct custom multi-stop CSS gradients.*
>
> **3. Feature 3: Template & Asset Library (`Templates` button)**
> *(Action: Clicks 'Templates')*  
> *"I created starter templates (bouncing balls, pre-rigged character walk cycles) so users can start animating in one click.*
>
> *Now, Member 2 will demonstrate the Stage Canvas, infinite pan/zoom, and object grouping."*

---

### Act 3: Member 2 — Stage Canvas, Infinite Pan/Zoom & Object Grouping (4:30 – 7:30)
**Speaker: Member 2**  
*(Member 2 takes control of the screen)*

> *"Thank you, Member 1. I developed the interactive stage canvas engine, viewport navigation, and multi-object selection architecture.*
>
> **1. Feature 1: Infinite Stage Canvas & Navigation**
> *(Action: Member 2 holds Spacebar and pans stage; zooms with Ctrl + Wheel)*  
> *"Our studio provides an Infinite Stage Canvas with smooth panning (`Spacebar + Drag` or Hand Tool `H`) and continuous zooming from 25% to 400%. Pressing `Ctrl + 0` instantly re-centers the stage ('Fit to Screen').*
> *Under the hood, I implemented this as a 2D affine viewport transformation matrix:*
> $$P_{\text{screen}} = (P_{\text{world}} - \text{Pan}) \times \text{Zoom}$$
> *When the user clicks anywhere on the canvas, my engine applies the inverse view transformation to map browser screen coordinates back into exact canvas world coordinates for pinpoint object picking.*
>
> **2. Feature 2: Marquee Selection & Multi-Select**
> *(Action: Member 2 drags a rubber-band marquee box across multiple objects)*  
> *"I built rubber-band marquee drag-selection and Shift-click multi-selection. My algorithm computes the Axis-Aligned Bounding Box (AABB) enclosing all selected objects in real time, rendering intuitive corner scale handles.*
>
> **3. Feature 3: Hierarchical Grouping & Management**
> *(Action: Presses Ctrl + G to group, then Ctrl + Shift + G to ungroup)*  
> *"Pressing `Ctrl + G` combines independent objects into a unified group that can be transformed as a single entity, and `Ctrl + Shift + G` restores individual control. I also implemented layer reordering (bring to front, send to back) and duplicate actions.*
>
> *Now, Member 3 will present the 3×3 Homogeneous Matrices, our live Inspector, and Skeletal Rigging."*

---

### Act 4: Member 3 — 3×3 Homogeneous Matrices, Inspector & Rigging (7:30 – 10:30)
**Speaker: Member 3**  
*(Member 3 takes control of the screen)*

> *"Thank you, Member 2. I was responsible for the linear algebra transformation engine, live matrix inspector, and skeletal forward kinematics.*
>
> **1. Feature 1: Live 3×3 Transformation Matrix Inspector (`Right Panel`)**
> *(Action: Member 3 selects an object on stage and points to Right Inspector)*  
> *"Please look at the Right Inspector. Unlike commercial tools that hide the math, our studio computes and displays the full **3×3 Homogeneous Transformation Matrix** live on screen:*
> $$\begin{bmatrix} M_{00} & M_{01} & M_{02} \\ M_{10} & M_{11} & M_{12} \\ M_{20} & M_{21} & M_{22} \end{bmatrix}$$
> *As I drag the **Rotation slider**, observe $\cos\theta$ and $\sin\theta$ changing live in the matrix! As I adjust **Position X and Y**, the translation column $[t_x, t_y]^T$ updates. As I change **Shear (Skew)**, off-diagonal terms distort the shape into a parallelogram.*
> *Why 3×3 matrices? In 2D Cartesian space, translation $[x + t_x, y + t_y]$ is an affine vector addition that cannot be expressed as a 2×2 matrix multiplication. By mapping 2D points into 3D projective homogeneous coordinates $[x, y, 1]^T$, translation, rotation, scale, and shear unify into clean composite matrix multiplication:*
> $$M_{\text{composite}} = T \times R \times Sh \times S$$
>
> **2. Feature 2: Custom Joint Pivot Points**
> *(Action: Changes Pivot to 'Bottom-Center' and rotates the object)*  
> *"Standard tools only rotate around the center. But in character animation, a limb must rotate around a shoulder, elbow, or base pivot $(x_p, y_p)$. I implemented arbitrary pivot rotation:*
> $$M_{\text{pivot}} = T(x_p, y_p) \times R(\theta) \times T(-x_p, -y_p)$$
> *Translating the pivot to origin, rotating, and translating back.*
>
> **3. Feature 3: Skeletal Rigging (Forward Kinematics)**
> *(Action: Shows Arm parented to Body; rotates Body to show Arm moving)*  
> *"I built an articulated parent-child rigging hierarchy. By multiplying matrices down the tree:*
> $$M_{\text{world}} = M_{\text{parent}} \times M_{\text{local}}$$
> *Rotating the torso automatically moves the attached limbs without manual trigonometry.*
>
> *Now, Member 4 will demonstrate our 24 FPS Timeline, Procedural Audio, and Client-Side GIF Exporter."*

---

### Act 5: Member 4 — 24 FPS Timeline, Audio Sequencer, GIF Export & Cloud (10:30 – 13:30)
**Speaker: Member 4**  
*(Member 4 takes control of the screen)*

> *"Thank you, Member 3. I developed the animation sequencer, procedural sound engine, client-side export pipeline, and cloud persistence.*
>
> **1. Feature 1: 24 FPS Keyframe Sequencer (`Bottom Panel`)**
> *(Action: Member 4 hits Play / Spacebar on timeline)*  
> *"Film and professional animation run at locked 24 frames per second ($\Delta t \approx 41.67\text{ ms}$). Creators can scrub the timeline, add keyframes across multiple tracks, and loop playback.*
> *Instead of robotic linear movement, I implemented parametric **Easing Curves**: Ease-In (quadratic/cubic acceleration), Ease-Out (gentle deceleration), and Elastic/Bouncy curves that simulate physical gravity and bounce.*
> *I also built **Sequential Transform Blocks** ('Move to Target', 'Rotate 360', 'Scale Up') that chain animations sequentially across frames.*
>
> **2. Feature 2: Procedural Web Audio Engine & Sound Cues (`Audio` button)**
> *(Action: Clicks 'Audio', triggers sound cues)*  
> *"Audio makes animation expressive. I built a **100% offline Web Audio synthesizer** using the browser's native `AudioContext`:*
> - *Synthesizes three procedural background music genres: 8-bit Chiptune, Cozy Lo-Fi, and Cinematic Synth using multi-oscillator waveforms and gain envelopes.*
> - *Frame-Accurate Sound Cues: 'Whoosh' (bandpass noise sweep), 'Jump/Boing' (pitch glide 150 to 450 Hz), 'Pop', and 'Car Horn' placed on specific frames.*
> - *Notice the live audio waveform visualizer dancing above the timeline tracks!*
>
> **3. Feature 3: Client-Side GIF89a & Video Exporter (`Export` button)**
> *(Action: Clicks 'Export Animation')*  
> *"Instead of relying on Python/FFmpeg servers, I wrote a **native TypeScript GIF89a encoder**:*
> - *Extracts canvas pixel buffers at 24 FPS.*
> - *Performs **3-3-2 RGB Color Quantization** (24-bit TrueColor to 8-bit, 256-color palette).*
> - *Builds Netscape 2.0 loop blocks and compresses pixel streams using the **LZW (Lempel-Ziv-Welch) variable-length dictionary algorithm**, generating a downloadable `.gif` directly in browser memory!*
> - *Also supports MP4/WebM video recording and PNG frame sequence zip exports.*
>
> **4. Feature 4: User Profile Dashboard & Cloud Store**
> *(Action: Clicks User Profile in top right)*  
> *"I integrated Firebase Authentication, Creator Profile stats (animations saved, action blocks), portable `.cgproj` JSON schema, and Cloud Firestore + LocalStorage dual-sync for offline reliability.*
>
> *We are now ready for your questions."*

---

### Act 6: Team Conclusion (13:30 – 14:30)
**Speaker: All Members**

> *"To conclude: every feature in our 2D Animation Studio proves that theoretical Computer Graphics algorithms and practical modern web engineering can build an inspiring, production-ready workstation.*
>
> *Thank you, and we welcome your questions!"*

---

## 4. Step-by-Step Screen Demonstration Runbook

```
[MEMBER 1: Visual Creation & Graphics Lab]
  1. Open http://localhost:3000 in browser.
  2. Click 'CG Algorithms' in header nav -> Select Bresenham's Line -> Point to pixel grid & coordinates table.
  3. Select Midpoint Circle -> Explain 8-way octant symmetry and p0 = 1 - r.
  4. Select Midpoint Ellipse -> Point to Region 1 vs Region 2 slope boundary.
  5. Close modal -> Click 'Background' -> Toggle Sunny Meadow, Sunset City, and Deep Space.
  6. Click 'Templates' -> Show pre-built character rig and bouncing ball physics scenes.

[MEMBER 2: Stage Canvas, Viewport Pan/Zoom & Grouping]
  7. On main canvas: Hold Spacebar and pan the stage freely.
  8. Zoom in/out with Ctrl + Mouse Wheel (show 25% to 400% zoom range).
  9. Press Ctrl + 0 to demonstrate instant 'Fit to Screen' centering.
  10. Drag rubber-band marquee selection box over multiple objects.
  11. Press Ctrl + G to group objects into dynamic bounding box -> Press Ctrl + Shift + G to ungroup.

[MEMBER 3: 3×3 Matrices, Live Inspector & Rigging]
  12. Click any character/object on canvas -> Direct attention to Right Inspector panel.
  13. Show the live 3×3 Homogeneous Transformation Matrix display [M_ij].
  14. Drag Rotation slider: watch cos(θ) and sin(θ) update live in the matrix grid!
  15. Drag Position X/Y and Shear sliders: show translation column [tx, ty] and skew distortion.
  16. Change Pivot preset to 'Bottom-Center' -> Rotate object to show it swinging around base joint.
  17. Show parent-child rigging hierarchy (Arm linked to Body -> rotating Body moves Arm).

[MEMBER 4: 24 FPS Timeline, Audio, GIF Export & Dashboard]
  18. Direct attention to Bottom Timeline -> Hit Play (Spacebar) to run 24 FPS playback.
  19. Select an object on timeline -> Demonstrate Easing Curve dropdown (Linear vs Elastic/Bouncy).
  20. Click 'Audio' in header -> Play synthesized Chiptune/Lo-Fi music presets and trigger sound cues ('Jump', 'Whoosh').
  21. Point to live audio waveform visualization above timeline tracks.
  22. Click 'Export Animation' -> Demonstrate client-side animated GIF export (explain 3-3-2 RGB & LZW).
  23. Click User Profile in top-right -> Display creator statistics, activity feed, and saved .cgproj gallery.
```

---

## 5. Professor Cross-Questioning FAQ & Mathematical Proofs

### For Member 1 (Creation, Lab & Algorithms)
- **Q: Why is Bresenham’s Line Algorithm faster than DDA?**  
  *A:* DDA relies on floating-point arithmetic because slope $m = \Delta y / \Delta x$ is fractional, requiring float additions and `round()` calls at every pixel. Bresenham reformulates the line equation into pure integer calculations by multiplying by $2\Delta x$. The error decision parameter $err = \Delta x - \Delta y$ requires only integer additions, subtractions, and bitwise shifts ($2 \times err = err \ll 1$), completely eliminating floating-point latency.
- **Q: Derive the initial decision parameter for Midpoint Circle ($p_0 = 1 - r$).**  
  *A:* Implicit circle equation is $f(x, y) = x^2 + y^2 - r^2$. At step $(x_k, y_k)$, candidate pixels are $E(x_k+1, y_k)$ and $SE(x_k+1, y_k-1)$. Midpoint is $M(x_k+1, y_k - 0.5)$. Evaluating decision variable $p_k = f(M)$ for initial point $(0, r)$: $p_0 = f(1, r - 0.5) = 1^2 + (r - 0.5)^2 - r^2 = 1 + r^2 - r + 0.25 - r^2 = \frac{5}{4} - r$. For integer arithmetic, $\frac{5}{4}$ is rounded to 1, giving $p_0 = 1 - r$.
- **Q: Why is Midpoint Ellipse split into two regions?**  
  *A:* Because an ellipse has varying curvature where tangent slope changes from 0 to $-\infty$. In Region 1, $|\text{slope}| < 1$, so $x$ changes faster than $y$; we step $x$ by $+1$ and test whether to decrement $y$. The boundary occurs where tangent slope is $-1$ ($2r_y^2 x = 2r_x^2 y$). In Region 2, $|\text{slope}| \ge 1$, so $y$ drops faster; we decrement $y$ by $-1$ and test whether to increment $x$. Splitting prevents gaps along steep curves.

### For Member 2 (Canvas, Viewport & Grouping)
- **Q: How does your canvas handle Viewport Pan and Zoom transformations?**  
  *A:* Pan and zoom represent a 2D affine viewing transformation from World Coordinates to Viewport Screen Coordinates:  
  $$\begin{bmatrix} x_{\text{screen}} \\ y_{\text{screen}} \\ 1 \end{bmatrix} = \begin{bmatrix} s & 0 & tx_{\text{pan}} \\ 0 & s & ty_{\text{pan}} \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_{\text{world}} \\ y_{\text{world}} \\ 1 \end{bmatrix}$$  
  where $s$ is zoom and $(tx, ty)$ is pan offset. When the user clicks on canvas, my engine applies the inverse view matrix $M_{\text{view}}^{-1}$: $P_{\text{world}} = \frac{P_{\text{screen}} - \text{Pan}}{\text{Zoom}}$, ensuring exact mouse picking at any zoom level.
- **Q: How does Marquee Selection calculate bounding boxes for grouped objects?**  
  *A:* When multiple objects are selected, my engine computes the global Axis-Aligned Bounding Box (AABB): $\min X = \min(\text{obj}.x)$, $\max X = \max(\text{obj}.x + \text{obj}.w)$, $\min Y = \min(\text{obj}.y)$, $\max Y = \max(\text{obj}.y + \text{obj}.h)$. When grouped via `Ctrl+G`, child coordinates are normalized relative to this group origin, and transforming the group applies a composite matrix to all child elements.

### For Member 3 (3×3 Matrices & Rigging)
- **Q: Why are 3×3 matrices required for 2D transformations instead of 2×2?**  
  *A:* In 2D Cartesian space, linear transformations (rotation, scaling) can be written as 2×2 matrices. But translation is an affine vector addition: $[x', y'] = [x + t_x, y + t_y]$. Addition cannot be expressed via 2×2 matrix multiplication! By lifting 2D coordinates into 3D Projective Homogeneous Coordinates $[x, y, 1]^T$, translation becomes a linear matrix multiplication. This enables matrix concatenation: $M = T \times R \times Sh \times S$.
- **Q: How does rotation around an arbitrary pivot point work mathematically?**  
  *A:* Basic rotation $R(\theta)$ only rotates around the origin $(0, 0)$. To rotate around a custom joint pivot $(x_p, y_p)$, my engine applies three composite matrices: (1) Translate pivot to origin: $T(-x_p, -y_p)$, (2) Rotate by $\theta$: $R(\theta)$, (3) Translate origin back to pivot: $T(x_p, y_p)$. In composite form: $M_{\text{pivot}} = T(x_p, y_p) \times R(\theta) \times T(-x_p, -y_p)$.
- **Q: Explain Forward Kinematics in your skeletal rigging hierarchy.**  
  *A:* Every limb stores a `parentId`. When calculating world position, my engine recursively traverses the tree: $M_{\text{world}}(\text{child}) = M_{\text{world}}(\text{parent}) \times M_{\text{local}}(\text{child})$. The local matrix contains the joint rotation around the limb pivot. When the parent rotates, its world matrix changes, automatically cascading to all descendant limbs without manual trigonometry.

### For Member 4 (Timeline, Audio, GIF & Cloud)
- **Q: How does 24 FPS keyframe interpolation calculate intermediate values?**  
  *A:* Animation runs at locked 24 FPS ($\Delta t = \frac{1000}{24} \approx 41.67\text{ ms}$). For current frame $f$ between keyframe $A$ (frame $f_A$) and keyframe $B$ (frame $f_B$), normalized time progress is $t = \frac{f - f_A}{f_B - f_A} \in [0, 1]$. An easing function $e(t)$ is applied (Ease-Out: $1 - (1-t)^3$, or Elastic damped harmonic oscillator). The property value is: $V(f) = V_A + e(t) \cdot (V_B - V_A)$.
- **Q: How does your client-side GIF encoder work without FFmpeg or a backend?**  
  *A:* My TypeScript GIF89a encoder: (1) Extracts raw canvas pixel buffers (`Uint8ClampedArray`) at 24 FPS. (2) Performs **3-3-2 RGB Color Quantization** to map 24-bit TrueColor to an 8-bit, 256-color Global Color Table. (3) Writes GIF89a headers with Netscape 2.0 loop extension for infinite playback. (4) Compresses pixel index sequences using the **LZW variable bit-width dictionary algorithm**, packing codewords (9 to 12 bits) into byte sub-blocks directly in browser memory.
- **Q: How does your Web Audio synthesizer operate completely offline?**  
  *A:* It uses the browser's native `AudioContext` without external audio files. It constructs real-time audio graphs with `OscillatorNode` sources (square, saw, triangle, sine) and shapes volume/filter envelopes using `GainNode` and `BiquadFilterNode`. For cues like 'Jump/Boing', it modulates oscillator frequency from 150 to 450 Hz using `linearRampToValueAtTime`.

---

## 6. Quick Code File Pointers

- **Member 1 (Creation, Lab & Algorithms):**
  - Line rasterization (DDA & Bresenham): [`lib/cg-engine.ts:L51-L112`](file:///d:/cg%20project/lib/cg-engine.ts#L51-L112)
  - Midpoint Circle & Ellipse: [`lib/cg-engine.ts:L118-L251`](file:///d:/cg%20project/lib/cg-engine.ts#L118-L251)
  - Interactive Graphics Lab: [`components/GraphicsLabModal.tsx`](file:///d:/cg%20project/components/GraphicsLabModal.tsx)
  - Scenic Backgrounds Studio: [`components/CustomBackgroundModal.tsx`](file:///d:/cg%20project/components/CustomBackgroundModal.tsx)
  - Template Library: [`components/TemplatesModal.tsx`](file:///d:/cg%20project/components/TemplatesModal.tsx)

- **Member 2 (Canvas, Viewport & Grouping):**
  - Infinite Canvas & Viewport Mapping: [`components/StageCanvas.tsx`](file:///d:/cg%20project/components/StageCanvas.tsx)
  - Canvas 2D Renderer & Bounding Boxes: [`lib/cg-canvas-renderer.ts`](file:///d:/cg%20project/lib/cg-canvas-renderer.ts)

- **Member 3 (3×3 Matrices & Rigging):**
  - 3×3 Matrices & Composition: [`lib/cg-engine.ts:L288-L416`](file:///d:/cg%20project/lib/cg-engine.ts#L288-L416)
  - Pivot Point Calculations: [`lib/cg-engine.ts:L439-L470`](file:///d:/cg%20project/lib/cg-engine.ts#L439-L470)
  - Live 3×3 Matrix Inspector UI: [`components/RightInspector.tsx`](file:///d:/cg%20project/components/RightInspector.tsx)

- **Member 4 (Timeline, Audio, GIF & Cloud):**
  - 24 FPS Timeline & Easing math: [`components/TimelinePanel.tsx`](file:///d:/cg%20project/components/TimelinePanel.tsx)
  - Procedural Web Audio Engine: [`lib/audio-engine.ts`](file:///d:/cg%20project/lib/audio-engine.ts) & [`components/AudioModal.tsx`](file:///d:/cg%20project/components/AudioModal.tsx)
  - Client-Side GIF89a / LZW Encoder: [`lib/gif-encoder.ts`](file:///d:/cg%20project/lib/gif-encoder.ts)
  - Export Modal: [`components/ExportModal.tsx`](file:///d:/cg%20project/components/ExportModal.tsx)
  - Project Schema & Cloud Store: [`lib/cg-project.ts`](file:///d:/cg%20project/lib/cg-project.ts) & [`lib/user-store.ts`](file:///d:/cg%20project/lib/user-store.ts)
  - Creator Profile Dashboard: [`components/ProfileDashboard.tsx`](file:///d:/cg%20project/components/ProfileDashboard.tsx)
