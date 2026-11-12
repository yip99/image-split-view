const DEFAULT_TRANSFORMATION = {
    translateX: 0,
    translateY: 0,
    scale: 1,
    flipX: 1,
    flipY: 1,
    rotation: 0
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const getLinearMatrix = ({ scale, flipX, flipY, rotation }) => {
    const radians = rotation * Math.PI / 180;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);

    // Remove floating-point noise at 90-degree increments.
    if (Math.abs(cos) < 1e-10) cos = 0;
    if (Math.abs(sin) < 1e-10) sin = 0;

    return {
        a: scale * cos * flipX,
        b: scale * sin * flipX,
        c: -scale * sin * flipY,
        d: scale * cos * flipY
    };
};

const getMatrix = transform => {
    const { a, b, c, d } = getLinearMatrix(transform);
    return `matrix(${a}, ${b}, ${c}, ${d}, ${transform.translateX}, ${transform.translateY})`;
};

const getNewScale = (deltaScale, state) => {
    const { scale } = state.transform;
    const sensitivity = state.scaleSensitivity;
    return clamp(
        scale + deltaScale / (sensitivity / scale),
        state.minScale,
        state.maxScale
    );
};

const getRotatedBounds = state => {
    const { scale, rotation } = state.transform;
    const radians = rotation * Math.PI / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const width = state.element.offsetWidth;
    const height = state.element.offsetHeight;

    return {
        width: (width * cos + height * sin) * scale,
        height: (height * cos + width * sin) * scale
    };
};

const clampTranslation = state => {
    const bounds = getRotatedBounds(state);
    const containerWidth = state.container.clientWidth;
    const containerHeight = state.container.clientHeight;

    const maxX = Math.max(0, (bounds.width - containerWidth) / 2);
    const maxY = Math.max(0, (bounds.height - containerHeight) / 2);

    state.transform.translateX = clamp(
        state.transform.translateX,
        -maxX,
        maxX
    );

    state.transform.translateY = clamp(
        state.transform.translateY,
        -maxY,
        maxY
    );
};

const render = state => {
    clampTranslation(state);

    // Every operation uses the same center origin, so rotation, zoom and flips compose.
    state.element.style.transformOrigin = '50% 50%';
    state.element.style.transform = getMatrix(state.transform);
};

const scheduleRender = state => {
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => render(state));
    } else {
        render(state);
    }
};

const pan = (state, deltaX, deltaY) => {
    state.transform.translateX += deltaX;
    state.transform.translateY += deltaY;
    scheduleRender(state);
};

// Zoom around a screen point while retaining the point under the pointer.
const zoomAroundPoint = (state, { newScale, x, y, deltaX = 0, deltaY = 0 }) => {
    const transform = state.transform;
    const oldScale = transform.scale;
    const factor = newScale / oldScale;
    const rect = state.element.getBoundingClientRect();

    // The transformed bounding rectangle's center is the visual image center.
    // Subtract translation to recover the untransformed layout center.
    const centerX = rect.left + rect.width / 2 - transform.translateX;
    const centerY = rect.top + rect.height / 2 - transform.translateY;

    transform.translateX =
        factor * transform.translateX +
        (1 - factor) * (x - centerX) + deltaX;

    transform.translateY =
        factor * transform.translateY +
        (1 - factor) * (y - centerY) + deltaY;

    transform.scale = newScale;
    scheduleRender(state);
};

const rotate = (state, degrees) => {
    state.transform.rotation =
        ((state.transform.rotation + degrees) % 360 + 360) % 360;
    scheduleRender(state);
};

const flip = (state, axis) => {
    if (axis === 'x') {
        state.transform.flipX *= -1;
    } else if (axis === 'y') {
        state.transform.flipY *= -1;
    } else {
        throw new TypeError(`Unknown flip axis: ${axis}`);
    }

    scheduleRender(state);
};

export const renderer = ({
    minScale = 1,
    maxScale = 4,
    element,
    container,
    scaleSensitivity = 20
}) => {
    if (!element || !container) {
        throw new TypeError('renderer requires both an image element and a container');
    }

    const state = {
        element,
        container,
        minScale,
        maxScale,
        scaleSensitivity,
        transform: { ...DEFAULT_TRANSFORMATION }
    };

    const zoomTo = ({ newScale, x, y }) => {
        const safeScale = clamp(newScale, state.minScale, state.maxScale);
        zoomAroundPoint(state, { newScale: safeScale, x, y });
    };

    return {
        panBy: ({ originX = 0, originY = 0 }) => pan(state, originX, originY),

        panTo: ({ originX = 0, originY = 0, scale = state.transform.scale }) => {
            state.transform.scale = clamp(scale, state.minScale, state.maxScale);
            state.transform.translateX = originX;
            state.transform.translateY = originY;
            scheduleRender(state);
        },

        zoomPan: ({ scale, x, y, deltaX = 0, deltaY = 0 }) => {
            const newScale = clamp(scale, state.minScale, state.maxScale);
            zoomAroundPoint(state, { newScale, x, y, deltaX, deltaY });
        },

        zoom: ({ x, y, deltaScale }) => {
            zoomAroundPoint(state, {
                newScale: getNewScale(deltaScale, state),
                x,
                y
            });
        },

        zoomTo,
        rotate: degrees => rotate(state, degrees),
        flip: axis => flip(state, axis),

        getScale: () => state.transform.scale,
        getState: () => state,

        reset: () => {
            state.transform = { ...DEFAULT_TRANSFORMATION };
            scheduleRender(state);
        }
    };
};