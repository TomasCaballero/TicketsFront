import { useState, useMemo } from 'react';

// T es el tipo de los objetos en el arreglo (ej. ClienteDto)
// K es una clave de ese objeto (ej. 'nombreCliente')
type SortDirection = 'ascending' | 'descending';
type SortConfig<T> = { key: keyof T; direction: SortDirection } | null;

export const useSortableData = <T extends object>(items: T[], initialConfig: SortConfig<T> = null) => {
    const [sortConfig, setSortConfig] = useState(initialConfig);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items]; // Creamos una copia para no mutar el original
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                const aValue = a[key];
                const bValue = b[key];

                // Manejo de valores nulos o indefinidos para que queden al final
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                // Comparación
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { sortedItems, requestSort, sortConfig };
};