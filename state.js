// state.js - Manages the application state

/**
 * State management for the wafer mapping tool
 */
const WaferState = (function() {
    // Private state
    let waferParams = {
        diameter: 101.6, // Changed to 101.6mm
        flatAngle: 30,
        excludedRadius: 0,
        name: '', // Added wafer name
        exportTimestamp: null // Added timestamp for export
    };
    
    let chipParams = {
        width: 10,
        height: 12,
        labelFontSize: 0.18 // Added label font size as percentage of chip size
    };
    
    let currentLabel = '';
    let currentColor = '#ffffff';
    
    let chips = [];
    
    // Public methods
    return {
        /**
         * Initialize the state with default values
         */
        init: function() {
            // Default values are already set above
            return this;
        },
        
        /**
         * Get current wafer parameters
         * @returns {Object} Current wafer parameters
         */
        getWaferParams: function() {
            return { ...waferParams };
        },
        
        /**
         * Update wafer parameters
         * @param {Object} params - New wafer parameters
         */
        updateWaferParams: function(params) {
            if (params.diameter) waferParams.diameter = params.diameter;
            if (params.flatAngle !== undefined) waferParams.flatAngle = params.flatAngle;
            if (params.excludedRadius !== undefined) waferParams.excludedRadius = params.excludedRadius;
            if (params.name !== undefined) waferParams.name = params.name;
            if (params.exportTimestamp !== undefined) waferParams.exportTimestamp = params.exportTimestamp;
            
            return this;
        },
        
        /**
         * Get current chip parameters
         * @returns {Object} Current chip parameters
         */
        getChipParams: function() {
            return { ...chipParams };
        },
        
        /**
         * Update chip parameters
         * @param {Object} params - New chip parameters
         */
        updateChipParams: function(params) {
            if (params.width) chipParams.width = params.width;
            if (params.height) chipParams.height = params.height;
            if (params.labelFontSize !== undefined) chipParams.labelFontSize = params.labelFontSize;
            
            return this;
        },
        
        /**
         * Get current labeling parameters
         * @returns {Object} Current label and color
         */
        getLabelParams: function() {
            return {
                label: currentLabel,
                color: currentColor
            };
        },
        
        /**
         * Update labeling parameters
         * @param {Object} params - New labeling parameters
         */
        updateLabelParams: function(params) {
            if (params.label !== undefined) currentLabel = params.label;
            if (params.color) currentColor = params.color;
            
            return this;
        },
        
        /**
         * Set all chips
         * @param {Array} newChips - Array of chip objects
         */
        setChips: function(newChips) {
            chips = newChips;
            return this;
        },
        
        /**
         * Get all chips
         * @returns {Array} Array of all chip objects
         */
        getAllChips: function() {
            return [...chips];
        },
        
        /**
         * Get a specific chip by ID
         * @param {number} id - Chip ID
         * @returns {Object|null} Chip object or null if not found
         */
        getChipById: function(id) {
            const chip = chips.find(c => c.id === id);
            return chip ? { ...chip } : null;
        },
        
        /**
         * Update a specific chip
         * @param {number} id - Chip ID
         * @param {Object} updates - Properties to update
         * @returns {boolean} True if chip was found and updated
         */
        updateChip: function(id, updates) {
            const chipIndex = chips.findIndex(c => c.id === id);
            if (chipIndex === -1) return false;
            
            chips[chipIndex] = { ...chips[chipIndex], ...updates };
            return true;
        },
        
        /**
         * Serialize the state to JSON
         * @returns {string} JSON string of the state
         */
        serialize: function() {
            return JSON.stringify({
                waferParams,
                chipParams,
                chips
            });
        },
        
        /**
         * Load state from JSON
         * @param {string} json - JSON string to load
         * @returns {boolean} True if load was successful
         */
        load: function(json) {
            try {
                const data = JSON.parse(json);
                
                if (data.waferParams) this.updateWaferParams(data.waferParams);
                if (data.chipParams) this.updateChipParams(data.chipParams);
                
                // Store the imported chips but don't regenerate the wafer yet
                let importedChips = [];
                if (data.chips) importedChips = data.chips;
                
                // First generate new chips based on current parameters
                const waferParams = this.getWaferParams();
                const chipParams = this.getChipParams();
                
                // Generate chip grid (but don't store it yet)
                const newChips = generateChipGrid(
                    waferParams, 
                    chipParams.width, 
                    chipParams.height
                );
                
                // Map the imported properties (like colors and labels) to the new chips
                // Match by position (x,y coordinates) since chip IDs might differ
                newChips.forEach(newChip => {
                    if (newChip.inside) {
                        // Try to find a matching chip in the imported data
                        const matchingChip = importedChips.find(importedChip => 
                            Math.abs(importedChip.x - newChip.x) < 0.1 && 
                            Math.abs(importedChip.y - newChip.y) < 0.1
                        );
                        
                        if (matchingChip) {
                            // Copy properties from the imported chip
                            if (matchingChip.color) newChip.color = matchingChip.color;
                            if (matchingChip.label) newChip.label = matchingChip.label;
                        }
                    }
                });
                
                // Update the chips in state
                chips = newChips;
                
                return true;
            } catch (error) {
                console.error('Error loading state:', error);
                return false;
            }
        }
    };
})();