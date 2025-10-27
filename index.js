import * as icons from './icons.js';
import { addZoomPan } from './preview.js';
const dropZone = document.querySelector('html');

['dragenter', 'dragover'].forEach(evt =>
    dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    })
);

['dragleave', 'dragend', 'drop'].forEach(evt =>
    dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    })
);

dropZone.addEventListener('drop', (e) => {
    console.log(e.dataTransfer.types);
    console.log(...e.dataTransfer.items);
    console.log(e.dataTransfer.files);
    const fileList = e.dataTransfer && e.dataTransfer.files;
    if (!fileList || !fileList.length) return;
    appendImage([...fileList].filter(file => isImageFile(file)));
});

function isImageFile(file) {
    return file && file.type && file.type.startsWith('image/');
}

async function appendImage(images) {
    console.log({ images });
    if (!images || !images.length) return;


    for (const image of images) {
        const url = URL.createObjectURL(image);
        // const { divElement, imageContainerElement, imageElement } = createImageElement(url, image.name || 'uploaded image');
        const imageContainerElement = createImageElement(url, image.name || 'uploaded image').cloneNode(true);
        const imageElement = imageContainerElement.querySelector('img');
        document.querySelector('.images-container').appendChild(imageContainerElement);
        imageElement.addEventListener('load', function () {
            const zoompan = addZoomPan({ container: imageContainerElement, image: imageElement });
        });
    }
}

function createImageElement(src, alt) {
    const controlElement = createControlElement();
    const divElement = document.createElement('div');
    divElement.className = 'container';
    const imageContainerElement = document.createElement('div');
    // imageContainerElement.draggable = false;
    imageContainerElement.className = 'image-container f-panzoom';
    const imageElement = document.createElement('img');
    imageElement.draggable = false;
    imageElement.src = src;
    imageElement.alt = alt;
    imageElement.className = 'f-panzoom__content';
    divElement.appendChild(imageContainerElement);
    imageContainerElement.appendChild(controlElement);
    imageContainerElement.appendChild(imageElement);
    // return { divElement, imageContainerElement, imageElement };
    return imageContainerElement;
}

function createControlElement() {
    const controlElement = document.createElement('div');
    controlElement.className = 'controls';

    const toggle1to1Button = document.createElement('button');
    toggle1to1Button.appendChild(icons.zoom1to1());
    toggle1to1Button.setAttribute('data-panzoom-action', 'toggleFull');
    const rotateCCWButton = document.createElement('button');
    rotateCCWButton.appendChild(icons.rotateCCW());
    rotateCCWButton.setAttribute('data-panzoom-action', 'rotateCCW');
    const rotateCWButton = document.createElement('button');
    rotateCWButton.appendChild(icons.rotateCW());
    rotateCWButton.setAttribute('data-panzoom-action', 'rotateCW');
    const flipXButton = document.createElement('button');
    flipXButton.appendChild(icons.flipX());
    flipXButton.setAttribute('data-panzoom-action', 'flipX');
    const flipYButton = document.createElement('button');
    flipYButton.appendChild(icons.flipY());
    flipYButton.setAttribute('data-panzoom-action', 'flipY');
    const resetButton = document.createElement('button');
    resetButton.appendChild(icons.reset());
    resetButton.setAttribute('data-panzoom-action', 'reset');

    controlElement.append(toggle1to1Button, rotateCCWButton, rotateCWButton, flipXButton, flipYButton, resetButton);
    return controlElement;
}

