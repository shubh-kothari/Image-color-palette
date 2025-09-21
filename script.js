document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const colorPalette = document.getElementById('color-palette');

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
            
            processImageForColors(e.target.result);
        };
        reader.readAsDataURL(file);
    });
    
    function processImageForColors(imageUrl) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colors = getProminentColors(imageData);

            displayColors(colors);
        };
        img.src = imageUrl;
    }

    function getProminentColors(imageData) {
        const colorCount = {};
        const step = 5;
        for (let i = 0; i < imageData.length; i += 4 * step) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const alpha = imageData[i + 3];

            if (alpha < 128) {
                continue;
            }

            const rgbString = `${r},${g},${b}`;
            colorCount[rgbString] = (colorCount[rgbString] || 0) + 1;
        }

        const sortedColors = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a]);
        const uniqueColors = [];
        const colorSimilarityThreshold = 40;

        function isSimilar(color1, color2) {
            const [r1, g1, b1] = color1.split(',').map(Number);
            const [r2, g2, b2] = color2.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(r1 - r2, 2) +
                Math.pow(g1 - g2, 2) +
                Math.pow(b1 - b2, 2)
            );
            return distance < colorSimilarityThreshold;
        }

        for (const color of sortedColors) {
            if (!uniqueColors.some(uniqueColor => isSimilar(color, uniqueColor))) {
                uniqueColors.push(color);
            }
            if (uniqueColors.length >= 15) {
                break;
            }
        }

        return uniqueColors;
    }

    function displayColors(colors) {
        colorPalette.innerHTML = '';

        if (colors.length === 0) {
            colorPalette.innerHTML = '<p>No prominent colors found.</p>';
            return;
        }

        colors.forEach(rgbString => {
            const [r, g, b] = rgbString.split(',');
            const hex = rgbToHex(parseInt(r), parseInt(g), parseInt(b));

            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';

            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = hex;

            const id = document.createElement('div');
            id.className = 'color-id';
            id.textContent = hex;

            swatch.appendChild(dot);
            swatch.appendChild(id);
            colorPalette.appendChild(swatch);
        });
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    const paletteContainer = document.getElementById('color-palette');

    paletteContainer.addEventListener('click', (event) => {
        const swatch = event.target.closest('.color-swatch');

        if (swatch) {
            const colorIdElement = swatch.querySelector('.color-id');
            const colorCode = colorIdElement.textContent;

            navigator.clipboard.writeText(colorCode).then(() => {
                const originalText = colorIdElement.textContent;
                colorIdElement.textContent = 'Copied!';

                setTimeout(() => {
                    colorIdElement.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy color code: ', err);
            });
        }
    });
});

