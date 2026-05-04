/**
 * Type alias for status values
 */
export type StatusType = 'active' | 'completed' | 'pending';

/**
 * Type alias for callback function
 */
export type CallbackFunction = (status: StatusType) => void;

/**
 * Example class demonstrating type aliases in method signatures
 */
export class TypeAliasExample {
    /**
     * Sets the status using a type alias parameter
     * @param status The status to set
     */
    setStatus(status: StatusType): void {
        // Implementation
    }

    /**
     * Handles status changes with a callback
     * @param callback The callback function
     */
    onStatusChange(callback: CallbackFunction): void {
        // Implementation
    }

    /**
     * Gets the current status
     * @returns The current status as a type alias
     */
    getStatus(): StatusType {
        return 'active';
    }
}