/*
// const height = imageElement.naturalHeight;
            // let { x: imageX, y: imageY, height: imageHeight, width: imageWidth } = imageElement.getBoundingClientRect();
            const panzoomImage = Panzoom(imageElement, {
                maxScale: 4,
                minScale: 1,
                step: 0.2,
                // origin: '0 0',
                // startY: (containerHeight / 2) - (imageHeight / 2),
                contain: 'outside',
                // contain: 'inside',
//                 setTransform: (elem, { scale, x, y }) => {
//                     ({ x: containerX, y: containerY, height: containerHeight, width: containerWidth } = imageContainerElement.getBoundingClientRect());
//                     ({ x: imageX, y: imageY, height: imageHeight, width: imageWidth } = imageElement.getBoundingClientRect());
//                     // if (imageX === x && imageY === y) return;
//                     // if (imageX > containerX) return;
//                     // console.log('setTransform=============================');
//                     // console.log({ containerX, containerY, containerHeight, containerWidth });
//                     // console.log({ imageX, imageY, imageHeight, imageWidth });
//                     console.log({ scale, x, y });
//                     // console.log(panzoomImage.getPan());
// 
//                     // console.log(imageContainerElement.getBoundingClientRect().x, imageContainerElement.getBoundingClientRect().y);
//                     // console.log(imageElement.getBoundingClientRect().x, imageElement.getBoundingClientRect().y);
//                     // console.log({ prevX, prevY });
//                     console.log(imageElement.clientHeight);
//                     console.log(imageElement.getBoundingClientRect().height);
//                     console.log(imageElement.naturalHeight);
//                     let newX = x;
//                     let newY = y;
//                     // x = newX;
//                     // if (x * 2 + imageWidth > containerWidth) newX = prevX;
//                     // if (imageX < containerX) newX = containerX;
//                     // if (x < imageWidth -  containerWidth) {
//                     //     return panzoomImage.setStyle('transform', `scale(${scale}) translate(${prevX}px, ${y}px)`);
//                     // }
//                     // if (imageX + imageWidth >= containerWidth) console.log('>');
//                     // if (imageX < containerX) newX = containerX;
//                     // console.log({ newX });
//                     // panzoomImage.pan(newX, newY)
//                     panzoomImage.setStyle('transform', `scale(${scale}) translate(${x}px, ${y}px)`);
//                     // imageContainerElement.style.height = `${imageElement.getBoundingClientRect().height}px`
//                     //                     // prevX = x;
//                     //                     // prevY = y;
//                     //                     // panzoomImage.setStyle('width', `calc(100% * ${scale})`);
//                     //                     // panzoomImage.setStyle('height', `calc(100% * ${scale})`);
//                 }
            });
            //             imageElement.addEventListener('panzoomchange', (event) => {
            //                 panzoomImage.setOptions({ cursor: 'default' })
            //                 console.log('panzoomchange=============================');
            //                 // console.log(event.detail.originalEvent) // => { x: 0, y: 0, scale: 1 }
            //                 const { movementX, movementY } = event.detail.originalEvent || {};
            //                 const { x: containerX, y: containerY, height: containerHeight, width: containerWidth } = imageContainerElement.getBoundingClientRect();
            //                 const { x: imageX, y: imageY, height: imageHeight, width: imageWidth } = imageElement.getBoundingClientRect();
            //                 console.log({ containerX, containerY, containerHeight, containerWidth });
            //                 console.log({ imageX, imageY, imageHeight, imageWidth });
            //                 console.log({ movementX, movementY });
            // 
            //                 let newX = imageX - containerX + movementX || 0;
            //                 let newY = imageY - ((containerHeight / 2) - (imageHeight / 2)) + movementY || 0;
            //                 // console.log({ newX, newY }, event.detail.x, event.detail.y);
            //                 console.log(event.detail.x, event.detail.y);
            //                 if (event.detail.x > containerX && movementX === 1) panzoomImage.setOptions({ disableXAxis: true });
            //                 // if (imageX < containerX) newX = containerX;
            //                 panzoomImage.setStyle('transform', `scale(${event.detail.scale}) translate(${event.detail.x}px, ${event.detail.y}px)`);
            //                 // panzoomImage.setStyle('transform', `scale(${event.detail.scale}) translate(${newX}px, ${newY}px)`);
            //                 // panzoomImage.pan(event.detail.x, event.detail.y);
            //             })
            imageElement.parentElement.addEventListener('wheel', panzoomImage.zoomWithWheel);
            // Panzoom(imageContainerElement, {
            //     mouseMoveFactor: 0.1,
            //     // bounds: false
            // }).init();
            // const instance = panzoom(imageElement, {
            //     smoothScroll: false,
            //     bounds: true,
            //     boundsPadding: 0.6,
            //     maxZoom: 4,
            //     minZoom: 1
            // });
*/