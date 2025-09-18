// Función de utilidad para convertir boolean a Yes/No
export function booleanToYesNo(value: boolean | undefined): string {
    return value ? 'Yes' : 'No';
}

// Otras utilidades que puedas necesitar
export function formatPrice(price: number): string {
    return `S/. ${price.toFixed(2)}`;
}

export function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}