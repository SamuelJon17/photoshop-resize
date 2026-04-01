// userScript_layouts_v21.jsx
// Photoshop ExtendScript — Instagram layout export tool
// Run via File > Scripts > Browse...
//
// Aspect ratio options (non-square):
//   3:4  — 1440x1920  (new Instagram grid, optimal for desktop upload)
//   4:5  — 1440x1800  (classic portrait, still widely used)
// Square: always 1440x1440

app.preferences.rulerUnits = Units.PIXELS;

var CANVAS_RES    = 72;   // PPI — screen only, ignored by Instagram
var USM_AMOUNT    = 25;
var USM_RADIUS    = 0.5;
var USM_THRESHOLD = 0;

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

function showDialog() {
    var dlg = new Window("dialog", "Export Layout");
    dlg.orientation = "column";
    dlg.alignChildren = ["left", "top"];
    dlg.spacing = 12;
    dlg.margins = 18;

    // -- Canvas type (top row: 3:4 / 4:5 / Square) --
    dlg.add("statictext", undefined, "Canvas:");
    var canvasTypeGroup = dlg.add("group");
    canvasTypeGroup.orientation = "row";
    canvasTypeGroup.spacing = 20;
    var a1 = canvasTypeGroup.add("radiobutton", undefined, "3:4  --  1440 x 1920");
    var a2 = canvasTypeGroup.add("radiobutton", undefined, "4:5  --  1440 x 1800");
    var aS = canvasTypeGroup.add("radiobutton", undefined, "Square  --  1440 x 1440");
    a1.value = true;

    var selectedRatio  = "3:4";
    var selectedMode   = "single_auto";

    dlg.add("panel").alignment = "fill";

    // -- Layout mode (disabled when Square selected) --
    dlg.add("statictext", undefined, "Layout mode:");
    var layoutSection = dlg.add("group");
    layoutSection.orientation = "column";
    layoutSection.alignChildren = ["left", "top"];
    layoutSection.spacing = 4;

    var modeGroup = layoutSection.add("group");
    modeGroup.orientation = "column";
    modeGroup.alignChildren = ["left", "top"];
    modeGroup.spacing = 6;
    var r0 = modeGroup.add("radiobutton", undefined, "Single (Auto)  --  detects horizontal/vertical per image");
    // DEPRECATED: r1 (single_vertical) and r2 (single_horizontal) removed from GUI but code preserved below
    // var r1 = modeGroup.add("radiobutton", undefined, "Single Vertical  --  fills canvas (cover crop)");
    // var r2 = modeGroup.add("radiobutton", undefined, "Single Horizontal  --  letterboxed in canvas");
    var r3 = modeGroup.add("radiobutton", undefined, "Double Horizontal  --  2 landscape photos stacked");
    var r4 = modeGroup.add("radiobutton", undefined, "2x2 Grid  --  4 photos");
    r0.value = true;

    r0.onClick = function() {
        selectedMode = "single_auto";
        singleAutoPanel.enabled = true;
    };
    r3.onClick = function() {
        selectedMode = "double_horizontal";
        singleAutoPanel.enabled = false;
    };
    r4.onClick = function() {
        selectedMode = "quad_grid";
        singleAutoPanel.enabled = false;
    };

    dlg.add("panel").alignment = "fill";

    // -- Single Auto options panel (enabled only when Single Auto + non-square) --
    var singleAutoPanel = dlg.add("panel", undefined, "Single Auto options");
    singleAutoPanel.orientation = "column";
    singleAutoPanel.alignChildren = ["left", "top"];
    singleAutoPanel.spacing = 8;
    singleAutoPanel.margins = 12;
    singleAutoPanel.enabled = true;

    var offsetGroup = singleAutoPanel.add("group");
    offsetGroup.orientation = "row";
    offsetGroup.spacing = 8;
    offsetGroup.alignChildren = ["left", "center"];
    offsetGroup.add("statictext", undefined, "Vertical crop position (0=top  50=center  100=bottom):");
    var offsetInput = offsetGroup.add("edittext", undefined, "50");
    offsetInput.preferredSize.width = 40;
    offsetGroup.add("statictext", undefined, "%");

    dlg.add("panel").alignment = "fill";

    // -- Square options panel (enabled only when Square canvas selected) --
    var squarePanel = dlg.add("panel", undefined, "Square options");
    squarePanel.orientation = "column";
    squarePanel.alignChildren = ["left", "top"];
    squarePanel.spacing = 8;
    squarePanel.margins = 12;
    squarePanel.enabled = false;

    squarePanel.add("statictext", undefined, "Fit mode:");
    var sqFitGroup = squarePanel.add("group");
    sqFitGroup.orientation = "column";
    sqFitGroup.spacing = 4;
    var sqF1 = sqFitGroup.add("radiobutton", undefined, "Fit inside  --  whole image fits, white space fills remainder");
    var sqF2 = sqFitGroup.add("radiobutton", undefined, "Fill  --  fills width (vertical) or height (horizontal), clips other axis");
    sqF1.value = true;

    var selectedSqFit = "fit_inside";
    sqF1.onClick = function() { selectedSqFit = "fit_inside"; sqPosGroup.enabled = false; };
    sqF2.onClick = function() { selectedSqFit = "fill";       sqPosGroup.enabled = true;  };

    var sqPosGroup = squarePanel.add("group");
    sqPosGroup.orientation = "row";
    sqPosGroup.spacing = 8;
    sqPosGroup.alignChildren = ["left", "center"];
    sqPosGroup.enabled = false;
    sqPosGroup.add("statictext", undefined, "Position (0=top/left  50=center  100=bottom/right):");
    var sqPosInput = sqPosGroup.add("edittext", undefined, "50");
    sqPosInput.preferredSize.width = 40;
    sqPosGroup.add("statictext", undefined, "%");

    dlg.add("panel").alignment = "fill";

    // -- Canvas type onClick handlers (defined after panels exist) --
    a1.onClick = function() {
        selectedRatio = "3:4";
        layoutSection.enabled  = true;
        singleAutoPanel.enabled = (selectedMode === "single_auto");
        squarePanel.enabled    = false;
    };
    a2.onClick = function() {
        selectedRatio = "4:5";
        layoutSection.enabled  = true;
        singleAutoPanel.enabled = (selectedMode === "single_auto");
        squarePanel.enabled    = false;
    };
    aS.onClick = function() {
        selectedRatio = "square";
        layoutSection.enabled  = false;
        singleAutoPanel.enabled = false;
        squarePanel.enabled    = true;
    };

    // -- Input source --
    dlg.add("statictext", undefined, "Input source:");
    var srcGroup = dlg.add("group");
    srcGroup.orientation = "column";
    srcGroup.alignChildren = ["left", "top"];
    srcGroup.spacing = 6;
    var s1 = srcGroup.add("radiobutton", undefined, "Select files manually");
    var s2 = srcGroup.add("radiobutton", undefined, "Process entire folder (PSD files only)");
    s1.value = true;

    var selectedSource = "manual";
    s1.onClick = function() { selectedSource = "manual"; };
    s2.onClick = function() { selectedSource = "folder"; };

    dlg.add("panel").alignment = "fill";

    // -- Save location --
    dlg.add("statictext", undefined, "Save location:");
    var saveGroup = dlg.add("group");
    saveGroup.orientation = "column";
    saveGroup.alignChildren = ["left", "top"];
    saveGroup.spacing = 6;
    var v1 = saveGroup.add("radiobutton", undefined, "Same folder as source files");
    var v2 = saveGroup.add("radiobutton", undefined, "Choose output folder...");
    v1.value = true;

    var selectedSave = "source";
    v1.onClick = function() { selectedSave = "source"; };
    v2.onClick = function() { selectedSave = "choose"; };

    dlg.add("panel").alignment = "fill";

    // -- Options: border + sharpening + close --
    var optRow = dlg.add("group");
    optRow.orientation = "row";
    optRow.spacing = 20;
    optRow.alignChildren = ["left", "center"];

    var borderGroup = optRow.add("group");
    borderGroup.add("statictext", undefined, "White border (px):");
    var borderInput = borderGroup.add("edittext", undefined, "20");
    borderInput.preferredSize.width = 50;

    var sharpenCheck = optRow.add("checkbox", undefined, "Sharpen for screen");
    sharpenCheck.value = false;

    var closeCheck = optRow.add("checkbox", undefined, "Close after export");
    closeCheck.value = false;

    // -- Buttons --
    var btnGroup = dlg.add("group");
    btnGroup.alignment = "right";
    btnGroup.spacing = 8;
    var cancelBtn = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });
    var runBtn    = btnGroup.add("button", undefined, "Run",    { name: "ok"     });

    cancelBtn.onClick = function() { dlg.close(0); };
    runBtn.onClick    = function() { dlg.close(1); };

    if (dlg.show() !== 1) return null;

    var border = parseInt(borderInput.text, 10);
    if (isNaN(border) || border < 0) border = 20;

    var vertOffset = parseFloat(offsetInput.text);
    if (isNaN(vertOffset)) vertOffset = 50;
    if (vertOffset < 0)    vertOffset = 0;
    if (vertOffset > 100)  vertOffset = 100;

    var sqPos = parseFloat(sqPosInput.text);
    if (isNaN(sqPos)) sqPos = 50;
    if (sqPos < 0)    sqPos = 0;
    if (sqPos > 100)  sqPos = 100;

    // Resolve canvas dimensions
    var canvasW, canvasH, resolvedMode;
    if (selectedRatio === "square") {
        canvasW = 1440; canvasH = 1440;
        resolvedMode = "square";
    } else {
        canvasW = 1440;
        canvasH = (selectedRatio === "4:5") ? 1800 : 1920;
        resolvedMode = selectedMode;
    }

    return {
        mode:        resolvedMode,
        source:      selectedSource,
        save:        selectedSave,
        border:      border,
        sharpen:     sharpenCheck.value,
        closeCanvas: closeCheck.value,
        canvasW:     canvasW,
        canvasH:     canvasH,
        ratio:       selectedRatio,
        vertOffset:  vertOffset,
        sqFit:       selectedSqFit,
        sqPos:       sqPos
    };
}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeFiles(result) {
    if (!result) return [];
    if (result instanceof Array) return result;
    return [result];
}

