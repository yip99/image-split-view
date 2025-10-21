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
        input_image_mime_type = image.type;
        input_image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(image);
        });
        // const imageElement = document.createElement('img');
        // imageElement.src = url;
        // imageElement.alt = image.name || 'uploaded image';
        const { divElement, imageElement } = creeateImageElement(url, image.name || 'uploaded image');
        document.body.appendChild(divElement);
        const panzoom = Panzoom(imageElement, {
            maxScale: 5,
            // contain: 'inside',
            // disablePan: true,
            // disableXAxis: true,
            disableYAxis: true,
            // pinchAndPan: true,
            // startY: 100
        });
        imageElement.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)
    }
}

function creeateImageElement(src, alt) {
    const divElement = document.createElement('div');
    divElement.className = 'image-container';
    const imageElement = document.createElement('img');
    imageElement.src = src;
    imageElement.alt = alt;
    imageElement.draggable = false;
    divElement.appendChild(imageElement);
    return { divElement, imageElement };
}