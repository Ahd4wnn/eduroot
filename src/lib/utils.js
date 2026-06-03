/**
 * Combines multiple class names into a single string, filtering out falsy values.
 * Useful for dynamic class assignment in Tailwind CSS.
 * 
 * @param {...(string|boolean|undefined|null)} classes - The list of classes to combine
 * @returns {string} The merged space-separated classes
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