function createCanvas(w, h, name) {
    return app.documents.add(w, h, CANVAS_RES, name, NewDocumentMode.RGB, DocumentFill.WHITE);
}

function bringLayerToCanvas(file, canvas) {
    var src = app.open(file);
    src.flatten();
    src.activeLayer.duplicate(canvas, ElementPlacement.PLACEATBEGINNING);
    src.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = canvas;
    return canvas.layers[0];
}

// Standard place: cover fills slot, fit letterboxes.
function placeAndFit(layer, canvas, x, y, w, h, mode) {
    canvas.activeLayer = layer;

    var bounds = layer.bounds;
    var lw = bounds[2].value - bounds[0].value;
    var lh = bounds[3].value - bounds[1].value;

    var scale = (mode === "fit")
        ? Math.min(w / lw, h / lh) * 100
        : Math.max(w / lw, h / lh) * 100;

    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    bounds = layer.bounds;
    var lcx = bounds[0].value + (bounds[2].value - bounds[0].value) / 2;
    var lcy = bounds[1].value + (bounds[3].value - bounds[1].value) / 2;
    layer.translate((x + w / 2) - lcx, (y + h / 2) - lcy);

    canvas.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    canvas.selection.invert();
    canvas.activeLayer = layer;
    canvas.selection.clear();
    canvas.selection.deselect();
}

