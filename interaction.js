// interaction.js - Manages user interactions with chips

/**
 * Interaction manager for the wafer mapping tool
 */
const ChipInteraction = (function() {
    // Reference to the SVG container
    let svgContainer = null;
    
    // Flag to track if drag operation is active
    let isDragging = false;
    
    /**
     * Handle click on a chip
     * @param {Event} event - Click event
     */
    function handleChipClick(event) {
        const chipGroup = findChipGroupFromEvent(event);
        if (!chipGroup) return;
        
        const chipId = parseInt(chipGroup.getAttribute('data-chip-id'), 10);
        if (isNaN(chipId)) return;
        
        const labelParams = WaferState.getLabelParams();
        
        // Update chip in state
        WaferState.updateChip(chipId, {
            color: labelParams.color,
            label: labelParams.label
        });
        
        // Update visual representation
        SvgRenderer.updateChipVisual(chipId, {
            color: labelParams.color,
            label: labelParams.label
        });
    }
    
    /**
     * Handle start of drag operation
     * @param {Event} event - Mousedown event
     */
    function handleDragStart(event) {
        const chipGroup = findChipGroupFromEvent(event);
        if (!chipGroup) return;
        
        isDragging = true;
        svgContainer.addEventListener('mousemove', handleDragMove);
        svgContainer.addEventListener('mouseup', handleDragEnd);
        
        // Prevent text selection during drag
        event.preventDefault();
    }
    
    /**
     * Handle drag movement
     * @param {Event} event - Mousemove event
     */
    function handleDragMove(event) {
        if (!isDragging) return;
        
        const chipGroup = findChipGroupFromEvent(event);
        if (!chipGroup) return;
        
        const chipId = parseInt(chipGroup.getAttribute('data-chip-id'), 10);
        if (isNaN(chipId)) return;
        
        const labelParams = WaferState.getLabelParams();
        
        // Update chip in state
        WaferState.updateChip(chipId, {
            color: labelParams.color,
            label: labelParams.label
        });
        
        // Update visual representation
        SvgRenderer.updateChipVisual(chipId, {
            color: labelParams.color,
            label: labelParams.label
        });
    }
    
    /**
     * Handle end of drag operation
     */
    function handleDragEnd() {
        isDragging = false;
        svgContainer.removeEventListener('mousemove', handleDragMove);
        svgContainer.removeEventListener('mouseup', handleDragEnd);
    }
    
    /**
     * Find the chip group element from an event
     * @param {Event} event - Event object
     * @returns {Element|null} The chip group element or null if not found
     */
    function findChipGroupFromEvent(event) {
        let target = event.target;
        
        while (target && !target.classList.contains('chip-group')) {
            if (target === svgContainer) return null;
            target = target.parentElement;
        }
        
        return target;
    }
    
    // Public methods
    return {
        /**
         * Initialize the interaction manager
         * @param {string} containerId - ID of the SVG container element
         */
        init: function(containerId) {
            svgContainer = document.getElementById(containerId);
            if (!svgContainer) {
                console.error(`SVG container with ID "${containerId}" not found.`);
                return false;
            }
            
            this.bindEventListeners();
            
            return this;
        },
        
        /**
         * Bind all event listeners
         */
        bindEventListeners: function() {
            // Click on chips
            svgContainer.addEventListener('click', handleChipClick);
            
            // Enable drag to paint
            svgContainer.addEventListener('mousedown', handleDragStart);
            
            return this;
        },
        
        /**
         * Remove all event listeners
         */
        removeEventListeners: function() {
            svgContainer.removeEventListener('click', handleChipClick);
            svgContainer.removeEventListener('mousedown', handleDragStart);
            
            if (isDragging) {
                svgContainer.removeEventListener('mousemove', handleDragMove);
                svgContainer.removeEventListener('mouseup', handleDragEnd);
                isDragging = false;
            }
            
            return this;
        }
    };
})();