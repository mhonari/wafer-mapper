// svgRenderer.js - Handles SVG rendering of the wafer map

/**
 * SVG Renderer for the wafer mapping tool
 */
const SvgRenderer = (function() {
    // SVG namespace
    const SVG_NS = 'http://www.w3.org/2000/svg';
    
    // Reference to the SVG container element
    let svgContainer = null;
    
    /**
     * Create an SVG element with the given attributes
     * @param {string} elementType - Type of SVG element to create
     * @param {Object} attributes - Attributes to set on the element
     * @returns {SVGElement} The created SVG element
     */
    function createSvgElement(elementType, attributes = {}) {
        const element = document.createElementNS(SVG_NS, elementType);
        
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        
        return element;
    }
    
    /**
     * Draw a small 2D Cartesian coordinate system
     * @param {number} size - Size of the coordinate axes in mm
     * @returns {SVGElement} The SVG element representing the coordinate system
     */
    function drawCoordinateSystem(size) {
        // Create a group for the coordinate system
        // Position it at the bottom left of the wafer
        // Fixed size of 7mm x 7mm
        const actualSize = 7; // 7mm size
        
        const coordGroup = createSvgElement('g', {
            class: 'coordinate-system',
            transform: `translate(${-actualSize*5.5}, ${actualSize*5.5})` // Moved to new position
        });
        
        // Create the axes - both black now
        // Z axis pointing left
        const zAxis = createSvgElement('line', {
            x1: 0,
            y1: 0,
            x2: -actualSize,
            y2: 0,
            stroke: '#000000',
            'stroke-width': 0.5
        });
        
        // -Y axis pointing down
        const yAxis = createSvgElement('line', {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: actualSize,
            stroke: '#000000',
            'stroke-width': 0.5
        });
        
        // Add axis labels
        const zLabel = createSvgElement('text', {
            x: -actualSize - 2,
            y: 0,
            'text-anchor': 'end',
            'alignment-baseline': 'middle',
            fill: '#000000',
            'font-size': actualSize * 0.3
        });
        zLabel.textContent = 'Z';
        
        const yLabel = createSvgElement('text', {
            x: 1,
            y: actualSize + 1,
            'text-anchor': 'start',
            'alignment-baseline': 'hanging',
            fill: '#000000',
            'font-size': actualSize * 0.3
        });
        yLabel.textContent = '-Y';
        
        // Add arrowheads to the axes
        const zArrow = createSvgElement('polygon', {
            points: `${-actualSize},${-actualSize*0.1} ${-actualSize},${actualSize*0.1} ${-actualSize-actualSize*0.2},0`,
            fill: '#000000'
        });
        
        const yArrow = createSvgElement('polygon', {
            points: `${-actualSize*0.1},${actualSize} ${actualSize*0.1},${actualSize} ${0},${actualSize+actualSize*0.2}`,
            fill: '#000000'
        });
        
        // Add all elements to the group
        coordGroup.appendChild(zAxis);
        coordGroup.appendChild(yAxis);
        coordGroup.appendChild(zLabel);
        coordGroup.appendChild(yLabel);
        coordGroup.appendChild(zArrow);
        coordGroup.appendChild(yArrow);
        
        return coordGroup;
    }
    
    // Public methods
    return {
        /**
         * Initialize the renderer
         * @param {string} containerId - ID of the SVG container element
         */
        init: function(containerId) {
            svgContainer = document.getElementById(containerId);
            if (!svgContainer) {
                console.error(`SVG container with ID "${containerId}" not found.`);
                return false;
            }
            
            return this;
        },
        
        /**
         * Clear the SVG container
         */
        clear: function() {
            while (svgContainer.firstChild) {
                svgContainer.removeChild(svgContainer.firstChild);
            }
            
            return this;
        },
        
        /**
         * Render the wafer and all chips
         * @param {Array} chips - Array of chip objects
         * @param {Object} waferParams - Wafer parameters
         */
        renderWafer: function(chips, waferParams) {
            this.clear();
            
            // Set up the SVG container for better sizing
            // Use viewBox to control the coordinate system
            const waferDiameter = waferParams.diameter;
            // Add padding as a percentage of wafer diameter
            const padding = waferDiameter * 0.2;
            const viewBoxSize = waferDiameter + padding * 2;
            
            // Center the viewBox on the wafer's center (0,0)
            svgContainer.setAttribute('viewBox', 
                `${-viewBoxSize/2} ${-viewBoxSize/2} ${viewBoxSize} ${viewBoxSize}`);
            svgContainer.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            // Create a group for the entire wafer
            const waferGroup = createSvgElement('g', {
                id: 'wafer-group'
            });
            
            // Add the wafer boundary
            const waferBoundary = this.drawWaferBoundary(waferParams);
            waferGroup.appendChild(waferBoundary);
            
            // Add wafer name if it exists
            if (waferParams.name) {
                const numberFontSize = waferDiameter * 0.02; // Base font size similar to chip numbers
                const nameFontSize = numberFontSize * 2; // Twice the size of chip numbers
                
                const nameText = createSvgElement('text', {
                    x: 0,
                    y: -waferDiameter/2 - 6, // 6mm above the wafer
                    'text-anchor': 'middle',
                    'font-size': nameFontSize,
                    'font-family': 'Space Grotesk, sans-serif',
                    'font-weight': 'bold',
                    class: 'wafer-name'
                });
                
                nameText.textContent = waferParams.name;
                waferGroup.appendChild(nameText);
                
                // Add timestamp if available
                if (waferParams.exportTimestamp) {
                    const date = new Date(waferParams.exportTimestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    
                    const timestampText = createSvgElement('text', {
                        x: 0,
                        y: -waferDiameter/2 - 3, // 3mm above the wafer, below the name
                        'text-anchor': 'middle',
                        'font-size': nameFontSize * 0.6, // Smaller than the name
                        'font-family': 'Space Grotesk, sans-serif',
                        'fill': '#666666',
                        class: 'wafer-timestamp'
                    });
                    
                    timestampText.textContent = '(' + formattedDate + ')';
                    waferGroup.appendChild(timestampText);
                }
            }
            
            // Add chips
            chips.forEach(chip => {
                if (chip.inside) {
                    const chipElement = this.drawChip(chip);
                    waferGroup.appendChild(chipElement);
                }
            });
            
            // Add coordinate system
            const coordSystem = this.drawCoordinateSystem(waferParams.diameter * 0.15);
            waferGroup.appendChild(coordSystem);
            
            // Add the group to the SVG container
            svgContainer.appendChild(waferGroup);
            
            return this;
        },
        
        /**
         * Draw the wafer boundary (circle with flat edge)
         * @param {Object} waferParams - Wafer parameters
         * @returns {SVGElement} The SVG element representing the wafer boundary
         */
        drawWaferBoundary: function(waferParams) {
            const waferRadius = waferParams.diameter / 2;
            
            // Create a group for the boundary
            const boundaryGroup = createSvgElement('g', {
                class: 'wafer-boundary-group'
            });
            
            if (waferParams.flatAngle > 0) {
                const flatParams = getFlatCutoff(waferRadius, waferParams.flatAngle);
                
                // Create a path for the wafer with flat side
                // This creates a circle with a flat section
                const pathData = [
                    `M ${flatParams.xCutoff} ${-flatParams.yMax}`,  // Start at top of flat edge
                    `L ${flatParams.xCutoff} ${flatParams.yMax}`,   // Line down to bottom of flat
                    `A ${waferRadius} ${waferRadius} 0 1 0 ${flatParams.xCutoff} ${-flatParams.yMax}` // Arc back to start
                ].join(' ');
                
                // Add the background fill
                const backgroundPath = createSvgElement('path', {
                    d: pathData,
                    fill: '#f8f8f8',
                    stroke: 'none'
                });
                
                boundaryGroup.appendChild(backgroundPath);
                
                // Add the outline
                const outlinePath = createSvgElement('path', {
                    d: pathData,
                    fill: 'none',
                    stroke: '#666',
                    'stroke-width': waferRadius * 0.01
                });
                
                boundaryGroup.appendChild(outlinePath);
            } else {
                // If no flat side, just use a circle
                const background = createSvgElement('circle', {
                    cx: 0,
                    cy: 0,
                    r: waferRadius,
                    fill: '#f8f8f8',
                    stroke: 'none'
                });
                
                boundaryGroup.appendChild(background);
                
                const outline = createSvgElement('circle', {
                    cx: 0,
                    cy: 0,
                    r: waferRadius,
                    fill: 'none',
                    stroke: '#666',
                    'stroke-width': waferRadius * 0.01
                });
                
                boundaryGroup.appendChild(outline);
            }
            
            // If excluded radius > 0, draw inner circle
            if (waferParams.excludedRadius > 0) {
                const usableRadius = waferRadius - waferParams.excludedRadius;
                
                const innerCircle = createSvgElement('circle', {
                    cx: 0,
                    cy: 0,
                    r: usableRadius,
                    fill: 'none',
                    stroke: '#999',
                    'stroke-width': waferRadius * 0.005,
                    'stroke-dasharray': `${waferRadius * 0.02} ${waferRadius * 0.02}`
                });
                
                boundaryGroup.appendChild(innerCircle);
            }
            
            return boundaryGroup;
        },
        
        /**
         * Draw a 2D Cartesian coordinate system
         * @param {number} size - Size of the coordinate system
         * @returns {SVGElement} The SVG element for the coordinate system
         */
        drawCoordinateSystem: function(size) {
            return drawCoordinateSystem(size);
        },
        
        /**
         * Draw a single chip
         * @param {Object} chip - Chip object
         * @returns {SVGElement} The SVG element representing the chip
         */
        drawChip: function(chip) {
            // Get the label font size from state
            const chipParams = WaferState.getChipParams();
            const labelFontSizePercent = chipParams.labelFontSize;
            
            // Create a group for the chip
            const chipGroup = createSvgElement('g', {
                'data-chip-id': chip.id,
                class: 'chip-group'
            });
            
            // Create the rectangle for the chip
            const rect = createSvgElement('rect', {
                x: chip.x,
                y: chip.y,
                width: chip.width,
                height: chip.height,
                fill: chip.color || '#ffffff',
                class: 'wafer-chip',
                stroke: '#cccccc',
                'stroke-width': chip.width * 0.01
            });
            
            chipGroup.appendChild(rect);
            
            // Add chip number (always present for inside chips)
            if (chip.number !== null) {
                const fontSize = Math.min(chip.width, chip.height) * 0.2; // Scale font with chip size
                const numberText = createSvgElement('text', {
                    x: chip.x + chip.width - 1, // Moved further to the left
                    y: chip.y + fontSize + 1,  // Moved further up
                    'text-anchor': 'end',
                    'font-size': fontSize,
                    fill: '#555555', // Darker color
                    class: 'chip-number'
                });
                
                numberText.textContent = chip.number;
                chipGroup.appendChild(numberText);
            }
            
            // Add user label if it exists
            if (chip.label) {
                const fontSize = Math.min(chip.width, chip.height) * labelFontSizePercent; // Use the configurable font size
                const text = createSvgElement('text', {
                    x: chip.x + chip.width / 2,
                    y: chip.y + chip.height / 2 + fontSize / 3,
                    'text-anchor': 'middle',
                    'font-size': fontSize,
                    class: 'chip-label'
                });
                
                text.textContent = chip.label;
                chipGroup.appendChild(text);
            }
            
            return chipGroup;
        },
        
        /**
         * Update the visual representation of a chip
         * @param {number} chipId - ID of the chip to update
         * @param {Object} chipData - New chip data
         */
        updateChipVisual: function(chipId, chipData) {
            const chipGroup = svgContainer.querySelector(`[data-chip-id="${chipId}"]`);
            if (!chipGroup) return false;
            
            // Get the label font size from state
            const chipParams = WaferState.getChipParams();
            const labelFontSizePercent = chipParams.labelFontSize;
            
            // Update rectangle fill color
            const rect = chipGroup.querySelector('rect');
            if (rect && chipData.color) {
                rect.setAttribute('fill', chipData.color);
            }
            
            // Don't touch the chip number, only update the user label
            let labelText = chipGroup.querySelector('.chip-label');
            
            if (chipData.label === undefined) return true;
            
            if (chipData.label) {
                const chipWidth = parseFloat(rect.getAttribute('width'));
                const chipHeight = parseFloat(rect.getAttribute('height'));
                const fontSize = Math.min(chipWidth, chipHeight) * labelFontSizePercent;
                
                if (!labelText) {
                    // Create text element if it doesn't exist
                    labelText = createSvgElement('text', {
                        x: parseFloat(rect.getAttribute('x')) + chipWidth / 2,
                        y: parseFloat(rect.getAttribute('y')) + chipHeight / 2 + fontSize / 3,
                        'text-anchor': 'middle',
                        'font-size': fontSize,
                        class: 'chip-label'
                    });
                    chipGroup.appendChild(labelText);
                } else {
                    // Update font size if the label exists
                    labelText.setAttribute('font-size', fontSize);
                    // Also update Y position to keep it centered
                    labelText.setAttribute('y', parseFloat(rect.getAttribute('y')) + chipHeight / 2 + fontSize / 3);
                }
                
                labelText.textContent = chipData.label;
            } else if (labelText) {
                // Remove text element if label is empty
                chipGroup.removeChild(labelText);
            }
            
            return true;
        },
        
        /**
         * Get the SVG element for export
         * @returns {SVGElement} The SVG element
         */
        getSvgElement: function() {
            return svgContainer;
        }
    };
})();