// Width-fit a vertical image, apply vertical position offset before clipping.
// offsetPct: 0=anchored top (overflow cut from bottom), 100=anchored bottom (overflow cut from top)
// Formula inverted so 0=top, 100=bottom matches user mental model.
function placeAndFitVertical(layer, canvas, x, y, w, h, offsetPct) {
    canvas.activeLayer = layer;

    var bounds = layer.bounds;
    var lw = bounds[2].value - bounds[0].value;

    // Scale so image width exactly fills slot width — sides never cropped
    var scale = (w / lw) * 100;
    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    bounds = layer.bounds;
    var newLw = bounds[2].value - bounds[0].value;
    var newLh = bounds[3].value - bounds[1].value;

    var overflow = newLh - h;

    var targetY;
    if (overflow <= 0) {
        // No overflow — center vertically, offset irrelevant
        targetY = y + (h - newLh) / 2;
    } else {
        // 0=top anchor (subtract 0 from y), 100=bottom anchor (subtract full overflow)
        // Inverted: targetY = y - overflow * (1 - offsetPct/100) would be old 0=bottom
        // We want 0=top so: targetY = y - overflow * (offsetPct / 100)
        // But flipped from original: 0 means top of image at top border
        targetY = y - (overflow * (offsetPct / 100));
    }

    var targetX = x + (w - newLw) / 2;
    layer.translate(targetX - bounds[0].value, targetY - bounds[1].value);

    canvas.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    canvas.selection.invert();
    canvas.activeLayer = layer;
    canvas.selection.clear();
    canvas.selection.deselect();
}

