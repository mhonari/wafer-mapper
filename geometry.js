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
    
    // Calculate how many chips we need in each dimension to cover the wafer
    // Add a margin of 1 to ensure we cover the entire wafer
    const numCols = Math.ceil(waferParams.diameter / chipWidth) + 2;
    const numRows = Math.ceil(waferParams.diameter / chipHeight) + 2;
    
    // Calculate grid dimensions
    const gridWidth = numCols * chipWidth;
    const gridHeight = numRows * chipHeight;
    
    // Calculate starting position (top-left of grid)
    // Since (0,0) is at the center of the wafer, we start at (-gridWidth/2, -gridHeight/2)
    const xStart = -gridWidth / 2;
    const yStart = -gridHeight / 2;
    
    // Get flat edge parameters
    const flatParams = getFlatCutoff(waferRadius, waferParams.flatAngle);
    
    // Generate chip array
    const chips = [];
    let chipId = 0;
    let chipNumber = 1; // For sequential numbering, starting at 1
    
    // First pass - create all chips and mark which ones are inside
    const tempChips = [];
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            // Calculate chip position (bottom-left corner)
            const x = xStart + col * chipWidth;
            const y = yStart + row * chipHeight;
            
            // Check if chip is inside wafer boundary
            const inside = isChipInsideWafer(x, y, chipWidth, chipHeight, usableRadius, flatParams);
            
            // Create chip object
            tempChips.push({
                id: chipId++,
                x: x,
                y: y,
                width: chipWidth,
                height: chipHeight,
                inside: inside,
                color: '#ffffff',
                label: '', // User-assigned label starts empty
                number: inside ? chipNumber++ : null // Sequential number for inside chips only
            });
        }
    }
    
    // Second pass - sort chips by Y (top to bottom) and then X (left to right)
    // and reassign numbers to ensure top-left to bottom-right ordering
    const insideChips = tempChips.filter(chip => chip.inside)
        .sort((a, b) => a.y - b.y || a.x - b.x);
    
    // Reassign numbers
    insideChips.forEach((chip, index) => {
        chip.number = index + 1; // Start from 1
    });
    
    // Add all chips to final array (both inside and outside)
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
    // Convert angle to radians
    const flatAngleRad = flatAngleDeg * Math.PI / 180;
    
    // Calculate the x-coordinate of the flat edge (left side of wafer)
    const flatXCutoff = -waferRadius * Math.cos(flatAngleRad / 2);
    
    // Calculate the maximum y extent of the flat edge
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
    // Calculate the four corners of the chip
    const corners = [
        { x: x, y: y },                           // Bottom-left
        { x: x + chipWidth, y: y },               // Bottom-right
        { x: x, y: y + chipHeight },              // Top-left
        { x: x + chipWidth, y: y + chipHeight }   // Top-right
    ];
    
    // Check if any corner is outside the usable circle
    for (const corner of corners) {
        const distanceFromCenter = Math.sqrt(corner.x * corner.x + corner.y * corner.y);
        if (distanceFromCenter > usableRadius) {
            return false;
        }
        
        // Check if corner is in the flat edge cutoff area
        if (corner.x < flatParams.xCutoff && Math.abs(corner.y) < flatParams.yMax) {
            return false;
        }
    }
    
    return true;
}
