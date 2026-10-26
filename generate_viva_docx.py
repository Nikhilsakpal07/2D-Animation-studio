import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import os

def set_cell_background(cell, fill_hex):
    """Sets the background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    """Sets inner margins for a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for margin_name, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(margin_name)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, title, text, border_color="D95D4E", bg_color="FDFBF7"):
    """Adds a stylish callout box with a colored left border."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), '24') # 3pt
    left.set(qn('w:space'), '0')
    left.set(qn('w:color'), border_color)
    tcBorders.append(left)
    
    for side in ['top', 'bottom', 'right']:
        b = OxmlElement(f'w:{side}')
        b.set(qn('w:val'), 'none')
        tcBorders.append(b)
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.bold = True
    run_t.font.name = 'Calibri'
    run_t.font.size = Pt(11)
    run_t.font.color.rgb = RGBColor.from_string(border_color)
    
    run_b = p.add_run(text)
    run_b.font.name = 'Calibri'
    run_b.font.size = Pt(10)
    run_b.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

def generate_word_document(output_path):
    doc = Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("2D Animation Studio • Computer Graphics Viva Documentation")
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    # -------------------------------------------------------------
    # COVER TITLE SECTION
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(30)
    title_p.paragraph_format.space_after = Pt(4)
    run_sub = title_p.add_run("COMPUTER GRAPHICS & VISUALIZATION CAPSTONE PROJECT\n")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(0x7B, 0x6D, 0xAF) # Lavender

    run_main = title_p.add_run("2D Animation Studio & Algorithmic Graphics Laboratory")
    run_main.font.name = 'Calibri'
    run_main.font.size = Pt(26)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D) # Navy

    desc_p = doc.add_paragraph()
    desc_p.paragraph_format.space_before = Pt(6)
    desc_p.paragraph_format.space_after = Pt(20)
    r_desc = desc_p.add_run("A Complete Academic Viva Defense Guide, Feature Breakdown, Live Script & Technical Report for a 4-Member Engineering Team.")
    r_desc.font.name = 'Calibri'
    r_desc.font.size = Pt(12)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    # Meta Table
    meta_table = doc.add_table(rows=2, cols=3)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    meta_headers = ["Platform / Stack", "Repository", "Team Composition"]
    meta_values = ["Next.js 16 • Turbopack • TypeScript", "Nikhilsakpal07/2D-Animation-studio", "4 Members (Feature-Distributed)"]
    
    for col_idx in range(3):
        c0 = meta_table.cell(0, col_idx)
        c0.width = Inches(2.16)
        set_cell_background(c0, "F4EFE6")
        set_cell_margins(c0, 80, 40, 100, 100)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(meta_headers[col_idx])
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(0x66, 0x55, 0x44)

        c1 = meta_table.cell(1, col_idx)
        c1.width = Inches(2.16)
        set_cell_background(c1, "FAF8F5")
        set_cell_margins(c1, 80, 80, 100, 100)
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p1.add_run(meta_values[col_idx])
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # -------------------------------------------------------------
    # 1. 4-MEMBER FEATURE DISTRIBUTION SUMMARY
    # -------------------------------------------------------------
    h1 = doc.add_heading("1. Feature Distribution Matrix (4 Team Members)", level=1)
    h1.runs[0].font.name = 'Calibri'
    h1.runs[0].font.size = Pt(16)
    h1.runs[0].font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_intro = doc.add_paragraph("To ensure equal engineering credit and prevent any member from presenting 'only theory', the project is divided into 4 tangible, full-featured website subsystems. Every member owns real, clickable UI features backed by explicit Computer Graphics mathematics:")
    p_intro.paragraph_format.space_after = Pt(12)

    # 4-Member Table
    dist_table = doc.add_table(rows=5, cols=4)
    dist_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    dist_table.autofit = False

    headers = ["Member & Role", "Subsystem Title", "Live Website Features Demonstrated", "CG Math & Code Modules"]
    col_widths = [Inches(1.2), Inches(1.5), Inches(2.4), Inches(1.4)]

    for c_idx, title in enumerate(headers):
        cell = dist_table.cell(0, c_idx)
        cell.width = col_widths[c_idx]
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    team_data = [
        (
            "Member 1\n(Creation & Lab)",
            "Visual Creation Studio, Graphics Lab & Scenic Backdrops",
            "• Interactive Graphics Lab Modal ('CG Algorithms' button) with live pixel coordinate tables.\n• Scenic Backgrounds Studio ('Background' button) with animated meadow/city/space backdrops.\n• Template Library ('Templates' button) with pre-rigged walk cycles & bouncing ball scenes.",
            "• DDA & Bresenham Line Algorithms\n• Midpoint Circle (8-way symmetry)\n• Midpoint Ellipse (2 regions)\n• Cubic Bézier Curves\n• lib/cg-engine.ts\n• GraphicsLabModal.tsx"
        ),
        (
            "Member 2\n(Canvas & Viewport)",
            "Stage Canvas Architecture, Multi-Select & Object Grouping",
            "• Infinite Stage Canvas: Smooth panning (Spacebar+Drag), continuous zooming 25%–400%, and Center Reset (Ctrl+0).\n• Marquee Selection: Rubber-band drag box & Shift-click multi-select.\n• Hierarchical Grouping: Group (Ctrl+G) and Ungroup (Ctrl+Shift+G) with dynamic bounding boxes.",
            "• Affine Viewport Transforms\n• World-to-Screen Mapping\n• Inverse View Matrices\n• AABB Bounding Box math\n• StageCanvas.tsx\n• cg-canvas-renderer.ts"
        ),
        (
            "Member 3\n(Matrices & Rigging)",
            "3×3 Homogeneous Matrices, Transformation Inspector & Rigging",
            "• Live 3×3 Matrix Inspector (Right Panel): Live numerical display of transformation matrix [M_ij].\n• Interactive Sliders: Drag Position X/Y, Rotation angle, Scale, and Shear (skew).\n• Custom Joint Pivot Picker: Rotate around elbows/base rather than center.\n• Forward Kinematics: Parent-child rigging (arm parented to body).",
            "• 3×3 Homogeneous Coordinates\n• Composite Matrix (T×R×Sh×S)\n• Arbitrary Pivot Rotation (T·R·T⁻¹)\n• Forward Kinematics (M_parent × M_local)\n• RightInspector.tsx"
        ),
        (
            "Member 4\n(Animation & Audio)",
            "24 FPS Timeline Sequencer, Procedural Audio, GIF Export & Cloud",
            "• 24 FPS Keyframe Sequencer (Bottom Panel): Scrubber, play/pause, loop, add/delete keyframes across tracks.\n• Parametric Easing Curves: Linear, Ease-In/Out, Cubic, Elastic/Bouncy.\n• Procedural Web Audio Engine ('Audio' button): 100% offline Chiptune, Lo-Fi, and sound cues with live waveform.\n• Client-Side GIF89a & Video Exporter: In-browser 3-3-2 RGB quantization & LZW compression.\n• User Profile & Cloud Store: Firebase Auth & Cloud Firestore dual-sync.",
            "• 24 FPS Frame Clock (Δt = 41.67ms)\n• Non-Linear Keyframe Easing\n• Web Audio API Oscillator Graph\n• GIF89a LZW Dictionary Encoding\n• TimelinePanel.tsx\n• AudioModal.tsx\n• gif-encoder.ts"
        )
    ]

    for row_idx, data in enumerate(team_data, start=1):
        for col_idx, text in enumerate(data):
            cell = dist_table.cell(row_idx, col_idx)
            cell.width = col_widths[col_idx]
            bg = "FFFFFF" if row_idx % 2 != 0 else "F9F8F6"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 90, 90)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)
            r = p.add_run(text)
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
            if col_idx == 0:
                r.font.bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. WORD-BY-WORD LIVE VIVA PRESENTATION SCRIPT
    # -------------------------------------------------------------
    h2 = doc.add_heading("2. Word-by-Word Live Presentation Script (12–15 Minutes)", level=1)
    h2.runs[0].font.name = 'Calibri'
    h2.runs[0].font.size = Pt(16)
    h2.runs[0].font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    script_acts = [
        (
            "Act 1: Team Introduction (0:00 – 1:30)",
            "Member 1 (or Designated Team Lead)",
            "\"Respected external examiner, professors, and faculty members: Good morning. Today, our team is presenting our Computer Graphics project: the 2D Animation Studio & Algorithmic Graphics Laboratory.\n\n"
            "While most web applications treat canvas drawing and animation as a black box using high-level browser APIs, our objective was to engineer an expressive, production-grade 2D animation workstation whose core features—from drawing a single pixel line to running 24 FPS character animations with live transformation matrices and procedural sound—are directly governed by foundational Computer Graphics mathematics.\n\n"
            "Our team of four divided the architecture into distinct, full-featured subsystems:\n"
            "1. Member 1: The Visual Creation Studio, Graphics Lab & Scenic Backdrops.\n"
            "2. Member 2: The Stage Canvas Architecture, Multi-Object Selection & Grouping.\n"
            "3. Member 3: The 3×3 Homogeneous Matrices, Transformation Inspector & Skeletal Rigging.\n"
            "4. Member 4: The 24 FPS Animation Timeline, Procedural Web Audio, Client-Side GIF Exporter & Cloud Persistence.\n\n"
            "Let us demonstrate each feature live on screen.\""
        ),
        (
            "Act 2: Member 1 — Creation Studio, Graphics Lab & Scenic Backdrops (1:30 – 4:30)",
            "Member 1 (Takes Screen Control)",
            "\"I was responsible for the visual creation features and foundational rasterization engine of the studio.\n\n"
            "1. Feature 1: The Interactive Graphics Lab ('CG Algorithms' button in header)\n"
            "(Action: Member 1 clicks 'CG Algorithms' in header to open modal)\n"
            "When students or creators want to inspect how shapes are rasterized, they open our Interactive Graphics Lab. On screen, notice the discrete pixel grid:\n"
            "• We can select Bresenham’s Line Algorithm or DDA, set coordinates, and observe the line rasterized pixel-by-pixel. Below the grid is the exact table of plotted pixel coordinates (x, y) and decision parameter updates.\n"
            "• Under the hood, I implemented Bresenham’s algorithm in lib/cg-engine.ts using pure integer arithmetic with the error accumulator err = Δx - Δy. By testing 2 × err, pixel steps require only integer additions and bit shifts (err << 1), completely eliminating floating-point rounding latency.\n"
            "• Selecting Midpoint Circle demonstrates 8-way octant symmetry with initial decision variable p0 = 1 - r. Plotting a single point simultaneously generates 8 symmetric points (±x, ±y) and (±y, ±x), reducing computation by 87.5%.\n"
            "• For Midpoint Ellipse, I implemented the two-region slope split (|slope| < 1 in Region 1 vs. |slope| ≥ 1 in Region 2) at the boundary where 2ry²x = 2rx²y.\n"
            "• For smooth curves, I implemented Parametric Cubic Bézier Curves using Bernstein polynomials.\n\n"
            "2. Feature 2: Scenic Backgrounds Studio ('Background' button)\n"
            "(Action: Closes modal, clicks 'Background' in top toolbar)\n"
            "Animations need rich scenic environments. I built the Scenic Backgrounds Studio where users can toggle animated presets like Sunny Meadow, Sunset City, Deep Space, Blueprint Grid, or construct custom multi-stop CSS gradients.\n\n"
            "3. Feature 3: Template & Asset Library ('Templates' button)\n"
            "(Action: Clicks 'Templates')\n"
            "I created starter templates (bouncing balls, pre-rigged character walk cycles) so users can start animating in one click.\n\n"
            "Now, Member 2 will demonstrate the Stage Canvas, infinite pan/zoom, and object grouping.\""
        ),
        (
            "Act 3: Member 2 — Stage Canvas, Infinite Pan/Zoom & Grouping (4:30 – 7:30)",
            "Member 2 (Takes Screen Control)",
            "\"Thank you, Member 1. I developed the interactive stage canvas engine, viewport navigation, and multi-object selection architecture.\n\n"
            "1. Feature 1: Infinite Stage Canvas & Navigation\n"
            "(Action: Member 2 holds Spacebar and pans stage; zooms with Ctrl + Wheel)\n"
            "Our studio provides an Infinite Stage Canvas with smooth panning (Spacebar + Drag or Hand Tool H) and continuous zooming from 25% to 400%. Pressing Ctrl + 0 instantly re-centers the stage ('Fit to Screen').\n"
            "Under the hood, I implemented this as a 2D affine viewport transformation matrix:\n"
            "P_screen = (P_world - Pan) × Zoom\n"
            "When the user clicks anywhere on the canvas, my engine applies the inverse view transformation to map browser screen coordinates back into exact canvas world coordinates for pinpoint object picking.\n\n"
            "2. Feature 2: Marquee Selection & Multi-Select\n"
            "(Action: Member 2 drags a rubber-band marquee box across multiple objects)\n"
            "I built rubber-band marquee drag-selection and Shift-click multi-selection. My algorithm computes the Axis-Aligned Bounding Box (AABB) enclosing all selected objects in real time, rendering intuitive corner scale handles.\n\n"
            "3. Feature 3: Hierarchical Grouping & Management\n"
            "(Action: Presses Ctrl + G to group, then Ctrl + Shift + G to ungroup)\n"
            "Pressing Ctrl + G combines independent objects into a unified group that can be transformed as a single entity, and Ctrl + Shift + G restores individual control. I also implemented layer reordering (bring to front, send to back) and duplicate actions.\n\n"
            "Now, Member 3 will present the 3×3 Homogeneous Matrices, our live Inspector, and Skeletal Rigging.\""
        ),
        (
            "Act 4: Member 3 — 3×3 Homogeneous Matrices, Inspector & Rigging (7:30 – 10:30)",
            "Member 3 (Takes Screen Control)",
            "\"Thank you, Member 2. I was responsible for the linear algebra transformation engine, live matrix inspector, and skeletal forward kinematics.\n\n"
            "1. Feature 1: Live 3×3 Transformation Matrix Inspector (Right Panel)\n"
            "(Action: Member 3 selects an object on stage and points to Right Inspector)\n"
            "Please look at the Right Inspector. Unlike commercial tools that hide the math, our studio computes and displays the full 3×3 Homogeneous Transformation Matrix live on screen:\n"
            "[ M00  M01  M02 ]\n"
            "[ M10  M11  M12 ]\n"
            "[ M20  M21  M22 ]\n"
            "As I drag the Rotation slider, observe cos(θ) and sin(θ) changing live in the matrix! As I adjust Position X and Y, the translation column [tx, ty] updates. As I change Shear (Skew), off-diagonal terms distort the shape into a parallelogram.\n"
            "Why 3×3 matrices? In 2D Cartesian space, translation [x + tx, y + ty] is an affine vector addition that cannot be expressed as a 2×2 matrix multiplication. By mapping 2D points into 3D projective homogeneous coordinates [x, y, 1]ᵀ, translation, rotation, scale, and shear unify into clean composite matrix multiplication: M = T × R × Sh × S.\n\n"
            "2. Feature 2: Custom Joint Pivot Points\n"
            "(Action: Changes Pivot to 'Bottom-Center' and rotates the object)\n"
            "Standard tools only rotate around the center. But in character animation, a limb must rotate around a shoulder, elbow, or base pivot (xp, yp). I implemented arbitrary pivot rotation:\n"
            "M_pivot = T(xp, yp) × R(θ) × T(-xp, -yp)\n"
            "Translating the pivot to origin, rotating, and translating back.\n\n"
            "3. Feature 3: Skeletal Rigging (Forward Kinematics)\n"
            "(Action: Shows Arm parented to Body; rotates Body to show Arm moving)\n"
            "I built an articulated parent-child rigging hierarchy. By multiplying matrices down the tree: M_world = M_parent × M_local, rotating the torso automatically moves the attached limbs without manual trigonometry.\n\n"
            "Now, Member 4 will demonstrate our 24 FPS Timeline, Procedural Audio, and Client-Side GIF Exporter.\""
        ),
        (
            "Act 5: Member 4 — 24 FPS Timeline, Audio Sequencer, GIF Export & Cloud (10:30 – 13:30)",
            "Member 4 (Takes Screen Control)",
            "\"Thank you, Member 3. I developed the animation sequencer, procedural sound engine, client-side export pipeline, and cloud persistence.\n\n"
            "1. Feature 1: 24 FPS Keyframe Sequencer (Bottom Panel)\n"
            "(Action: Member 4 hits Play / Spacebar on timeline)\n"
            "Film and professional animation run at locked 24 frames per second (Δt ≈ 41.67 ms). Creators can scrub the timeline, add keyframes across multiple tracks, and loop playback.\n"
            "Instead of robotic linear movement, I implemented parametric Easing Curves: Ease-In (quadratic/cubic acceleration), Ease-Out (gentle deceleration), and Elastic/Bouncy curves that simulate physical gravity and bounce.\n"
            "I also built Sequential Transform Blocks ('Move to Target', 'Rotate 360', 'Scale Up') that chain animations sequentially across frames.\n\n"
            "2. Feature 2: Procedural Web Audio Engine & Sound Cues ('Audio' button)\n"
            "(Action: Clicks 'Audio', triggers sound cues)\n"
            "Audio makes animation expressive. I built a 100% offline Web Audio synthesizer using the browser's native AudioContext:\n"
            "• Synthesizes three procedural background music genres: 8-bit Chiptune, Cozy Lo-Fi, and Cinematic Synth using multi-oscillator waveforms and gain envelopes.\n"
            "• Frame-Accurate Sound Cues: 'Whoosh' (bandpass noise sweep), 'Jump/Boing' (pitch glide 150 to 450 Hz), 'Pop', and 'Car Horn' placed on specific frames.\n"
            "• Notice the live audio waveform visualizer dancing above the timeline tracks!\n\n"
            "3. Feature 3: Client-Side GIF89a & Video Exporter ('Export' button)\n"
            "(Action: Clicks 'Export Animation')\n"
            "Instead of relying on Python/FFmpeg servers, I wrote a native TypeScript GIF89a encoder:\n"
            "• Extracts canvas pixel buffers at 24 FPS.\n"
            "• Performs 3-3-2 RGB Color Quantization (24-bit TrueColor to 8-bit, 256-color palette).\n"
            "• Builds Netscape 2.0 loop blocks and compresses pixel streams using the LZW (Lempel-Ziv-Welch) variable-length dictionary algorithm, generating a downloadable .gif directly in browser memory!\n"
            "• Also supports MP4/WebM video recording and PNG frame sequence zip exports.\n\n"
            "4. Feature 4: User Profile Dashboard & Cloud Store\n"
            "(Action: Clicks User Profile in top right)\n"
            "I integrated Firebase Authentication, Creator Profile stats (animations saved, action blocks), portable .cgproj JSON schema, and Cloud Firestore + LocalStorage dual-sync for offline reliability.\n\n"
            "We are now ready for your questions.\""
        ),
        (
            "Act 6: Team Conclusion (13:30 – 14:30)",
            "All Members",
            "\"To conclude: every feature in our 2D Animation Studio proves that theoretical Computer Graphics algorithms and practical modern web engineering can build an inspiring, production-ready workstation.\n\n"
            "Thank you, and we welcome your questions!\""
        )
    ]

    for title, speaker, content in script_acts:
        doc.add_heading(title, level=2)
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_before = Pt(2)
        p_sp.paragraph_format.space_after = Pt(4)
        r_sp = p_sp.add_run(f"🎤 {speaker}")
        r_sp.bold = True
        r_sp.font.size = Pt(10.5)
        r_sp.font.color.rgb = RGBColor(0xD9, 0x5D, 0x4E)

        p_co = doc.add_paragraph(content)
        p_co.paragraph_format.line_spacing = 1.15
        p_co.paragraph_format.space_after = Pt(12)
        for run in p_co.runs:
            run.font.size = Pt(10)

    doc.add_page_break()

    # -------------------------------------------------------------
    # 3. STEP-BY-STEP LIVE DEMO RUNBOOK
    # -------------------------------------------------------------
    h3 = doc.add_heading("3. Step-by-Step Screen Demonstration Runbook", level=1)
    h3.runs[0].font.name = 'Calibri'
    h3.runs[0].font.size = Pt(16)
    h3.runs[0].font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    runbook_steps = [
        ("MEMBER 1: Visual Creation & Graphics Lab", [
            "Open http://localhost:3000 in browser.",
            "Click 'CG Algorithms' in header nav -> Select Bresenham's Line -> Point to pixel grid & coordinates table.",
            "Select Midpoint Circle -> Explain 8-way octant symmetry and p0 = 1 - r.",
            "Select Midpoint Ellipse -> Point to Region 1 vs Region 2 slope boundary.",
            "Close modal -> Click 'Background' -> Toggle Sunny Meadow, Sunset City, and Deep Space.",
            "Click 'Templates' -> Show pre-built character rig and bouncing ball physics scenes."
        ]),
        ("MEMBER 2: Stage Canvas, Viewport Pan/Zoom & Grouping", [
            "On main canvas: Hold Spacebar and pan the stage freely.",
            "Zoom in/out with Ctrl + Mouse Wheel (show 25% to 400% zoom range).",
            "Press Ctrl + 0 to demonstrate instant 'Fit to Screen' centering.",
            "Drag rubber-band marquee selection box over multiple objects.",
            "Press Ctrl + G to group objects into dynamic bounding box -> Press Ctrl + Shift + G to ungroup."
        ]),
        ("MEMBER 3: 3×3 Matrices, Live Inspector & Rigging", [
            "Click any character/object on canvas -> Direct attention to Right Inspector panel.",
            "Show the live 3×3 Homogeneous Transformation Matrix display [M_ij].",
            "Drag Rotation slider: watch cos(θ) and sin(θ) update live in the matrix grid!",
            "Drag Position X/Y and Shear sliders: show translation column [tx, ty] and skew distortion.",
            "Change Pivot preset to 'Bottom-Center' -> Rotate object to show it swinging around base joint.",
            "Show parent-child rigging hierarchy (Arm linked to Body -> rotating Body moves Arm)."
        ]),
        ("MEMBER 4: 24 FPS Timeline, Audio, GIF Export & Dashboard", [
            "Direct attention to Bottom Timeline -> Hit Play (Spacebar) to run 24 FPS playback.",
            "Select an object on timeline -> Demonstrate Easing Curve dropdown (Linear vs Elastic/Bouncy).",
            "Click 'Audio' in header -> Play synthesized Chiptune/Lo-Fi music presets and trigger sound cues ('Jump', 'Whoosh').",
            "Point to live audio waveform visualization above timeline tracks.",
            "Click 'Export Animation' -> Demonstrate client-side animated GIF export (explain 3-3-2 RGB & LZW).",
            "Click User Profile in top-right -> Display creator statistics, activity feed, and saved .cgproj gallery."
        ])
    ]

    for member_sec, steps in runbook_steps:
        doc.add_heading(member_sec, level=2)
        for s in steps:
            p = doc.add_paragraph(f"✓  {s}", style='List Bullet')
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(2)

    doc.add_page_break()

    # -------------------------------------------------------------
    # 4. PROFESSOR CROSS-QUESTIONING FAQ & MATHEMATICAL PROOFS
    # -------------------------------------------------------------
    h4 = doc.add_heading("4. Professor Cross-Questioning FAQ & Mathematical Proofs", level=1)
    h4.runs[0].font.name = 'Calibri'
    h4.runs[0].font.size = Pt(16)
    h4.runs[0].font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    faq_items = [
        # Member 1
        ("MEMBER 1: Why is Bresenham's Line Algorithm faster than DDA?",
         "DDA relies on floating-point arithmetic because slope m = Δy / Δx is fractional, requiring float additions and round() calls at every pixel. Bresenham reformulates the line equation into pure integer calculations by multiplying by 2Δx. The error decision parameter err = Δx - Δy requires only integer additions, subtractions, and bitwise shifts (2 × err = err << 1), completely eliminating floating-point latency.",
         "D95D4E"),
        ("MEMBER 1: Derive the initial decision parameter for Midpoint Circle (p0 = 1 - r).",
         "Implicit circle equation is f(x, y) = x² + y² - r². At step (xk, yk), candidate pixels are E(xk+1, yk) and SE(xk+1, yk-1). Midpoint is M(xk+1, yk - 0.5). Evaluating decision variable pk = f(M) for initial point (0, r): p0 = f(1, r - 0.5) = 1² + (r - 0.5)² - r² = 1 + r² - r + 0.25 - r² = 5/4 - r. For integer arithmetic, 5/4 is rounded to 1, giving p0 = 1 - r.",
         "D95D4E"),
        ("MEMBER 1: Why is Midpoint Ellipse split into two regions?",
         "Because an ellipse has varying curvature where tangent slope changes from 0 to -∞. In Region 1, |slope| < 1, so x changes faster than y; we step x by +1 and test whether to decrement y. The boundary occurs where tangent slope is -1 (2ry²x = 2rx²y). In Region 2, |slope| ≥ 1, so y drops faster; we decrement y by -1 and test whether to increment x. Splitting prevents gaps along steep curves.",
         "D95D4E"),

        # Member 2
        ("MEMBER 2: How does your canvas handle Viewport Pan and Zoom transformations?",
         "Pan and zoom represent a 2D affine viewing transformation from World Coordinates to Viewport Screen Coordinates: [x_screen, y_screen, 1]ᵀ = [s 0 tx; 0 s ty; 0 0 1] [x_world, y_world, 1]ᵀ, where s is zoom and (tx, ty) is pan offset. When the user clicks on canvas, my engine applies the inverse view matrix M_view⁻¹: P_world = (P_screen - Pan) / Zoom, ensuring exact mouse picking at any zoom level.",
         "7B6DAF"),
        ("MEMBER 2: How does Marquee Selection calculate bounding boxes for grouped objects?",
         "When multiple objects are selected, my engine computes the global Axis-Aligned Bounding Box (AABB): minX = min(obj.x), maxX = max(obj.x + obj.w), minY = min(obj.y), maxY = max(obj.y + obj.h). When grouped via Ctrl+G, child coordinates are normalized relative to this group origin, and transforming the group applies a composite matrix to all child elements.",
         "7B6DAF"),

        # Member 3
        ("MEMBER 3: Why are 3×3 matrices required for 2D transformations instead of 2×2?",
         "In 2D Cartesian space, linear transformations (rotation, scaling) can be written as 2×2 matrices. But translation is an affine vector addition: [x', y'] = [x + tx, y + ty]. Addition cannot be expressed via 2×2 matrix multiplication! By lifting 2D coordinates into 3D Projective Homogeneous Coordinates [x, y, 1]ᵀ, translation becomes a linear matrix multiplication. This enables matrix concatenation: M = T × R × Sh × S.",
         "3B827E"),
        ("MEMBER 3: How does rotation around an arbitrary pivot point work mathematically?",
         "Basic rotation R(θ) only rotates around the origin (0, 0). To rotate around a custom joint pivot (xp, yp), my engine applies three composite matrices: (1) Translate pivot to origin: T(-xp, -yp), (2) Rotate by θ: R(θ), (3) Translate origin back to pivot: T(xp, yp). In composite form: M_pivot = T(xp, yp) × R(θ) × T(-xp, -yp).",
         "3B827E"),
        ("MEMBER 3: Explain Forward Kinematics in your skeletal rigging hierarchy.",
         "Every limb stores a parentId. When calculating world position, my engine recursively traverses the tree: M_world(child) = M_world(parent) × M_local(child). The local matrix contains the joint rotation around the limb pivot. When the parent rotates, its world matrix changes, automatically cascading to all descendant limbs without manual trigonometry.",
         "3B827E"),

        # Member 4
        ("MEMBER 4: How does 24 FPS keyframe interpolation calculate intermediate values?",
         "Animation runs at locked 24 FPS (Δt = 1000/24 ≈ 41.67 ms). For current frame f between keyframe A (frame fA) and keyframe B (frame fB), normalized time progress is t = (f - fA) / (fB - fA) ∈ [0, 1]. An easing function e(t) is applied (Ease-Out: 1 - (1-t)³, or Elastic damped harmonic oscillator). The property value is: V(f) = VA + e(t) · (VB - VA).",
         "F5B941"),
        ("MEMBER 4: How does your client-side GIF encoder work without FFmpeg or a backend?",
         "My TypeScript GIF89a encoder: (1) Extracts raw canvas pixel buffers (Uint8ClampedArray) at 24 FPS. (2) Performs 3-3-2 RGB Color Quantization to map 24-bit TrueColor to an 8-bit, 256-color Global Color Table. (3) Writes GIF89a headers with Netscape 2.0 loop extension for infinite playback. (4) Compresses pixel index sequences using the LZW variable bit-width dictionary algorithm, packing codewords (9 to 12 bits) into byte sub-blocks directly in browser memory.",
         "F5B941"),
        ("MEMBER 4: How does your Web Audio synthesizer operate completely offline?",
         "It uses the browser's native AudioContext without external audio files. It constructs real-time audio graphs with OscillatorNode sources (square, saw, triangle, sine) and shapes volume/filter envelopes using GainNode and BiquadFilterNode. For cues like 'Jump/Boing', it modulates oscillator frequency from 150 to 450 Hz using linearRampToValueAtTime.",
         "F5B941")
    ]

    for q_title, q_ans, border_hex in faq_items:
        add_callout(doc, q_title, q_ans, border_color=border_hex)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Save document
    doc.save(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    out_dir = r"d:\cg project"
    docx_file = os.path.join(out_dir, "PROJECT_VIVA_DOCUMENTATION_4_MEMBERS.docx")
    generate_word_document(docx_file)