// Height-fit a horizontal image, apply horizontal position offset before clipping.
// offsetPct: 0=anchored left, 100=anchored right
function placeAndFitHorizontal(layer, canvas, x, y, w, h, offsetPct) {
    canvas.activeLayer = layer;

    var bounds = layer.bounds;
    var lh = bounds[3].value - bounds[1].value;

    // Scale so image height exactly fills slot height — top/bottom never cropped
    var scale = (h / lh) * 100;
    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    bounds = layer.bounds;
    var newLw = bounds[2].value - bounds[0].value;
    var newLh = bounds[3].value - bounds[1].value;

    var overflow = newLw - w;

    var targetX;
    if (overflow <= 0) {
        targetX = x + (w - newLw) / 2;
    } else {
        targetX = x - (overflow * (offsetPct / 100));
    }

    var targetY = y + (h - newLh) / 2;
    layer.translate(targetX - bounds[0].value, targetY - bounds[1].value);

    canvas.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    canvas.selection.invert();
    canvas.activeLayer = layer;
    canvas.selection.clear();
    canvas.selection.deselect();
}

// applyUnsharpMask is unreliable across PS versions — drive via executeAction.
function sharpenLayer(layer, canvas) {
    canvas.activeLayer = layer;

    var desc = new ActionDescriptor();
    desc.putUnitDouble(charIDToTypeID("Amnt"), charIDToTypeID("#Prc"), USM_AMOUNT);
    desc.putUnitDouble(charIDToTypeID("Rds "), charIDToTypeID("#Pxl"), USM_RADIUS);
    desc.putInteger(charIDToTypeID("Thsh"),                             USM_THRESHOLD);
    executeAction(stringIDToTypeID("unsharpMask"), desc, DialogModes.NO);
}

function exportJPEG(canvas, outputFolder, filename, closeAfterExport) {
    var folder = new Folder(outputFolder);
    if (!folder.exists) folder.create();

    var outputFile = new File(outputFolder + filename);

    var saveOptions = new ExportOptionsSaveForWeb();
    saveOptions.format = SaveDocumentType.JPEG;
    saveOptions.includeProfile = false;
    saveOptions.interlaced = false;
    saveOptions.optimized = true;
    saveOptions.quality = 100;
    saveOptions.blur = 0;
    saveOptions.convertToSRGB = true;

    canvas.exportDocument(outputFile, ExportType.SAVEFORWEB, saveOptions);
    if (closeAfterExport) canvas.close(SaveOptions.DONOTSAVECHANGES);
}

