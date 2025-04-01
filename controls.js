// controls.js - Manages UI controls for the wafer mapping tool

/**
 * UI controls manager for the wafer mapping tool
 */
const Controls = (function() {
    // References to control elements
    let elements = {};
    
    /**
     * Initialize all control elements
     */
    function initializeControlElements() {
        // Wafer parameters
        elements.waferName = document.getElementById('wafer-name');
        elements.waferDiameter = document.getElementById('wafer-diameter');
        elements.flatAngle = document.getElementById('flat-angle');
        elements.excludedRadius = document.getElementById('excluded-radius');
        
        // Chip parameters
        elements.chipWidth = document.getElementById('chip-width');
        elements.chipHeight = document.getElementById('chip-height');
        
        // Labeling
        elements.chipColor = document.getElementById('chip-color');
        elements.chipLabel = document.getElementById('chip-label');
        elements.labelFontSize = document.getElementById('label-font-size');
        elements.fontSizeValue = document.getElementById('font-size-value');
        
        // Export
        elements.exportPng = document.getElementById('export-png');
        elements.exportSvg = document.getElementById('export-svg');
        elements.exportJson = document.getElementById('export-json');
        elements.importJson = document.getElementById('import-json');
    }
    
    /**
     * Handle changes to wafer parameters
     */
    function handleWaferParamsChange() {
        const diameter = parseFloat(elements.waferDiameter.value);
        const flatAngle = parseFloat(elements.flatAngle.value);
        const excludedRadius = parseFloat(elements.excludedRadius.value);
        const name = elements.waferName.value;
        
        if (isNaN(diameter) || isNaN(flatAngle) || isNaN(excludedRadius)) {
            return;
        }
        
        // Update state
        WaferState.updateWaferParams({
            diameter,
            flatAngle,
            excludedRadius,
            name
        });
        
        // Regenerate wafer map
        WaferMapping.generateMap();
    }
    
    /**
     * Handle changes to chip parameters
     */
    function handleChipParamsChange() {
        const width = parseFloat(elements.chipWidth.value);
        const height = parseFloat(elements.chipHeight.value);
        
        if (isNaN(width) || isNaN(height)) {
            return;
        }
        
        // Update state
        WaferState.updateChipParams({
            width,
            height
        });
        
        // Regenerate wafer map
        WaferMapping.generateMap();
    }
    
    /**
     * Handle changes to labeling parameters
     */
    function handleLabelParamsChange() {
        const color = elements.chipColor.value;
        const label = elements.chipLabel.value;
        
        // Update state
        WaferState.updateLabelParams({
            color,
            label
        });
    }
    
    /**
     * Handle font size change
     */
    function handleFontSizeChange() {
        const fontSizePercent = parseFloat(elements.labelFontSize.value);
        if (isNaN(fontSizePercent)) return;
        
        // Update the display value
        elements.fontSizeValue.textContent = Math.round(fontSizePercent * 100) + '%';
        
        // Update state
        WaferState.updateChipParams({
            labelFontSize: fontSizePercent
        });
        
        // Redraw all chips to update font size
        const chips = WaferState.getAllChips();
        const waferParams = WaferState.getWaferParams();
        SvgRenderer.renderWafer(chips, waferParams);
    }
    
    /**
     * Handle export to PNG
     */
    function handleExportPng() {
        ExportTools.exportToPng();
    }
    
    /**
     * Handle export to SVG
     */
    function handleExportSvg() {
        ExportTools.exportToSvg();
    }
    
    /**
     * Handle export to JSON
     */
    function handleExportJson() {
        ExportTools.exportToJson();
    }
    
    /**
     * Handle import from JSON
     * @param {Event} event - Change event from file input
     */
    function handleImportJson(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const json = e.target.result;
            const success = WaferState.load(json);
            
            if (success) {
                // Update UI controls to reflect the imported state
                Controls.updateControlsFromState();
                
                // Render the wafer with the imported chips
                const chips = WaferState.getAllChips();
                const waferParams = WaferState.getWaferParams();
                SvgRenderer.renderWafer(chips, waferParams);
                
                console.log('Wafer map imported successfully');
            } else {
                alert('Failed to import wafer map. Invalid format.');
            }
            
            // Reset the file input so the same file can be selected again
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }
    
    // Public methods
    return {
        /**
         * Initialize the controls
         */
        init: function() {
            initializeControlElements();
            
            // Set initial values from state
            this.updateControlsFromState();
            
            // Bind event listeners
            this.bindEventListeners();
            
            return this;
        },
        
        /**
         * Bind all event listeners for UI controls
         */
        bindEventListeners: function() {
            // Wafer parameters
            elements.waferName.addEventListener('input', handleWaferParamsChange);
            elements.waferDiameter.addEventListener('change', handleWaferParamsChange);
            elements.flatAngle.addEventListener('change', handleWaferParamsChange);
            elements.excludedRadius.addEventListener('change', handleWaferParamsChange);
            
            // Chip parameters
            elements.chipWidth.addEventListener('change', handleChipParamsChange);
            elements.chipHeight.addEventListener('change', handleChipParamsChange);
            
            // Labeling
            elements.chipColor.addEventListener('change', handleLabelParamsChange);
            elements.chipLabel.addEventListener('input', handleLabelParamsChange);
            elements.labelFontSize.addEventListener('input', handleFontSizeChange);
            
            // Export
            elements.exportPng.addEventListener('click', handleExportPng);
            elements.exportSvg.addEventListener('click', handleExportSvg);
            elements.exportJson.addEventListener('click', handleExportJson);
            elements.importJson.addEventListener('change', handleImportJson);
            
            return this;
        },
        
        /**
         * Update control values from the current state
         */
        updateControlsFromState: function() {
            const waferParams = WaferState.getWaferParams();
            const chipParams = WaferState.getChipParams();
            const labelParams = WaferState.getLabelParams();
            
            // Wafer parameters
            elements.waferName.value = waferParams.name || '';
            elements.waferDiameter.value = waferParams.diameter;
            elements.flatAngle.value = waferParams.flatAngle;
            elements.excludedRadius.value = waferParams.excludedRadius;
            
            // Chip parameters
            elements.chipWidth.value = chipParams.width;
            elements.chipHeight.value = chipParams.height;
            elements.labelFontSize.value = chipParams.labelFontSize || 0.18;
            elements.fontSizeValue.textContent = Math.round((chipParams.labelFontSize || 0.18) * 100) + '%';
            
            // Labeling
            elements.chipColor.value = labelParams.color;
            elements.chipLabel.value = labelParams.label;
            
            return this;
        }
    };
})();