# photoshop-resize

A Photoshop ExtendScript that exports Instagram-ready layout composites from your PSD files. Supports single images, stacked doubles, and 2×2 grids — in portrait (3:4, 4:5) and square formats — with automatic orientation detection, crop position control, and optional sharpening.

---

## Installation

### Step 1 — Download the script

**Option A: Clone the repo**
```bash
git clone https://github.com/SamuelJon17/photoshop-resize.git
```

**Option B: Download the file directly**

1. Open [userScript_layouts_v21.jsx](userScript_layouts_v21.jsx) in GitHub
2. Click the **Download raw file** button (top-right of the file view)
3. Save the `.jsx` file anywhere on your computer

---

### Step 2 — Add the script to Photoshop

Copy `userScript_layouts_v21.jsx` into Photoshop's **Scripts** folder so it appears in the menu permanently.

| Platform | Scripts folder path |
|---|---|
| **Mac** | `/Applications/Adobe Photoshop [version]/Presets/Scripts/` |
| **Windows** | `C:\Program Files\Adobe\Adobe Photoshop [version]\Presets\Scripts\` |

After copying, **restart Photoshop**. The script will appear under **File > Scripts > userScript_layouts_v21**.

> You only need to do this once. After that, it's always available from the menu without browsing for the file.

---

## Running the script

### From the Scripts menu (after installation)

**File > Scripts > userScript_layouts_v21**

### Without installing (one-off)

**File > Scripts > Browse...** → navigate to wherever you saved the `.jsx` file → click **Open**

---

## Usage

When you run the script a dialog appears with the following options:

### Canvas

Choose the output dimensions:

| Option | Size |
|---|---|
| 3:4 | 1440 × 1920 px |
| 4:5 | 1440 × 1800 px |
| Square | 1440 × 1440 px |

### Layout mode

| Mode | What it does |
|---|---|
| **Single (Auto)** | Detects orientation per image — vertical images are width-fit with crop control; horizontal images are letterboxed |
| **Double Horizontal** | Pairs two landscape photos stacked top/bottom in one canvas |
| **2×2 Grid** | Groups four portrait photos into a 2-column grid |

**Double Horizontal** requires landscape (wider-than-tall) images. Verticals are skipped with a warning.  
**2×2 Grid** requires portrait (taller-than-wide) images. Horizontals are skipped with a warning. Groups must be in multiples of 4.

### Single Auto options

**Vertical crop position** — only applies to vertical source images. Sets where to anchor the crop when the image is taller than the canvas slot.

- `0` = anchor top (overflow cut from bottom)
- `50` = center (default)
- `100` = anchor bottom (overflow cut from top)

### Square options

| Fit mode | Behavior |
|---|---|
| **Fit inside** | Whole image fits within the square — white space fills the remainder |
| **Fill** | Fills the full slot, clipping the overflow axis |

When **Fill** is selected, a **Position** field controls crop placement (0 = top/left, 50 = center, 100 = bottom/right).

### Input source

- **Select files manually** — opens a file picker (multi-select supported); select images in the order you want them placed
- **Process entire folder** — scans a folder for `.psd` files and processes all of them

For **Double Horizontal**, select files in pairs: top, bottom, top, bottom...  
For **2×2 Grid**, select files in groups of 4: top-left, top-right, bottom-left, bottom-right...

### Save location

- **Same folder as source files** — output JPEGs are saved next to each source file
- **Choose output folder** — prompts for a destination folder

### Other options

| Option | Default | Description |
|---|---|---|
| White border | 20 px | Padding between image and canvas edge |
| Sharpen for screen | Off | Applies a light Unsharp Mask (25 / 0.5 / 0) before export |
| Close after export | Off | Closes the canvas document after saving |

---

## Output files

Files are exported as JPEG at 100% quality, sRGB, no embedded profile. The output filename is based on the source filename with a suffix indicating the layout and ratio:

| Layout | Example output filename |
|---|---|
| Single vertical | `photo_layoutSingle_3x4.jpg` |
| Single horizontal | `photo_layoutHorizontal_4x5.jpg` |
| Square | `photo_layoutSquare_1440.jpg` |
| Double horizontal | `photo_layoutDouble_3x4.jpg` |
| 2×2 Grid | `photo_layoutGrid_4x5.jpg` |

---

## Requirements

- Adobe Photoshop (any version with ExtendScript support — CS6 through current)
- Source files can be PSD, JPEG, PNG, TIFF, or any format Photoshop can open
- When using **Process entire folder**, only `.psd` files are picked up automatically
