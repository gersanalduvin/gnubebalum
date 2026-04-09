/**
 * Utilidades para manejar problemas de accesibilidad en diálogos de Material-UI
 * 
 * Soluciona el problema de "Blocked aria-hidden on an element because its descendant retained focus"
 * que ocurre cuando Material-UI aplica aria-hidden antes de transferir el foco correctamente.
 */

/**
 * Remueve el foco del elemento actualmente enfocado antes de abrir un diálogo.
 * Esto previene el problema de aria-hidden al evitar que un elemento enfocado
 * quede dentro de un ancestro con aria-hidden="true".
 */
export const blurActiveElement = (): void => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && typeof activeElement.blur === 'function') {
    activeElement.blur();
  }
};

/**
 * Hook personalizado para manejar la apertura de diálogos de forma accesible.
 * Automáticamente remueve el foco del elemento activo antes de abrir el diálogo.
 * 
 * @param onOpen - Función que se ejecuta para abrir el diálogo
 * @returns Función que maneja la apertura del diálogo de forma accesible
 */
export const useAccessibleDialogOpen = (onOpen: () => void) => {
  return () => {
    blurActiveElement();
    // Pequeño delay para asegurar que el blur se procese antes de abrir el diálogo
    setTimeout(onOpen, 0);
  };
};

/**
 * Función de utilidad para abrir diálogos de forma accesible.
 * Remueve el foco del elemento activo y luego ejecuta la función de apertura.
 * 
 * @param openFunction - Función que abre el diálogo
 */
export const openDialogAccessibly = (openFunction: () => void): void => {
  blurActiveElement();
  setTimeout(openFunction, 0);
};