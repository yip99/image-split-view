
import * as icons from './icons.js';
import { addZoomPan } from './preview.js';

const dropZone = document.querySelector('html');
const imagesContainer = document.querySelector('.images-container');

if (!imagesContainer) {
    throw new Error('Missing .images-container element in index.html');
}

const imageItems = new Map();

let nextImageId = 0;
let compareAId = null;
let compareBId = null;
let comparisonOverlay = null;
let comparisonCleanup = null;
let comparisonZoompan = null;

// --------------------------------------------------
// Generic button helper
// --------------------------------------------------

function createButton(className, label, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);
    return button;
}

// --------------------------------------------------
// Comparison selection
// --------------------------------------------------

function selectForComparison(id, slot) {
    if (!imageItems.has(id)) return;

    const selectedId = slot === 'A' ? compareAId : compareBId;

    // Clicking the active A/B button deselects that image.
    if (selectedId === id) {
        deselectComparisonSlot(slot);
        return;
    }

    if (slot === 'A') {
        compareAId = id;
        if (compareBId === id) compareBId = null;
    } else {
        compareBId = id;
        if (compareAId === id) compareAId = null;
    }

    updateCompareControls();

    // Selecting both images automatically enters comparison mode.
    if (compareAId !== null && compareBId !== null) {
        openComparison();
    } else {
        closeComparison();
    }
}

function deselectComparisonSlot(slot) {
    if (slot === 'A') {
        compareAId = null;
    } else if (slot === 'B') {
        compareBId = null;
    }

    // Deselecting either side exits comparison mode.
    closeComparison();
    updateCompareControls();
}

function updateCompareControls() {
    for (const item of imageItems.values()) {
        const isA = item.id === compareAId;
        const isB = item.id === compareBId;

        item.container.classList.toggle('is-compare-a', isA);
        item.container.classList.toggle('is-compare-b', isB);
        item.compareAButton.classList.toggle('is-selected', isA);
        item.compareBButton.classList.toggle('is-selected', isB);
    }
}

// --------------------------------------------------
// Comparison mode
// --------------------------------------------------

function openComparison() {
    const imageA = imageItems.get(compareAId);
    const imageB = imageItems.get(compareBId);

    if (!imageA || !imageB || compareAId === compareBId) return;

    // Keep the current overlay if the selected pair has not changed.
    if (
        comparisonOverlay &&
        comparisonOverlay.dataset.imageA === String(compareAId) &&
        comparisonOverlay.dataset.imageB === String(compareBId)
    ) {
        return;
    }

    closeComparison();

    const overlay = document.createElement('div');
    overlay.className = 'comparison-overlay';
    overlay.dataset.imageA = String(compareAId);
    overlay.dataset.imageB = String(compareBId);

    const stage = document.createElement('div');
    stage.className = 'comparison-stage';

    // A shared wrapper allows both images to use the same transformation.
    const comparisonImages = document.createElement('div');
    comparisonImages.className = 'comparison-images';

    // B is the background image.
    const underImage = document.createElement('img');
    underImage.className = 'comparison-image compare-image-under';
    underImage.src = imageB.src;
    underImage.alt = `Comparison image B: ${imageB.name}`;
    underImage.draggable = false;

    // A is the foreground image.
    const topImage = document.createElement('img');
    topImage.className = 'comparison-image compare-image-top';
    topImage.src = imageA.src;
    topImage.alt = `Comparison image A: ${imageA.name}`;
    topImage.draggable = false;

    comparisonImages.append(underImage, topImage);

    // Build one combined toolbar using the existing image controls.
    const {
        controls,
        zoom1to1Button,
        rotateCCWButton,
        rotateCWButton,
        flipXButton,
        flipYButton,
        resetButton,
        compareAButton,
        compareBButton,
        removeButton
    } = createControlElement();

    // The comparison toolbar does not need an image removal button.
    removeButton.remove();

    controls.classList.add('comparison-controls');

    // Both images are selected while comparison mode is active.
    compareAButton.classList.add('is-selected');
    compareBButton.classList.add('is-selected');

    stage.append(comparisonImages, controls);
    overlay.appendChild(stage);
    document.body.appendChild(overlay);

    comparisonOverlay = overlay;

    // Apply transformations to the shared wrapper so both images
    // always remain aligned.
    comparisonZoompan = addZoomPan({
        container: stage,
        image: comparisonImages
    });

    // Combined transformation controls.
    zoom1to1Button.addEventListener('click', () => {
        comparisonZoompan?.zoom1to1();
    });

    rotateCCWButton.addEventListener('click', () => {
        comparisonZoompan?.rotateCCW();
    });

    rotateCWButton.addEventListener('click', () => {
        comparisonZoompan?.rotateCW();
    });

    flipXButton.addEventListener('click', () => {
        comparisonZoompan?.flip('x');
    });

    flipYButton.addEventListener('click', () => {
        comparisonZoompan?.flip('y');
    });

    resetButton.addEventListener('click', () => {
        comparisonZoompan?.reset();
    });

    // Clicking a selected A/B button deselects that image and exits.
    compareAButton.addEventListener('click', () => {
        deselectComparisonSlot('A');
    });

    compareBButton.addEventListener('click', () => {
        deselectComparisonSlot('B');
    });

    // Holding the pointer over the image area reveals B.
    // Clicking the controls must not trigger the reveal action.
    const onPointerDown = event => {
        if (event.target.closest('.comparison-controls')) return;

        if (event.pointerType === 'mouse' && event.button !== 0) return;

        event.preventDefault();
        overlay.classList.add('show-under');
    };

    const onPointerEnd = () => {
        overlay.classList.remove('show-under');
    };

    const onWindowBlur = () => {
        overlay.classList.remove('show-under');
    };

    const onKeyDown = event => {
        if (event.key === 'Escape') closeComparison();
    };

    stage.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerEnd);
    document.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('keydown', onKeyDown);

    comparisonCleanup = () => {
        stage.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('pointerup', onPointerEnd);
        document.removeEventListener('pointercancel', onPointerEnd);
        window.removeEventListener('blur', onWindowBlur);
        document.removeEventListener('keydown', onKeyDown);
    };
}

