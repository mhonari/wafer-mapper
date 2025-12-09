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
        // Create a clone of the SVG element
        const svgClone = svgElement.cloneNode(true);
        
        // Preserve the viewBox attribute
        const viewBox = svgElement.getAttribute('viewBox');
        
        // Make sure clone has the same dimensions and viewBox
        svgClone.setAttribute('width', '800px');
        svgClone.setAttribute('height', '800px');
        svgClone.setAttribute('viewBox', viewBox);
        
        // Create a background rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', viewBox.split(' ')[0]);
        rect.setAttribute('y', viewBox.split(' ')[1]);
        rect.setAttribute('width', viewBox.split(' ')[2]);
        rect.setAttribute('height', viewBox.split(' ')[3]);
        rect.setAttribute('fill', 'white');
        
        // Insert the rectangle at the beginning
        svgClone.insertBefore(rect, svgClone.firstChild);
        
        // Get the SVG as a string
        const svgString = new XMLSerializer().serializeToString(svgClone);
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = 1600;  // Fixed size for consistency
        canvas.height = 1600;
        
        // Create an image from the SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            // Draw the image on the canvas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Get the data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Revoke the URL
            URL.revokeObjectURL(url);
            
            // Call the callback with the data URL
            callback(dataUrl);
        };
        
        img.src = url;
    }
    
    /**
     * Trigger download of a file
     * @param {string} content - File content
     * @param {string} fileName - File name
     * @param {string} mimeType - MIME type
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
        /**
         * Export the wafer map to PNG
         */
        exportToPng: function() {
            const svgElement = SvgRenderer.getSvgElement();
            
            svgToPng(svgElement, function(dataUrl) {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = 'wafer_map.png';
                a.click();
            });
        },
        
        /**
         * Export the wafer map to SVG
         */
        exportToSvg: function() {
            const svgElement = SvgRenderer.getSvgElement();
            
            // Create a clone of the SVG element
            const svgClone = svgElement.cloneNode(true);
            
            // Preserve the viewBox attribute
            const viewBox = svgElement.getAttribute('viewBox');
            
            // Make sure clone has the same dimensions and viewBox
            svgClone.setAttribute('width', '800px');
            svgClone.setAttribute('height', '800px');
            svgClone.setAttribute('viewBox', viewBox);
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
            // Create a background rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', viewBox.split(' ')[0]);
            rect.setAttribute('y', viewBox.split(' ')[1]);
            rect.setAttribute('width', viewBox.split(' ')[2]);
            rect.setAttribute('height', viewBox.split(' ')[3]);
            rect.setAttribute('fill', 'white');
            
            // Insert the rectangle at the beginning
            svgClone.insertBefore(rect, svgClone.firstChild);
            
            // Get the SVG as a string
            const svgString = new XMLSerializer().serializeToString(svgClone);
            
            downloadFile(svgString, 'wafer_map.svg', 'image/svg+xml');
        },
        
        /**
         * Export the wafer map to JSON
         */
        exportToJson: function() {
            // Update timestamp of export
            WaferState.updateWaferParams({
                exportTimestamp: new Date().toISOString()
            });
            
            // Get the full state but filter out nulls
            const state = JSON.parse(WaferState.serialize());
            
            // Remove null values from chips
            if (state.chips) {
                state.chips = state.chips.map(chip => {
                    const cleanChip = {};
                    // Copy non-null properties only
                    Object.keys(chip).forEach(key => {
                        if (chip[key] !== null) {
                            cleanChip[key] = chip[key];
                        }
                    });
                    return cleanChip;
                });
            }
            
            // Convert back to JSON
            const json = JSON.stringify(state, null, 2);
            
            downloadFile(json, 'wafer_map.json', 'application/json');
        },
        
        /**
         * Import a wafer map from JSON
         * @param {string} json - JSON string to import
         */
        importFromJson: function(json) {
            const success = WaferState.load(json);
            
            if (success) {
                // Update controls
                Controls.updateControlsFromState();
                
                // Regenerate wafer map with the imported data
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