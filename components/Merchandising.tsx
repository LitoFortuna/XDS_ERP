import React, { useState, useMemo } from 'react';
import { MerchandiseItem, MerchandiseSale, Student, PaymentMethod } from '../types';
import Modal from './Modal';

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
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500" required min="0"/>
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
            itemName: `${item.name} ${item.size ? '('+item.size+')' : ''}`,
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
                        {students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MerchandiseItem | undefined>(undefined);
    const [itemForSale, setItemForSale] = useState<MerchandiseItem | undefined>(undefined);
    
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);
    
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
    const handleDeleteItem = (item: MerchandiseItem) => {
        if (window.confirm(`¿Seguro que quieres eliminar "${item.name}"? Esta acción no se puede deshacer.`)) {
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
    const handleDeleteSale = (sale: MerchandiseSale) => {
        if (window.confirm(`¿Seguro que quieres eliminar esta venta y reponer el stock?`)) {
            deleteSale(sale);
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <h2 className="text-3xl font-bold mb-6">Merchandising</h2>
            
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('inventory')} className={`${activeTab === 'inventory' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Inventario</button>
                    <button onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Registro de Ventas</button>
                </nav>
            </div>

            {activeTab === 'inventory' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">Inventario de Artículos</h3>
                        <button onClick={() => handleOpenItemModal()} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Añadir Artículo</button>
                    </div>
                    <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                             <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Artículo</th>
                                    <th scope="col" className="px-6 py-3">Categoría</th>
                                    <th scope="col" className="px-6 py-3">Precio Venta</th>
                                    <th scope="col" className="px-6 py-3">Stock</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                             </thead>
                             <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.name} {item.size ? `(${item.size})` : ''}</td>
                                        <td className="px-6 py-4">{item.category}</td>
                                        <td className="px-6 py-4">€{item.salePrice.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${item.stock <= 5 ? 'text-red-400' : 'text-green-400'}`}>{item.stock}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => handleOpenSaleModal(item)} className="font-medium text-green-400 hover:text-green-300 hover:underline">Vender</button>
                                            <button onClick={() => handleOpenItemModal(item)} className="ml-4 font-medium text-purple-400 hover:text-purple-300 hover:underline">Editar</button>
                                            <button onClick={() => handleDeleteItem(item)} className="ml-4 font-medium text-red-400 hover:text-red-300 hover:underline">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                 <div>
                    <h3 className="text-2xl font-bold mb-6">Registro de Ventas</h3>
                    <div className="bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                             <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Artículo</th>
                                    <th scope="col" className="px-6 py-3">Cantidad</th>
                                    <th scope="col" className="px-6 py-3">Total</th>
                                    <th scope="col" className="px-6 py-3">Comprador</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                             </thead>
                             <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.saleDate).toLocaleDateString('es-ES')}</td>
                                        <td className="px-6 py-4 font-medium text-white">{sale.itemName}</td>
                                        <td className="px-6 py-4">{sale.quantity}</td>
                                        <td className="px-6 py-4 font-bold text-green-300">€{sale.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">{sale.studentId ? studentMap.get(sale.studentId) : 'Anónimo'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <button onClick={() => handleDeleteSale(sale)} className="font-medium text-red-400 hover:text-red-300 hover:underline">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
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