function closeComparison() {
    if (!comparisonOverlay) return;

    comparisonCleanup?.();
    comparisonCleanup = null;

    comparisonZoompan?.destroy();
    comparisonZoompan = null;

    comparisonOverlay.remove();
    comparisonOverlay = null;
}

// --------------------------------------------------
// Image removal
// --------------------------------------------------

function removeImage(id) {
    const item = imageItems.get(id);
    if (!item) return;

    if (compareAId === id) compareAId = null;
    if (compareBId === id) compareBId = null;

    // A removed image cannot remain in an active comparison.
    if (!compareAId || !compareBId) closeComparison();

    item.zoompan?.destroy();
    item.container.remove();
    imageItems.delete(id);

    if (item.revokeOnRemove) {
        URL.revokeObjectURL(item.src);
    }

    updateCompareControls();
}

// --------------------------------------------------
// Per-image controls
// --------------------------------------------------

function createControlElement() {
    const controls = document.createElement('div');
    controls.className = 'controls';

    const zoom1to1Button = createButton(
        'toggle-full', '', 'Zoom to 1:1 (fit scale)'
    );
    zoom1to1Button.appendChild(icons.zoom1to1());

    const rotateCCWButton = createButton(
        'rotate-ccw', '', 'Rotate counterclockwise'
    );
    rotateCCWButton.appendChild(icons.rotateCCW());

    const rotateCWButton = createButton(
        'rotate-cw', '', 'Rotate clockwise'
    );
    rotateCWButton.appendChild(icons.rotateCW());

    const flipXButton = createButton(
        'flip-x', '', 'Flip horizontally'
    );
    flipXButton.appendChild(icons.flipX());

    const flipYButton = createButton(
        'flip-y', '', 'Flip vertically'
    );
    flipYButton.appendChild(icons.flipY());

    const resetButton = createButton(
        'reset', '', 'Reset image orientation, zoom and position'
    );
    resetButton.appendChild(icons.reset());

    const compareAButton = createButton(
        'compare-a', 'A', 'Select or deselect as comparison image A'
    );

    const compareBButton = createButton(
        'compare-b', 'B', 'Select or deselect as comparison image B'
    );

    const removeButton = createButton(
        'remove-image', '×', 'Remove image'
    );

    controls.append(
        zoom1to1Button,
        rotateCCWButton,
        rotateCWButton,
        flipXButton,
        flipYButton,
        resetButton,
        compareAButton,
        compareBButton,
        removeButton
    );

    return {
        controls,
        zoom1to1Button,
        rotateCCWButton,
        rotateCWButton,
        flipXButton,
        flipYButton,
        resetButton,
        compareAButton,
        compareBButton,
        removeButton
    };
}

