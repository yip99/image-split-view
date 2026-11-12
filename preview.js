import { renderer } from './renderer.js';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_TIME = 185;

const stateIs = (state, ...states) => states.includes(state);

const getPinchDistance = event => Math.hypot(
    event.touches[0].pageX - event.touches[1].pageX,
    event.touches[0].pageY - event.touches[1].pageY
);

const getMidPoint = event => ({
    x: (event.touches[0].pageX + event.touches[1].pageX) / 2,
    y: (event.touches[0].pageY + event.touches[1].pageY) / 2
});

const onDoubleTap = ({ instance, scale, x, y }) => {
    if (scale < MAX_SCALE) {
        instance.zoomTo({ newScale: MAX_SCALE, x, y });
        return MAX_SCALE;
    }

    instance.reset();
    return MIN_SCALE;
};

export const addZoomPan = ({ container, image }) => {
    let state = 'idle';
    let scaleValue = MIN_SCALE;
    let lastTapTime = 0;
    let deviceHasTouch = false;
    let wheelTimeout = null;
    let mouseDownOnImage = false;
    let destroyed = false;

    const currentScale = () => scaleValue;

    const setCurrentScale = value => {
        scaleValue = value;
        container.style.cursor = value === MIN_SCALE ? 'zoom-in' : 'move';
    };

    const start = {
        x: 0,
        y: 0,
        distance: 0,
        touches: []
    };

    const instance = renderer({
        container,
        minScale: MIN_SCALE,
        maxScale: MAX_SCALE,
        element: image,
        scaleSensitivity: 20
    });

    const onStart = event => {
        deviceHasTouch = true;

        if (stateIs(state, 'multiGesture')) return;

        const touchCount = event.touches.length;

        if (touchCount === 2 && stateIs(state, 'idle', 'singleGesture')) {
            const { x, y } = getMidPoint(event);

            start.x = x;
            start.y = y;
            start.distance = getPinchDistance(event) / currentScale();
            start.touches = [event.touches[0], event.touches[1]];

            lastTapTime = 0;
            state = 'multiGesture';
            return;
        }

        if (touchCount !== 1) {
            state = 'idle';
            return;
        }

        state = 'singleGesture';
        const [touch] = event.touches;
        start.x = touch.pageX;
        start.y = touch.pageY;
        start.distance = 0;
        start.touches = [touch];
    };

    const onMove = event => {
        if (stateIs(state, 'idle')) return;

        const touchCount = event.touches.length;

        if (stateIs(state, 'multiGesture') && touchCount === 2) {
            event.preventDefault();

            const scale = getPinchDistance(event) / start.distance;
            const { x, y } = getMidPoint(event);

            instance.zoomPan({
                scale,
                x,
                y,
                deltaX: x - start.x,
                deltaY: y - start.y
            });

            start.x = x;
            start.y = y;
            return;
        }

        if (
            !stateIs(state, 'singleGesture') ||
            touchCount !== 1 ||
            event.touches[0]?.identifier !== start.touches[0]?.identifier
        ) {
            return;
        }

        event.preventDefault();

        const [touch] = event.touches;
        const deltaX = touch.pageX - start.x;
        const deltaY = touch.pageY - start.y;

        instance.panBy({ originX: deltaX, originY: deltaY });

        start.x = touch.pageX;
        start.y = touch.pageY;
    };

    const onEndTouch = event => {
        if (stateIs(state, 'idle') || event.touches.length !== 0) return;

        const currentTime = Date.now();
        const tapLength = currentTime - lastTapTime;

        if (tapLength < DOUBLE_TAP_TIME && tapLength > 0) {
            event.preventDefault();
            const [touch] = event.changedTouches;

            if (touch) {
                setCurrentScale(onDoubleTap({
                    instance,
                    scale: currentScale(),
                    x: touch.clientX,
                    y: touch.clientY
                }));
            }
        }

        lastTapTime = currentTime;
        setCurrentScale(instance.getScale());
        state = 'idle';
    };

    const onWheel = event => {
        if (deviceHasTouch) return;

        event.preventDefault();
        instance.zoom({
            deltaScale: Math.sign(event.deltaY) > 0 ? -1 : 1,
            x: event.clientX,
            y: event.clientY
        });

        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            setCurrentScale(instance.getScale());
        }, 100);
    };

    const onMouseDown = event => {
        if (event.button !== 0) return;
        mouseDownOnImage = true;
    };

    const onMouseMove = event => {
        if (deviceHasTouch || event.buttons !== 1 || !mouseDownOnImage) return;
        if (event.movementX === 0 && event.movementY === 0) return;

        event.preventDefault();
        state = 'mouse';
        instance.panBy({
            originX: event.movementX,
            originY: event.movementY
        });
    };

    const onMouseEnd = () => {
        if (deviceHasTouch) return;
        state = 'idle';
        setCurrentScale(instance.getScale());
    };

    const onMouseUp = event => {
        if (deviceHasTouch || event.button !== 0) return;

        if (!stateIs(state, 'mouse') && mouseDownOnImage) {
            setCurrentScale(onDoubleTap({
                instance,
                scale: currentScale(),
                x: event.clientX,
                y: event.clientY
            }));
        }

        onMouseEnd();
        mouseDownOnImage = false;
    };

    container.addEventListener('touchstart', onStart, { passive: false });
    container.addEventListener('touchmove', onMove, { passive: false });
    container.addEventListener('touchend', onEndTouch, { passive: false });
    container.addEventListener('touchcancel', onEndTouch, { passive: false });

    image.addEventListener('mousedown', onMouseDown);
    document.body.addEventListener('mousemove', onMouseMove, { passive: false });
    document.body.addEventListener('mouseup', onMouseUp, { passive: false });
    container.addEventListener('mouseleave', onMouseEnd);
    container.addEventListener('wheel', onWheel, { passive: false });

    const reset = () => {
        state = 'idle';
        setCurrentScale(MIN_SCALE);
        lastTapTime = 0;
        start.x = 0;
        start.y = 0;
        start.distance = 0;
        start.touches = [];
        instance.reset();
    };

    const zoom1to1 = () => {
        const rect = image.getBoundingClientRect();
        instance.zoomTo({
            newScale: MIN_SCALE,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
        setCurrentScale(MIN_SCALE);
    };

    const destroy = () => {
        if (destroyed) return;
        destroyed = true;

        clearTimeout(wheelTimeout);

        container.removeEventListener('touchstart', onStart);
        container.removeEventListener('touchmove', onMove);
        container.removeEventListener('touchend', onEndTouch);
        container.removeEventListener('touchcancel', onEndTouch);

        image.removeEventListener('mousedown', onMouseDown);
        document.body.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mouseleave', onMouseEnd);
        container.removeEventListener('wheel', onWheel);
    };

    return {
        reset,
        zoom1to1,
        destroy,
        rotateCW: () => instance.rotate(90),
        rotateCCW: () => instance.rotate(-90),
        flip: axis => instance.flip(axis)
    };
};
