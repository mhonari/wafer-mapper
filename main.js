// main.js - Main controller for the wafer mapping tool

/**
 * Main controller for the wafer mapping tool
 */
const WaferMapping = (function() {
    /**
     * Generate the wafer map based on current parameters
     */
    function generateWaferMap() {
        const waferParams = WaferState.getWaferParams();
        const chipParams = WaferState.getChipParams();
        
        // Generate chip grid
        const chips = generateChipGrid(
            waferParams, 
            chipParams.width, 
            chipParams.height
        );
        
        // Update state with new chips
        WaferState.setChips(chips);
        
        // Render the wafer map
        SvgRenderer.renderWafer(chips, waferParams);
    }
    
    // Public methods
    return {
        /**
         * Initialize the application
         */
        init: function() {
            // Initialize modules
            WaferState.init();
            SvgRenderer.init('wafer-canvas');
            ChipInteraction.init('wafer-canvas');
            Controls.init();
            
            // Generate initial wafer map
            this.generateMap();
            
            return this;
        },
        
        /**
         * Generate or regenerate the wafer map
         */
        generateMap: function() {
            generateWaferMap();
            return this;
        }
    };
})();

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    WaferMapping.init();
});