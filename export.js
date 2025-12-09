// export.js - Handles exporting and importing wafer maps

/**
 * Export tools for the wafer mapping tool
 */
const ExportTools = (function() {

    /**
     * Convert SVG to PNG
     * @param {SVGElement} svgElement - SVG element to convert
     * @param {Function} callback - Callback function with data URL
     */
    function svgToPng(svgElement, callback) {
        const svgClone = svgElement.cloneNode(true);

        const viewBox = svgElement.getAttribute('viewBox');

        svgClone.setAttribute('width', '800px');
        svgClone.setAttribute('height', '800px');
        svgClone.setAttribute('viewBox', viewBox);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const vb = viewBox.split(' ');
        rect.setAttribute('x', vb[0]);
        rect.setAttribute('y', vb[1]);
        rect.setAttribute('width', vb[2]);
        rect.setAttribute('height', vb[3]);
        rect.setAttribute('fill', 'white');

        svgClone.insertBefore(rect, svgClone.firstChild);

        const svgString = new XMLSerializer().serializeToString(svgClone);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1600;
        canvas.height = 1600;

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);

            callback(dataUrl);
        };

        img.src = url;
    }

    /**
     * Trigger download of a file
     */
    function downloadFile(content, fileName, mimeType) {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        a.href = url;
        a.download = fileName;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Public methods
    return {

        exportToPng: function() {
            const svgElement = SvgRenderer.getSvgElement();

            svgToPng(svgElement, function(dataUrl) {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'wafer_map.png';
                a.click();
            });
        },

        exportToSvg: function() {
            const svgElement = SvgRenderer.getSvgElement();
            const svgClone = svgElement.cloneNode(true);

            const viewBox = svgElement.getAttribute('viewBox');

            svgClone.setAttribute('width', '800px');
            svgClone.setAttribute('height', '800px');
            svgClone.setAttribute('viewBox', viewBox);
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            const vb = viewBox.split(' ');
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', vb[0]);
            rect.setAttribute('y', vb[1]);
            rect.setAttribute('width', vb[2]);
            rect.setAttribute('height', vb[3]);
            rect.setAttribute('fill', 'white');

            svgClone.insertBefore(rect, svgClone.firstChild);

            const svgString = new XMLSerializer().serializeToString(svgClone);

            downloadFile(svgString, 'wafer_map.svg', 'image/svg+xml');
        },

        /**
         * Export the wafer map to JSON (now includes chip fileName)
         */
        exportToJson: function() {
            WaferState.updateWaferParams({
                exportTimestamp: new Date().toISOString()
            });

            // Get entire state
            const state = JSON.parse(WaferState.serialize());

            if (state.chips) {
                state.chips = state.chips.map(chip => {
                    const cleanChip = {};
                    Object.keys(chip).forEach(key => {
                        // keep fileName, and all non-null values
                        if (chip[key] !== null && chip[key] !== undefined) {
                            cleanChip[key] = chip[key];
                        }
                    });
                    return cleanChip;
                });
            }

            const json = JSON.stringify(state, null, 2);
            downloadFile(json, 'wafer_map.json', 'application/json');
        },

        /**
         * Import JSON (restores chip fileName)
         */
        importFromJson: function(json) {
            const success = WaferState.load(json);

            if (success) {
                Controls.updateControlsFromState();

                const chips = WaferState.getAllChips();
                const waferParams = WaferState.getWaferParams();
                SvgRenderer.renderWafer(chips, waferParams);

                return true;
            } else {
                alert('Failed to import wafer map. Invalid format.');
                return false;
            }
        }
    };
})();