function resolveOutputFolder(sourceFile, customFolder) {
    if (customFolder) return customFolder;
    return sourceFile.parent.fsName + "/";
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

function processSingleFile(file, config) {
    var B            = config.border;
    var CW           = config.canvasW;
    var CH           = config.canvasH;
    var src          = app.open(file);
    src.flatten();
    var srcW         = src.width.value;
    var srcH         = src.height.value;
    var baseName     = file.name.replace(/\.[^\.]+$/, "");
    var outputFolder = resolveOutputFolder(file, config.customFolder);

    var fitMode    = config.fitMode;
    var suffix     = config.suffix;
    var isVertical = false;

    if (fitMode === "auto") {
        if (srcW >= srcH) {
            fitMode = "fit";
            suffix  = "_layoutHorizontal_" + config.ratio.replace(":", "x");
        } else {
            fitMode    = "cover";
            suffix     = "_layoutSingle_" + config.ratio.replace(":", "x");
            isVertical = true;
        }
    } else if (fitMode === "cover") {
        isVertical = (srcH > srcW);
    }

    var canvas = createCanvas(CW, CH, baseName + "_canvas");
    app.activeDocument = src;
    src.activeLayer.duplicate(canvas, ElementPlacement.PLACEATBEGINNING);
    src.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = canvas;

    var layer = canvas.layers[0];

    // Vertical: width-fit with vertical position control
    // Horizontal: standard letterbox fit
    if (isVertical) {
        placeAndFitVertical(layer, canvas, B, B, CW - 2 * B, CH - 2 * B, config.vertOffset);
    } else {
        placeAndFit(layer, canvas, B, B, CW - 2 * B, CH - 2 * B, fitMode);
    }
    if (config.sharpen) sharpenLayer(layer, canvas);

    exportJPEG(canvas, outputFolder, baseName + suffix + ".jpg", config.closeCanvas);
}

function batchSingle(files, config) {
    for (var i = 0; i < files.length; i++) {
        try {
            processSingleFile(files[i], config);
        } catch (e) {
            alert("Error processing: " + files[i].name + "\n" + e.message);
        }
    }
}

// Square layout — auto-detects orientation and applies fit or fill accordingly.
function processSquareFile(file, config) {
    var B            = config.border;
    var SQ           = 1440;
    var src          = app.open(file);
    src.flatten();
    var srcW         = src.width.value;
    var srcH         = src.height.value;
    var baseName     = file.name.replace(/\.[^\.]+$/, "");
    var outputFolder = resolveOutputFolder(file, config.customFolder);

    var canvas = createCanvas(SQ, SQ, baseName + "_canvas");
    app.activeDocument = src;
    src.activeLayer.duplicate(canvas, ElementPlacement.PLACEATBEGINNING);
    src.close(SaveOptions.DONOTSAVECHANGES);
    app.activeDocument = canvas;

    var layer   = canvas.layers[0];
    var slotW   = SQ - 2 * B;
    var slotH   = SQ - 2 * B;
    var isVert  = srcH > srcW;
    var isHoriz = srcW > srcH;
    // isSquare: srcW === srcH — fit_inside and fill are equivalent, use fit

    if (config.sqFit === "fit_inside" || (!isVert && !isHoriz)) {
        // Shrink whole image to fit within square slot — no clipping
        placeAndFit(layer, canvas, B, B, slotW, slotH, "fit");
    } else if (isVert) {
        // Vertical source + fill: width-fit, vertical position control
        placeAndFitVertical(layer, canvas, B, B, slotW, slotH, config.sqPos);
    } else {
        // Horizontal source + fill: height-fit, horizontal position control
        placeAndFitHorizontal(layer, canvas, B, B, slotW, slotH, config.sqPos);
    }

    if (config.sharpen) sharpenLayer(layer, canvas);
    exportJPEG(canvas, outputFolder, baseName + "_layoutSquare_1440.jpg", config.closeCanvas);
}

function batchSquare(files, config) {
    for (var i = 0; i < files.length; i++) {
        try {
            processSquareFile(files[i], config);
        } catch (e) {
            alert("Error processing: " + files[i].name + "\n" + e.message);
        }
    }
}

function batchDoubleHorizontal(files, config) {
    var B      = config.border;
    var W      = config.canvasW;
    var H      = config.canvasH;
    var photoW = W - 2 * B;
    var slotH  = Math.floor((H - 3 * B) / 2);

    // Filter out verticals before pairing
    var skippedDouble  = [];
    var landscapeFiles = [];
    for (var f = 0; f < files.length; f++) {
        var chk  = app.open(files[f]);
        var vert = chk.height.value > chk.width.value;
        chk.close(SaveOptions.DONOTSAVECHANGES);
        if (vert) { skippedDouble.push(files[f].name); }
        else       { landscapeFiles.push(files[f]); }
    }

    for (var i = 0; i + 1 < landscapeFiles.length; i += 2) {
        try {
            var baseName     = landscapeFiles[i].name.replace(/\.[^\.]+$/, "");
            var outputFolder = resolveOutputFolder(landscapeFiles[i], config.customFolder);

            var src0 = app.open(landscapeFiles[i]);
            src0.flatten();

            var canvas = createCanvas(W, H, baseName + "_canvas");
            app.activeDocument = src0;
            src0.activeLayer.duplicate(canvas, ElementPlacement.PLACEATBEGINNING);
            src0.close(SaveOptions.DONOTSAVECHANGES);
            app.activeDocument = canvas;

            var layer1 = canvas.layers[0];
            placeAndFit(layer1, canvas, B, B, photoW, slotH, "cover");
            if (config.sharpen) sharpenLayer(layer1, canvas);

            var layer2 = bringLayerToCanvas(landscapeFiles[i + 1], canvas);
            placeAndFit(layer2, canvas, B, B + slotH + B, photoW, slotH, "cover");
            if (config.sharpen) sharpenLayer(layer2, canvas);

            exportJPEG(canvas, outputFolder, baseName + "_layoutDouble_" + config.ratio.replace(":", "x") + ".jpg", config.closeCanvas);
        } catch (e) {
            alert("Error in double horizontal (pair " + (Math.floor(i/2) + 1) + "): " + e.message);
        }
    }

    if (landscapeFiles.length % 2 !== 0) {
        alert("Note: " + landscapeFiles[landscapeFiles.length - 1].name + " was skipped (no pair — odd number of landscape files).");
    }
    if (skippedDouble.length > 0) {
        alert("Skipped (vertical images not allowed in Double Horizontal):\n" + skippedDouble.join("\n"));
    }
}

function batchQuadGrid(files, config) {
    var B    = config.border;
    var W    = config.canvasW;
    var H    = config.canvasH;
    var colW = Math.floor((W - 3 * B) / 2);
    var rowH = Math.floor((H - 3 * B) / 2);

    var cells = [
        [B,        B,        colW, rowH],
        [B*2+colW, B,        colW, rowH],
        [B,        B*2+rowH, colW, rowH],
        [B*2+colW, B*2+rowH, colW, rowH]
    ];

    // Filter out horizontals before grouping
    var skippedQuad   = [];
    var portraitFiles = [];
    for (var f = 0; f < files.length; f++) {
        var chk   = app.open(files[f]);
        var horiz = chk.width.value >= chk.height.value;
        chk.close(SaveOptions.DONOTSAVECHANGES);
        if (horiz) { skippedQuad.push(files[f].name); }
        else        { portraitFiles.push(files[f]); }
    }

    for (var i = 0; i + 3 < portraitFiles.length; i += 4) {
        try {
            var baseName     = portraitFiles[i].name.replace(/\.[^\.]+$/, "");
            var outputFolder = resolveOutputFolder(portraitFiles[i], config.customFolder);

            var src0 = app.open(portraitFiles[i]);
            src0.flatten();

            var canvas = createCanvas(W, H, baseName + "_canvas");
            app.activeDocument = src0;
            src0.activeLayer.duplicate(canvas, ElementPlacement.PLACEATBEGINNING);
            src0.close(SaveOptions.DONOTSAVECHANGES);
            app.activeDocument = canvas;

            var c0     = cells[0];
            var layer0 = canvas.layers[0];
            placeAndFit(layer0, canvas, c0[0], c0[1], c0[2], c0[3], "cover");
            if (config.sharpen) sharpenLayer(layer0, canvas);

            for (var j = 1; j < 4; j++) {
                var layer = bringLayerToCanvas(portraitFiles[i + j], canvas);
                var c = cells[j];
                placeAndFit(layer, canvas, c[0], c[1], c[2], c[3], "cover");
                if (config.sharpen) sharpenLayer(layer, canvas);
            }

            exportJPEG(canvas, outputFolder, baseName + "_layoutGrid_" + config.ratio.replace(":", "x") + ".jpg", config.closeCanvas);
        } catch (e) {
            alert("Error in quad grid (group " + (Math.floor(i/4) + 1) + "): " + e.message);
        }
    }

    var remainder = portraitFiles.length % 4;
    if (remainder !== 0) {
        alert("Note: " + remainder + " portrait file(s) were skipped (incomplete group of 4).");
    }
    if (skippedQuad.length > 0) {
        alert("Skipped (horizontal images not allowed in 2x2 Grid):\n" + skippedQuad.join("\n"));
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

var config = showDialog();
if (config) {

    // -- Gather files --
    var files = [];
    if (config.source === "folder") {
        var inputFolder = Folder.selectDialog("Select folder containing PSD files");
        if (inputFolder) {
            var found = inputFolder.getFiles(/\.(psd)$/i);
            if (!found || found.length === 0) {
                alert("No PSD files found in selected folder.");
            } else {
                files = found;
            }
        }
    } else {
        var minFiles;
        if      (config.mode === "double_horizontal") { minFiles = 2; }
        else if (config.mode === "quad_grid")         { minFiles = 4; }
        else                                          { minFiles = 1; }

        var filePrompt;
        if      (config.mode === "double_horizontal") { filePrompt = "Select images in order (pairs: top, bottom, top, bottom...)"; }
        else if (config.mode === "quad_grid")         { filePrompt = "Select images in order (groups of 4: TL, TR, BL, BR...)"; }
        else                                          { filePrompt = "Select photos to export"; }

        var rawSelection = File.openDialog(filePrompt, undefined, true);
        files = normalizeFiles(rawSelection);

        if (files.length > 0 && files.length < minFiles) {
            alert("Not enough images. Need at least " + minFiles + ", got " + files.length + ".");
            files = [];
        }
    }

    // -- Resolve output folder --
    var customFolder = null;
    if (files.length > 0 && config.save === "choose") {
        var outFolder = Folder.selectDialog("Select output folder");
        if (!outFolder) {
            alert("No output folder selected. Saving next to source files instead.");
        } else {
            customFolder = outFolder.fsName + "/";
        }
    }
    config.customFolder = customFolder;

    // -- Run --
    if (files.length > 0) {
        if (config.mode === "single_auto") {
            config.fitMode = "auto";
            config.suffix  = "";
            batchSingle(files, config);
        } else if (config.mode === "square") {
            batchSquare(files, config);
        } else if (config.mode === "double_horizontal") {
            batchDoubleHorizontal(files, config);
        } else if (config.mode === "quad_grid") {
            batchQuadGrid(files, config);
        }
        // DEPRECATED cases preserved below for reference:
        // } else if (config.mode === "single_vertical") {
        //     config.fitMode = "cover";
        //     config.suffix  = "_layoutSingle_" + config.ratio.replace(":", "x");
        //     batchSingle(files, config);
        // } else if (config.mode === "single_horizontal") {
        //     config.fitMode = "fit";
        //     config.suffix  = "_layoutHorizontal_" + config.ratio.replace(":", "x");
        //     batchSingle(files, config);
        // }
    }
}
