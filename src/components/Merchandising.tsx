
import React, { useState, useMemo } from 'react';
import { MerchandiseItem, MerchandiseSale, Student, PaymentMethod } from '../../types';
import Modal from './Modal';
import PageHeader from './ui/PageHeader';
import { useConfirm } from './ui/Feedback';

interface MerchandisingProps {
    items: MerchandiseItem[];
    sales: MerchandiseSale[];
    students: Student[];
    addItem: (item: Omit<MerchandiseItem, 'id'>) => void;
    updateItem: (item: MerchandiseItem) => void;
    deleteItem: (id: string) => void;
    addSale: (sale: Omit<MerchandiseSale, 'id'>) => void;
    deleteSale: (sale: MerchandiseSale) => void;
}

type SortKey = keyof MerchandiseItem | 'status';
type SaleSortKey = keyof MerchandiseSale | 'studentName';
type SortDirection = 'asc' | 'desc';

// --- FORMULARIO DE ARTÍCULO ---
const ItemForm: React.FC<{
    item?: MerchandiseItem,
    onSubmit: (item: Omit<MerchandiseItem, 'id'> | MerchandiseItem) => void,
    onCancel: () => void,
}> = ({ item, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        category: item?.category || 'Ropa',
        size: item?.size || '',
        purchasePrice: item?.purchasePrice || 0,
        salePrice: item?.salePrice || 0,
        stock: item?.stock || 0,
        imageUrl: item?.imageUrl || '',
        notes: item?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumber = ['purchasePrice', 'salePrice', 'stock'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(item ? { ...item, ...formData } : formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Nombre del Artículo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Categoría</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Ropa, Accesorios" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Talla</label>
                    <input type="text" name="size" value={formData.size} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: S, M, L, Única" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Stock</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required min="0" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Precio Compra (€)</label>
                    <input type="number" step="0.01" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Precio Venta (€)</label>
                    <input type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">URL de Imagen (opcional)</label>
                    <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">{item ? 'Actualizar Artículo' : 'Añadir Artículo'}</button>
            </div>
        </form>
    );
};

// --- FORMULARIO DE VENTA ---
const SaleForm: React.FC<{
    item: MerchandiseItem,
    students: Student[],
    onSubmit: (sale: Omit<MerchandiseSale, 'id'>) => void,
    onCancel: () => void,
}> = ({ item, students, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        quantity: 1,
        studentId: '',
        paymentMethod: 'Efectivo' as PaymentMethod,
        notes: '',
    });

    const sortedStudents = useMemo(() =>
        [...students]
            .filter(s => s.active)
            .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
        [students]);

    const totalAmount = item.salePrice * formData.quantity;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.quantity > item.stock) {
            alert('La cantidad excede el stock disponible.');
            return;
        }
        onSubmit({
            itemId: item.id,
            itemName: `${item.name} ${item.size ? '(' + item.size + ')' : ''}`,
            ...formData,
            totalAmount,
            saleDate: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                <p className="font-bold text-lg text-white">{item.name} {item.size ? `(${item.size})` : ''}</p>
                <p className="text-sm text-gray-300">Precio unitario: €{item.salePrice.toFixed(2)}</p>
                <p className="text-sm text-gray-400">Stock disponible: {item.stock}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Cantidad</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required min="1" max={item.stock} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Comprador (opcional)</label>
                    <select name="studentId" value={formData.studentId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                        <option value="">Venta anónima</option>
                        {sortedStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Forma de Pago</label>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required>
                        <option>Efectivo</option><option>Transferencia</option><option>Domiciliación</option><option>Bizum</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Total</label>
                    <p className="mt-1 text-xl font-bold text-white py-2">€{totalAmount.toFixed(2)}</p>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Observaciones</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Registrar Venta</button>
            </div>
        </form>
    );
};


// --- COMPONENTE PRINCIPAL ---
const Merchandising: React.FC<MerchandisingProps> = ({ items, sales, students, addItem, updateItem, deleteItem, addSale, deleteSale }) => {
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MerchandiseItem | undefined>(undefined);
    const [itemForSale, setItemForSale] = useState<MerchandiseItem | undefined>(undefined);

    // Filtros y Ordenación
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'name', direction: 'asc' });

    // Sales Filters & Sort
    const [salesSearchQuery, setSalesSearchQuery] = useState('');
    const [salesSortConfig, setSalesSortConfig] = useState<{ key: SaleSortKey, direction: SortDirection }>({ key: 'saleDate', direction: 'desc' });

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

    // Calcular categorías únicas para el dropdown
    const uniqueCategories = useMemo(() => {
        const cats = new Set(items.map(i => i.category));
        return Array.from(cats).sort();
    }, [items]);

    // Lógica de Filtrado y Ordenación
    const sortedAndFilteredItems = useMemo(() => {
        let filtered = items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
            return matchesSearch && matchesCategory;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof MerchandiseItem];
            const bValue = b[sortConfig.key as keyof MerchandiseItem];

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [items, searchQuery, categoryFilter, sortConfig]);

    const sortedAndFilteredSales = useMemo(() => {
        let filtered = sales.filter(sale => {
            const studentName = sale.studentId ? studentMap.get(sale.studentId) || '' : 'Anónimo';
            const matchesSearch =
                sale.itemName.toLowerCase().includes(salesSearchQuery.toLowerCase()) ||
                studentName.toLowerCase().includes(salesSearchQuery.toLowerCase());
            return matchesSearch;
        });

        return filtered.sort((a, b) => {
            let aValue: any = a[salesSortConfig.key as keyof MerchandiseSale];
            let bValue: any = b[salesSortConfig.key as keyof MerchandiseSale];

            // Special handling for student name sorting
            if (salesSortConfig.key === 'studentName') {
                aValue = a.studentId ? studentMap.get(a.studentId) || '' : 'Anónimo';
                bValue = b.studentId ? studentMap.get(b.studentId) || '' : 'Anónimo';
            }

            if (aValue < bValue) {
                return salesSortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return salesSortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [sales, salesSearchQuery, salesSortConfig, studentMap]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    };

    const requestSaleSort = (key: SaleSortKey) => {
        let direction: SortDirection = 'asc';
        if (salesSortConfig.key === key && salesSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSalesSortConfig({ key, direction });
    };

    const getSaleSortIndicator = (key: SaleSortKey) => {
        if (salesSortConfig.key !== key) return null;
        return salesSortConfig.direction === 'asc' ? '▲' : '▼';
    };

    // Componente de cabecera ordenable
    const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-600 transition-colors select-none" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-1">
                {children}
                <span className="text-gray-500 text-xs w-3">{getSortIndicator(sortKey)}</span>
            </div>
        </th>
    );

    const SortableSaleHeader: React.FC<{ sortKey: SaleSortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-gray-600 transition-colors select-none" onClick={() => requestSaleSort(sortKey)}>
            <div className="flex items-center gap-1">
                {children}
                <span className="text-gray-500 text-xs w-3">{getSaleSortIndicator(sortKey)}</span>
            </div>
        </th>
    );

    // Handlers
    const handleOpenItemModal = (item?: MerchandiseItem) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };
    const handleCloseItemModal = () => {
        setEditingItem(undefined);
        setIsItemModalOpen(false);
    };
    const handleItemSubmit = (itemData: Omit<MerchandiseItem, 'id'> | MerchandiseItem) => {
        if ('id' in itemData) {
            updateItem(itemData);
        } else {
            addItem(itemData);
        }
        handleCloseItemModal();
    };
    const handleDeleteItem = async (item: MerchandiseItem) => {
        if (await confirm({ title: 'Eliminar artículo', message: `¿Seguro que quieres eliminar "${item.name}"? Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', destructive: true })) {
            deleteItem(item.id);
        }
    };

    const handleOpenSaleModal = (item: MerchandiseItem) => {
        if (item.stock < 1) {
            alert('No hay stock disponible para este artículo.');
            return;
        }
        setItemForSale(item);
        setIsSaleModalOpen(true);
    };
    const handleCloseSaleModal = () => {
        setItemForSale(undefined);
        setIsSaleModalOpen(false);
    };
    const handleSaleSubmit = (saleData: Omit<MerchandiseSale, 'id'>) => {
        addSale(saleData);
        handleCloseSaleModal();
    };
    const handleDeleteSale = async (sale: MerchandiseSale) => {
        if (await confirm({ title: 'Eliminar venta', message: '¿Seguro que quieres eliminar esta venta y reponer el stock?', confirmLabel: 'Eliminar', destructive: true })) {
            deleteSale(sale);
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <PageHeader
                title="Merchandising"
                subtitle={activeTab === 'inventory' ? 'Inventario de artículos y su stock' : 'Registro de ventas'}
                actions={activeTab === 'inventory' ? (
                    <button onClick={() => handleOpenItemModal()} className="bg-purple-600 text-white px-4 py-2.5 md:py-2 rounded-md hover:bg-purple-700 shadow-md font-semibold">Añadir Artículo</button>
                ) : undefined}
            />

            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" role="tablist" aria-label="Inventario o ventas">
                    <button role="tab" aria-selected={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} className={`${activeTab === 'inventory' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Inventario</button>
                    <button role="tab" aria-selected={activeTab === 'sales'} onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Registro de Ventas</button>
                </nav>
            </div>

            {activeTab === 'inventory' && (
                <div>
                    {/* FILTROS */}
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-700/50 mb-5 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label htmlFor="merch-search" className="block text-xs font-medium text-gray-400 mb-1">Buscar</label>
                            <input
                                id="merch-search"
                                type="search"
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2.5 sm:py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="merch-category" className="block text-xs font-medium text-gray-400 mb-1">Categoría</label>
                            <select
                                id="merch-category"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                            >
                                <option value="">Todas las categorías</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Móvil: tarjetas en lugar de la tabla. */}
                    <div className="md:hidden space-y-3">
                        {sortedAndFilteredItems.map(item => (
                            <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white">{item.name}{item.size ? ` (${item.size})` : ''}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-red-500/15 text-red-300' : item.stock <= 5 ? 'bg-amber-500/15 text-amber-300' : 'bg-green-500/15 text-green-300'}`}>
                                        {item.stock === 0 ? 'Sin stock' : `${item.stock} en stock`}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">
                                    Venta <span className="text-white font-semibold">€{item.salePrice.toFixed(2)}</span> · compra €{item.purchasePrice.toFixed(2)}
                                </p>
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    <button onClick={() => handleOpenSaleModal(item)} className="min-h-[44px] rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm font-semibold">Vender</button>
                                    <button onClick={() => handleOpenItemModal(item)} className="min-h-[44px] rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-200 text-sm font-semibold">Editar</button>
                                    <button onClick={() => handleDeleteItem(item)} className="min-h-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">Eliminar</button>
                                </div>
                            </div>
                        ))}
                        {sortedAndFilteredItems.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-8 border border-dashed border-gray-700 rounded-xl">No se encontraron artículos con los filtros seleccionados.</p>
                        )}
                    </div>

                    <div className="hidden md:block bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <SortableHeader sortKey="name">Artículo</SortableHeader>
                                    <SortableHeader sortKey="category">Categoría</SortableHeader>
                                    <SortableHeader sortKey="purchasePrice">Precio Compra</SortableHeader>
                                    <SortableHeader sortKey="salePrice">Precio Venta</SortableHeader>
                                    <SortableHeader sortKey="stock">Stock</SortableHeader>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredItems.map(item => (
                                    <tr key={item.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name} {item.size ? `(${item.size})` : ''}</td>
                                        <td className="px-6 py-4">{item.category}</td>
                                        <td className="px-6 py-4 text-gray-400">€{item.purchasePrice.toFixed(2)}</td>
                                        <td className="px-6 py-4">€{item.salePrice.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${item.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>{item.stock}</span>
                                            {item.stock === 0 && <span className="ml-2 text-xs text-red-300">Sin stock</span>}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <button onClick={() => handleOpenSaleModal(item)} className="px-2 py-1.5 rounded font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10">Vender</button>
                                            <button onClick={() => handleOpenItemModal(item)} className="ml-1 px-2 py-1.5 rounded font-medium text-purple-400 hover:text-purple-200 hover:bg-purple-500/10">Editar</button>
                                            <button onClick={() => handleDeleteItem(item)} className="ml-1 px-2 py-1.5 rounded font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedAndFilteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">No se encontraron artículos con los filtros seleccionados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div>
                    {/* FILTROS VENTAS */}
                    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-700/50 mb-5 sm:mb-6 max-w-md">
                        <div>
                            <label htmlFor="merch-sales-search" className="block text-xs font-medium text-gray-400 mb-1">Buscar</label>
                            <input
                                id="merch-sales-search"
                                type="search"
                                placeholder="Buscar por artículo o comprador..."
                                value={salesSearchQuery}
                                onChange={(e) => setSalesSearchQuery(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2.5 sm:py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Móvil: tarjetas en lugar de la tabla. */}
                    <div className="md:hidden space-y-3">
                        {sortedAndFilteredSales.map(sale => (
                            <div key={sale.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white">{sale.itemName}{sale.quantity > 1 ? ` × ${sale.quantity}` : ''}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(sale.saleDate).toLocaleDateString('es-ES')} · {sale.studentId ? studentMap.get(sale.studentId) : 'Anónimo'}
                                        </p>
                                    </div>
                                    <p className="flex-shrink-0 font-bold text-green-300">€{sale.totalAmount.toFixed(2)}</p>
                                </div>
                                {sale.notes && <p className="text-sm text-gray-400 mt-2">{sale.notes}</p>}
                                <button onClick={() => handleDeleteSale(sale)} className="mt-3 w-full min-h-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold">Eliminar venta</button>
                            </div>
                        ))}
                        {sortedAndFilteredSales.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-8 border border-dashed border-gray-700 rounded-xl">No se encontraron ventas con los filtros seleccionados.</p>
                        )}
                    </div>

                    <div className="hidden md:block bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <SortableSaleHeader sortKey="saleDate">Fecha</SortableSaleHeader>
                                    <SortableSaleHeader sortKey="itemName">Artículo</SortableSaleHeader>
                                    <SortableSaleHeader sortKey="quantity">Cantidad</SortableSaleHeader>
                                    <SortableSaleHeader sortKey="totalAmount">Total</SortableSaleHeader>
                                    <SortableSaleHeader sortKey="studentName">Comprador</SortableSaleHeader>
                                    <th scope="col" className="px-6 py-3">Comentarios</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredSales.map(sale => (
                                    <tr key={sale.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.saleDate).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4 font-medium text-white">{sale.itemName}</td>
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4 font-bold text-green-300">€{sale.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">{sale.studentId ? studentMap.get(sale.studentId) : 'Anónimo'}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={sale.notes}>{sale.notes || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <button onClick={() => handleDeleteSale(sale)} className="px-2 py-1.5 rounded font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedAndFilteredSales.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 italic">No se encontraron ventas con los filtros seleccionados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={isItemModalOpen} onClose={handleCloseItemModal} title={editingItem ? 'Editar Artículo' : 'Añadir Nuevo Artículo'}>
                <ItemForm item={editingItem} onSubmit={handleItemSubmit} onCancel={handleCloseItemModal} />
            </Modal>
            <Modal isOpen={isSaleModalOpen} onClose={handleCloseSaleModal} title="Registrar Venta">
                {itemForSale && <SaleForm item={itemForSale} students={students} onSubmit={handleSaleSubmit} onCancel={handleCloseSaleModal} />}
            </Modal>
        </div>
    );
};

export default Merchandising;
