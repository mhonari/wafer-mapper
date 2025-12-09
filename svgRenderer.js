// svgRenderer.js - Handles drawing the wafer and chips

const SvgRenderer = (function() {

    let svgElement = null;

    function createSvg() {
        svgElement = document.getElementById('wafer-svg');
        return svgElement;
    }

    function clearSvg() {
        while (svgElement.firstChild) {
            svgElement.removeChild(svgElement.firstChild);
        }
    }

    /**
     * Draw one chip at its coordinates
     * Includes label + NEW file name display
     */
    function drawChip(chip, labelParams, chipParams) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", chip.x);
        rect.setAttribute("y", chip.y);
        rect.setAttribute("width", chip.width);
        rect.setAttribute("height", chip.height);
        rect.setAttribute("fill", labelParams.color || "#cccccc");
        rect.setAttribute("stroke", "black");
        rect.setAttribute("stroke-width", "0.5");

        group.appendChild(rect);

        // -----------------------------
        // Chip main label text
        // -----------------------------
        if (labelParams.label) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", chip.x + chip.width / 2);
            text.setAttribute("y", chip.y + chip.height / 2);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");

            const fontSize = chipParams.labelFontSize || 0.18;
            text.setAttribute("font-size", fontSize * chip.width);
            text.textContent = labelParams.label;

            group.appendChild(text);
        }

        // ------------------------------------
        // NEW: Display the chip's associated file name
        // ------------------------------------
        if (chip.fileName) {
            const fileText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            fileText.setAttribute("x", chip.x + chip.width / 2);
            fileText.setAttribute("y", chip.y + chip.height - 2); 
            fileText.setAttribute("text-anchor", "middle");
            fileText.setAttribute("dominant-baseline", "baseline");
            fileText.setAttribute("font-size", (chipParams.labelFontSize || 0.18) * chip.width * 0.5);
            fileText.setAttribute("fill", "#333");

            // Show only the filename (not full path)
            fileText.textContent = chip.fileName;

            group.appendChild(fileText);
        }

        svgElement.appendChild(group);
    }

    /**
     * Draw wafer outline
     */
    function drawWafer(waferParams) {
        const diameter = waferParams.diameter;
        const radius = diameter / 2;

        const waferCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        waferCircle.setAttribute("cx", 0);
        waferCircle.setAttribute("cy", 0);
        waferCircle.setAttribute("r", radius);
        waferCircle.setAttribute("fill", "none");
        waferCircle.setAttribute("stroke", "#000");
        waferCircle.setAttribute("stroke-width", "2");

        svgElement.appendChild(waferCircle);

        // Optionally draw the flat angle or notch here if needed
    }

    return {

        getSvgElement: function() {
            if (!svgElement) createSvg();
            return svgElement;
        },

        /**
         * Render everything: wafer + chips
         */
        renderWafer: function(chips, waferParams) {
            if (!svgElement) createSvg();

            clearSvg();

            // Build a viewBox centered at (0, 0)
            const radius = waferParams.diameter / 2;
            svgElement.setAttribute("viewBox", `${-radius} ${-radius} ${waferParams.diameter} ${waferParams.diameter}`);

            drawWafer(waferParams);

            const labelParams = WaferState.getLabelParams();
            const chipParams = WaferState.getChipParams();

            chips.forEach(chip => {
                drawChip(chip, labelParams, chipParams);
            });
        }
    };

})();
