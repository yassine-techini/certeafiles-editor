/**
 * Global modal state manager
 * Used to completely freeze editor operations when a modal is open
 */

// Global state
let isModalOpen = false;
const listeners: Set<() => void> = new Set();

/**
 * Check if any modal is currently open
 */
export function isModalCurrentlyOpen(): boolean {
  return isModalOpen;
}

/**
 * Set modal open state
 */
export function setModalOpen(open: boolean): void {
  console.log('[ModalState] setModalOpen:', open);
  isModalOpen = open;
  // Notify all listeners
  listeners.forEach((listener) => listener());
}

/**
 * Subscribe to modal state changes
 */
export function subscribeToModalState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
