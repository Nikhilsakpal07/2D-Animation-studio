# 🎓 ACADEMIC PROJECT REPORT & VIVA DOCUMENTATION
## 2D Animation Studio & Computer Graphics Laboratory
**Subject:** Computer Graphics & Visualization  
**Platform:** Next.js 16, TypeScript, HTML5 Canvas, Web Audio API, Cloud Firestore  
**Repository:** `Nikhilsakpal07/2D-Animation-studio`  
**Word Document (.docx):** [`PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx`](file:///d:/cg%20project/PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx)  
**Team Structure (4 Members — Equal Feature-Based Distribution):**
1. **Member 1 (Visual Creation & Graphics Lab):** Interactive Graphics Lab, Scenic Backgrounds Studio, Template Library, and Raster Primitives.
2. **Member 2 (Stage Canvas Architecture & Grouping):** Infinite Canvas Navigation, Viewport Transforms, Marquee Selection, and Object Grouping.
3. **Member 3 (3×3 Matrices & Skeletal Rigging):** Live 3×3 Transformation Matrix Inspector, Custom Pivot Points, and Hierarchical Forward Kinematics.
4. **Member 4 (24 FPS Timeline, Audio & Export Pipeline):** 24 FPS Keyframe Sequencer, Procedural Web Audio Engine, Client-Side GIF89a LZW Exporter, and Cloud Dashboard.

---

## 📑 TABLE OF CONTENTS
1. [Abstract](#1-abstract)
2. [Introduction & Problem Statement](#2-introduction--problem-statement)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Mathematical Foundations & Derivations](#4-mathematical-foundations--derivations)
   - 4.1 Digital Differential Analyzer (DDA)
   - 4.2 Bresenham's Integer Line Drawing Algorithm
   - 4.3 Midpoint Circle Algorithm (8-Way Octant Symmetry)
   - 4.4 Midpoint Ellipse Algorithm (Two-Region Slope Analysis)
   - 4.5 Parametric Cubic Bézier Curves
   - 4.6 3×3 Homogeneous Transformation Matrices
   - 4.7 Rotation about an Arbitrary Pivot Point
   - 4.8 Hierarchical Forward Kinematics (Skeletal Rigging)
5. [Feature-Based 4-Member Work Distribution](#5-feature-based-4-member-work-distribution)
6. [Interactive Subsystems Implementation](#6-interactive-subsystems-implementation)
   - 6.1 Infinite Canvas & Affine Viewport Transforms
   - 6.2 24 FPS Keyframe Sequencer & Easing Functions
   - 6.3 Procedural Web Audio Engine & Sound Cues
   - 6.4 Client-Side GIF89a Encoder (3-3-2 RGB Quantization & LZW)
   - 6.5 Cloud Firestore + LocalStorage Dual-Sync
7. [Viva Defense Script & Screen Runbook (4 Members)](#7-viva-defense-script--screen-runbook-4-members)
8. [Comprehensive Viva Cross-Questioning FAQ](#8-comprehensive-viva-cross-questioning-faq)
9. [Conclusion & References](#9-conclusion--references)

---

## 1. ABSTRACT

Modern digital animation software often abstracts away foundational Computer Graphics mathematics. This project presents the **2D Animation Studio & Computer Graphics Laboratory**, an expressive web application built in Next.js 16 and TypeScript that unites academic computer graphics theory with a production-grade digital creation tool.

The application distributes major feature subsystems across four engineering roles:
1. **Visual Creation & Graphics Lab:** An interactive pixel-grid laboratory for DDA, Bresenham, Midpoint Circle/Ellipse, and Bézier curves, alongside scenic animated backdrop generators and pre-rigged template libraries.
2. **Stage Canvas Architecture & Grouping:** An infinite zoom/pan canvas, affine viewport transformation engine, rubber-band marquee selection, and hierarchical object grouping.
3. **3×3 Matrices & Skeletal Rigging:** Live 3×3 homogeneous transformation matrix inspector, custom joint pivot points, and hierarchical Forward Kinematics.
4. **24 FPS Sequencer, Web Audio & Export Pipeline:** A 24 FPS timeline sequencer with non-linear easing mathematics, a zero-dependency procedural Web Audio synthesizer, a native client-side GIF89a LZW encoder, and Firebase Cloud Firestore dual-sync.

---

## 2. INTRODUCTION & PROBLEM STATEMENT

Computer Graphics education typically teaches scan conversion and transformation matrices on paper, while separate animation software acts as a black box. Our project bridges this gap by creating an interactive web studio where **every visual feature is linked directly to visible mathematical feedback**:
- When drawing shapes, the **Graphics Lab** exposes discrete pixel coordinates and integer decision variables.
- When navigating the stage, the **Infinite Canvas** executes 2D affine viewport transformations with inverse mouse-picking.
- When transforming objects, the **Right Inspector** exposes the live 3×3 homogeneous matrix $[M_{ij}]$ numerically.
- When animating, the **Bottom Timeline** executes 24 FPS interpolation with easing physics and procedural audio synthesis.
- When exporting, the **GIF Encoder** performs 3-3-2 RGB quantization and LZW compression entirely in client browser memory.

---

## 3. SYSTEM ARCHITECTURE & DATA FLOW

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|   Header Nav  |  Infinite Stage Canvas  |  Right Matrix Inspector  |  Bottom Timeline |
+-----------------------------------------------------------------------------------+
                                       |
+-----------------------------------------------------------------------------------+
|                        FOUR CORE FEATURE SUBSYSTEMS                               |
|   MEMBER 1: Graphics Lab Modal + Scenic Backgrounds Studio + Template Library     |
|   MEMBER 2: Infinite Stage Canvas + Viewport Engine + Marquee Selection & Grouping |
|   MEMBER 3: Live 3×3 Matrix Inspector + Pivot Joint Picker + Forward Kinematics   |
|   MEMBER 4: 24 FPS Timeline Sequencer + Web Audio Studio + GIF/Video Exporter     |
+-----------------------------------------------------------------------------------+
                                       |
+-----------------------------------------------------------------------------------+
|                        COMPUTER GRAPHICS MATHEMATICAL CORE                        |
|   • Rasterization: DDA, Bresenham, Midpoint Circle/Ellipse, Bézier, Flood Fill    |
|   • 3×3 Homogeneous Matrices: Translation, Rotation, Scale, Shear, Forward Kin.   |
|   • Keyframe Interpolation: Linear, Ease-In, Ease-Out, Cubic, Elastic             |
+-----------------------------------------------------------------------------------+
                                       |
+-----------------------------------------------------------------------------------+
|                         CLIENT ENGINES & COMPRESSION                              |
|   • Canvas 2D Viewport Renderer    • Web Audio Synthesizer (Oscillators/Cues)     |
|   • GIF89a LZW Encoder (3-3-2 RGB) • MediaRecorder Video Stream                   |
+-----------------------------------------------------------------------------------+
                                       |
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE LAYER                                   |
|   • Portable .cgproj JSON Schema   • Cloud Firestore   • LocalStorage Offline Sync |
+-----------------------------------------------------------------------------------+
```

---

## 4. MATHEMATICAL FOUNDATIONS & DERIVATIONS

### 4.1 Digital Differential Analyzer (DDA)
Incremental linear rasterization between $(x_0, y_0)$ and $(x_1, y_1)$:
$$\Delta x = x_1 - x_0, \quad \Delta y = y_1 - y_0, \quad \text{steps} = \max(|\Delta x|, |\Delta y|)$$
$$x_{\text{inc}} = \frac{\Delta x}{\text{steps}}, \quad y_{\text{inc}} = \frac{\Delta y}{\text{steps}}$$
$$x_{i+1} = x_i + x_{\text{inc}}, \quad y_{i+1} = y_i + y_{\text{inc}}$$

### 4.2 Bresenham's Integer Line Drawing Algorithm
Bresenham defines an integer decision variable $err = \Delta x - \Delta y$. By evaluating $2 \times err$, coordinate increments occur purely through integer additions, subtractions, and bit shifts ($err \ll 1$), eliminating floating-point division and rounding.

### 4.3 Midpoint Circle Algorithm (8-Way Octant Symmetry)
Implicit circle function: $f(x, y) = x^2 + y^2 - r^2$.  
Evaluating midpoint $M(x_k + 1, y_k - \frac{1}{2})$ yields initial parameter:
$$p_0 = \frac{5}{4} - r \approx 1 - r \quad (\text{integer arithmetic})$$
If $p_k < 0$, $p_{k+1} = p_k + 2x_{k+1} + 1$. If $p_k \ge 0$, $p_{k+1} = p_k + 2x_{k+1} + 1 - 2y_{k+1}$.  
**8-Way Symmetry:** Plotting $(x, y)$ instantly generates $(\pm x, \pm y)$ and $(\pm y, \pm x)$.

### 4.4 Midpoint Ellipse Algorithm (Two-Region Slope Analysis)
Boundary split at $|\frac{dy}{dx}| = 1$ ($2r_y^2 x = 2r_x^2 y$):
- **Region 1 (slope < 1):** Step along $x$ by $+1$, test $y$. $d1_0 = r_y^2 - r_x^2 r_y + \frac{1}{4} r_x^2$.
- **Region 2 (slope $\ge$ 1):** Step along $y$ by $-1$, test $x$. $d2_0 = r_y^2 (x_0 + \frac{1}{2})^2 + r_x^2 (y_0 - 1)^2 - r_x^2 r_y^2$.

### 4.5 Parametric Cubic Bézier Curves
Defined by four control points $P_0, P_1, P_2, P_3$ via third-degree Bernstein polynomials:
$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$

### 4.6 3×3 Homogeneous Transformation Matrices
Affine translations $[x + t_x, y + t_y]$ cannot be represented in 2×2 matrix multiplication. In 3D projective space $[x, y, 1]^T$:
$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} 1 & 0 & t_x \\ 0 & 1 & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$
Composite matrix: $M = T(t_x, t_y) \times R(\theta) \times Sh(sh_x, sh_y) \times S(s_x, s_y)$.

### 4.7 Rotation about an Arbitrary Pivot Point
To rotate an object around joint $(x_p, y_p)$ rather than world origin:
$$M_{\text{pivot}} = T(x_p, y_p) \times R(\theta) \times T(-x_p, -y_p)$$

### 4.8 Hierarchical Forward Kinematics
Joint chaining for multi-part rigs:
$$M_{\text{world}} = M_{\text{parent}} \times M_{\text{local}}$$

---

## 5. FEATURE-BASED 4-MEMBER WORK DISTRIBUTION

| Member | Website Feature Subsystem | Live Features Demonstrated | Code Modules Owned |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Visual Creation Studio, Graphics Lab & Scenic Backdrops** | • **Interactive Graphics Lab Modal (`CG Algorithms`)**: Pixel raster grid, DDA vs Bresenham comparison, Midpoint Circle/Ellipse visualizer, coordinate output tables.<br>• **Scenic Backgrounds Studio (`Background`)**: Curated animated backdrops (Sunny Meadow, Sunset City, Deep Space, Blueprint Grid, custom CSS gradients).<br>• **Template & Asset Library (`Templates`)**: Pre-rigged character walk cycles, bouncing ball physics templates, scenic backdrops. | `components/GraphicsLabModal.tsx`<br>`components/CustomBackgroundModal.tsx`<br>`components/TemplatesModal.tsx`<br>`lib/cg-engine.ts` (raster) |
| **Member 2** | **Stage Canvas Architecture, Multi-Select & Object Grouping** | • **Infinite Stage Canvas**: Smooth panning (`Spacebar + Drag`), 25%–400% zoom (`Ctrl + Wheel`), Center Reset (`Ctrl + 0`).<br>• **Marquee Rubber-Band Selection**: Multi-select drag box, Shift-click selection.<br>• **Hierarchical Grouping**: Group (`Ctrl + G`), Ungroup (`Ctrl + Shift + G`), dynamic AABB bounding boxes, and layer reordering. | `components/StageCanvas.tsx`<br>`lib/cg-canvas-renderer.ts` |
| **Member 3** | **3×3 Homogeneous Matrices, Transformation Inspector & Rigging** | • **Live 3×3 Transformation Matrix Inspector (`Right Panel`)**: Real-time sliders for Position X/Y, Rotation angle, Scale X/Y, Shear/Skew X/Y updating the live $3\times3$ numeric matrix.<br>• **Joint Pivot Point Picker**: Rotate limbs around elbows/knees/base rather than center.<br>• **Skeletal Rigging (Forward Kinematics)**: Parent-child hierarchy where moving parent moves children automatically. | `components/RightInspector.tsx`<br>`lib/cg-engine.ts` (matrices) |
| **Member 4** | **24 FPS Animation Timeline, Audio Studio & Export Pipeline** | • **24 FPS Keyframe Sequencer (`Bottom Panel`)**: Multi-track timeline, scrubber, play/pause, loop, add/delete keyframes.<br>• **Parametric Easing Curves**: Linear, Ease-In, Ease-Out, Cubic, and Elastic/Bouncy motion curves.<br>• **Procedural Web Audio Engine (`Audio`)**: 100% offline synthesizer presets (Chiptune 8-bit, Lo-Fi, Synthwave), frame-accurate Sound Cues, and live waveform visualizer.<br>• **Client-Side GIF89a & Video Exporter (`Export`)**: Custom GIF89a encoder with 3-3-2 RGB quantization and LZW bitstream compression; MP4/WebM video exports.<br>• **User Profile Dashboard & Cloud Store**: Firebase Auth, Creator Stats, `.cgproj` saves, Cloud Firestore dual-sync. | `components/TimelinePanel.tsx`<br>`components/AudioModal.tsx`<br>`components/ExportModal.tsx`<br>`components/ProfileDashboard.tsx`<br>`lib/audio-engine.ts`<br>`lib/gif-encoder.ts`<br>`lib/cg-project.ts` |

---

## 6. WORD DOCUMENT DETAILS

The formal Word document has been compiled and saved to:  
📄 **[`PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx`](file:///d:/cg%20project/PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx)**

It includes:
- Professional academic cover page and metadata table.
- 4-member feature distribution table with custom header shading.
- Word-by-word time-stamped speaking script for Members 1, 2, 3, and 4.
- Step-by-step screen demonstration runbook.
- 11 technical viva cross-questioning callouts with mathematical proofs.
- Standard 1-inch margins and running page footers.
