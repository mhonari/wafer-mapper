// geometry.js - Handles all geometric calculations for the wafer map

/**
 * Coordinate System:
 * - Origin (0,0) is at the center of the wafer
 * - X-axis increases to the right
 * - Y-axis increases upward
 * - All units are in millimeters
 */

/**
 * Generates a grid of chips that covers the wafer area
 * @param {Object} waferParams - Parameters for the wafer
 * @param {number} waferParams.diameter - Diameter of the wafer in mm
 * @param {number} waferParams.flatAngle - Angle subtended by the flat edge in degrees
 * @param {number} waferParams.excludedRadius - Excluded radius from the edge in mm
 * @param {number} chipWidth - Width of each chip in mm
 * @param {number} chipHeight - Height of each chip in mm
 * @returns {Array} Array of chip objects with position and inside flag
 */
function generateChipGrid(waferParams, chipWidth, chipHeight) {
    const waferRadius = waferParams.diameter / 2;
    const usableRadius = waferRadius - waferParams.excludedRadius;
    
    const numCols = Math.ceil(waferParams.diameter / chipWidth) + 2;
    const numRows = Math.ceil(waferParams.diameter / chipHeight) + 2;
    
    const gridWidth = numCols * chipWidth;
    const gridHeight = numRows * chipHeight;
    
    const xStart = -gridWidth / 2;
    const yStart = -gridHeight / 2;
    
    const flatParams = getFlatCutoff(waferRadius, waferParams.flatAngle);
    
    const chips = [];
    let chipId = 0;
    let chipNumber = 1;

    const tempChips = [];
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {

            const x = xStart + col * chipWidth;
            const y = yStart + row * chipHeight;
            
            const inside = isChipInsideWafer(
                x, 
                y, 
                chipWidth, 
                chipHeight, 
                usableRadius, 
                flatParams
            );

            // UPDATED: chip now includes fileName
            tempChips.push({
                id: chipId++,
                x: x,
                y: y,
                width: chipWidth,
                height: chipHeight,
                inside: inside,
                color: '#ffffff',
                label: '',
                number: inside ? chipNumber++ : null,
                fileName: ""      // <---- NEW default field
            });
        }
    }

    const insideChips = tempChips
        .filter(chip => chip.inside)
        .sort((a, b) => a.y - b.y || a.x - b.x);

    insideChips.forEach((chip, index) => {
        chip.number = index + 1;
    });

    chips.push(...tempChips);

    return chips;
}

/**
 * Calculates parameters for the flat edge of the wafer
 * @param {number} waferRadius - Radius of the wafer in mm
 * @param {number} flatAngleDeg - Angle subtended by the flat edge in degrees
 * @returns {Object} Parameters defining the flat edge
 */
function getFlatCutoff(waferRadius, flatAngleDeg) {
    const flatAngleRad = flatAngleDeg * Math.PI / 180;
    const flatXCutoff = -waferRadius * Math.cos(flatAngleRad / 2);
    const flatYMax = waferRadius * Math.sin(flatAngleRad / 2);
    
    return {
        xCutoff: flatXCutoff,
        yMax: flatYMax
    };
}

/**
 * Determines if a chip is inside the usable wafer area
 * @param {number} x - X-coordinate of chip's bottom-left corner
 * @param {number} y - Y-coordinate of chip's bottom-left corner
 * @param {number} chipWidth - Width of the chip
 * @param {number} chipHeight - Height of the chip
 * @param {number} usableRadius - Usable radius of the wafer
 * @param {Object} flatParams - Parameters defining the flat edge
 * @returns {boolean} True if chip is inside usable wafer area
 */
function isChipInsideWafer(x, y, chipWidth, chipHeight, usableRadius, flatParams) {
    const corners = [
        { x: x, y: y },
        { x: x + chipWidth, y: y },
        { x: x, y: y + chipHeight },
        { x: x + chipWidth, y: y + chipHeight }
    ];
    
    for (const corner of corners) {
        const distanceFromCenter = Math.sqrt(corner.x * corner.x + corner.y * corner.y);
        if (distanceFromCenter > usableRadius) {
            return false;
        }
        
        if (corner.x < flatParams.xCutoff && Math.abs(corner.y) < flatParams.yMax) {
            return false;
        }
    }
    
    return true;
}