function createImageElement(src, name, revokeOnRemove = false) {
    const id = ++nextImageId;

    const {
        controls,
        zoom1to1Button,
        rotateCCWButton,
        rotateCWButton,
        flipXButton,
        flipYButton,
        resetButton,
        compareAButton,
        compareBButton,
        removeButton
    } = createControlElement();

    const container = document.createElement('div');
    container.className = 'image-container f-panzoom';

    const image = document.createElement('img');
    image.draggable = false;
    image.alt = name;
    image.className = 'f-panzoom__content';

    container.append(controls, image);
    imagesContainer.appendChild(container);

    const item = {
        id,
        name,
        src,
        container,
        image,
        zoompan: null,
        revokeOnRemove,
        compareAButton,
        compareBButton
    };

    imageItems.set(id, item);

    image.addEventListener('load', () => {
        if (!imageItems.has(id)) return;

        item.zoompan = addZoomPan({ container, image });
    }, { once: true });

    image.addEventListener('error', () => {
        container.classList.add('image-load-error');
        console.error(`Unable to load image: ${name}`, src);
    }, { once: true });

    zoom1to1Button.addEventListener('click', () => item.zoompan?.zoom1to1());
    rotateCCWButton.addEventListener('click', () => item.zoompan?.rotateCCW());
    rotateCWButton.addEventListener('click', () => item.zoompan?.rotateCW());
    flipXButton.addEventListener('click', () => item.zoompan?.flip('x'));
    flipYButton.addEventListener('click', () => item.zoompan?.flip('y'));
    resetButton.addEventListener('click', () => item.zoompan?.reset());

    compareAButton.addEventListener('click', () => selectForComparison(id, 'A'));
    compareBButton.addEventListener('click', () => selectForComparison(id, 'B'));
    removeButton.addEventListener('click', () => removeImage(id));

    // Assign src after registering load/error handlers.
    image.src = src;

    return item;
}

// --------------------------------------------------
// Add images from files, clipboard or URLs
// --------------------------------------------------

function isImageFile(file) {
    return Boolean(
        file &&
        typeof file.type === 'string' &&
        file.type.startsWith('image/')
    );
}

function appendImage({ files = [], images = [] } = {}) {
    for (const file of files) {
        if (!isImageFile(file)) continue;

        const src = URL.createObjectURL(file);
        createImageElement(src, file.name || 'Uploaded image', true);
    }

    for (const image of images) {
        if (!image?.src) continue;
        createImageElement(image.src, image.alt || 'Pasted image', false);
    }

    updateCompareControls();
}

function getImageURL(text) {
    if (!text) return null;

    const candidate = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => line && !line.startsWith('#'));

    if (!candidate) return null;

    try {
        const url = new URL(candidate);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.href;
    } catch {
        return null;
    }
}

function appendImageFromURL(text) {
    const url = getImageURL(text);
    if (!url) return;

    let name = 'Pasted image';

    try {
        name = decodeURIComponent(new URL(url).pathname.split('/').pop()) || name;
    } catch {
        // Keep the fallback name for malformed or encoded paths.
    }

    createImageElement(url, name, false);
    updateCompareControls();
}

// --------------------------------------------------
// Drag and drop
// --------------------------------------------------

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        event.stopPropagation();

        dropZone.classList.add('dragover');
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    });
});

['dragleave', 'dragend', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('dragover');
    });
});

dropZone.addEventListener('drop', event => {
    const transfer = event.dataTransfer;
    if (!transfer) return;

    const files = Array.from(transfer.files || []).filter(isImageFile);

    if (files.length) {
        appendImage({ files });
    }

    const uri = transfer.getData('text/uri-list');
    if (!files.length && uri) appendImageFromURL(uri);
});

// --------------------------------------------------
// Clipboard paste
// --------------------------------------------------

document.addEventListener('paste', event => {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files = Array.from(items)
        .filter(isImageFile)
        .map(item => item.getAsFile())
        .filter(Boolean);

    if (files.length) appendImage({ files });

    const text = event.clipboardData?.getData('text/plain');
    if (!files.length && text) appendImageFromURL(text);
});
