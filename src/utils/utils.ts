export const PEN_Formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
});

export function booleanToYesNo(bool: boolean | null | undefined) {
    return bool ? 'Yes' : 'No';
}
