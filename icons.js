export const zoom1to1 = createSVG('M3.51 3.07c5.74.02 11.48-.02 17.22.02 1.37.1 2.34 1.64 2.18 3.13 0 4.08.02 8.16 0 12.23-.1 1.54-1.47 2.64-2.79 2.46-5.61-.01-11.24.02-16.86-.01-1.36-.12-2.33-1.65-2.17-3.14 0-4.07-.02-8.16 0-12.23.1-1.36 1.22-2.48 2.42-2.46Z', 'M5.65 8.54h1.49v6.92m8.94-6.92h1.49v6.92M11.5 9.4v.02m0 5.18v0');
export const rotateCCW = createSVG('M15 4.55a8 8 0 0 0-6 14.9M9 15v5H4M18.37 7.16v.01M13 19.94v.01M16.84 18.37v.01M19.37 15.1v.01M19.94 11v.01');
export const rotateCW = createSVG('M9 4.55a8 8 0 0 1 6 14.9M15 15v5h5M5.63 7.16v.01M4.06 11v.01M4.63 15.1v.01M7.16 18.37v.01M11 19.94v.01');
export const flipX = createSVG('M12 3v18M16 7v10h5L16 7M8 7v10H3L8 7');
export const flipY = createSVG('M3 12h18M7 16h10L7 21v-5M7 8h10L7 3v5');
export const reset = createSVG('M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4');

function createSVG(...d) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('tabindex', '-1');
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '250');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

    svg.append(...d.map(value => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path.setAttribute('d', value);
        return path;
    }));
    return () => svg.cloneNode(true);
}
