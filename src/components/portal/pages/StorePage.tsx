import React from 'react';
import { MerchandiseItem } from '../../../../types';

interface StorePageProps {
    merchandise: MerchandiseItem[];
}

const StorePage: React.FC<StorePageProps> = ({ merchandise }) => {
    // Group merchandise by baseName
    const groupedMerchandise = merchandise.reduce((acc, item) => {
        const key = item.baseName;
        if (!acc[key]) {
            acc[key] = {
                baseName: item.baseName,
                category: item.category,
                imageUrl: item.imageUrl,
                variants: [],
            };
        }
        acc[key].variants.push(item);
        return acc;
    }, {} as Record<string, { baseName: string; category: string; imageUrl?: string; variants: MerchandiseItem[] }>);

    const products = Object.values(groupedMerchandise);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const handleRequestProduct = (product: { baseName: string; variants: MerchandiseItem[] }) => {
        const message = `Hola! Me interesa el producto: ${product.baseName}`;
        const whatsappUrl = `https://wa.me/34637920943?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Merchandising
                </h2>
                <span className="text-gray-400 text-sm">{products.length} productos</span>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => {
                        const minPrice = Math.min(...product.variants.map((v) => v.price));
                        const maxPrice = Math.max(...product.variants.map((v) => v.price));
                        const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

                        return (
                            <div
                                key={index}
                                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all duration-300 group"
                            >
                                {/* Image */}
                                {product.imageUrl ? (
                                    <div className="aspect-square bg-gray-900 overflow-hidden">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.baseName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-square bg-gray-900 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-white font-bold text-lg mb-1">{product.baseName}</h3>
                                            <p className="text-gray-400 text-sm capitalize">{product.category}</p>
                                        </div>
                                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                                            {totalStock} disponibles
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-4">
                                        {minPrice === maxPrice ? (
                                            <p className="text-white font-bold text-xl">{formatCurrency(minPrice)}</p>
                                        ) : (
                                            <p className="text-white font-bold text-xl">
                                                {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Variants */}
                                    {product.variants.length > 1 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-400 mb-2">{product.variants.length} variantes disponibles</p>
                                            <div className="flex flex-wrap gap-1">
                                                {product.variants.slice(0, 4).map((variant, vIndex) => (
                                                    <span key={vIndex} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                                                        {variant.variant}
                                                    </span>
                                                ))}
                                                {product.variants.length > 4 && (
                                                    <span className="text-gray-400 text-xs px-2 py-1">
                                                        +{product.variants.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Request Button */}
                                    <button
                                        onClick={() => handleRequestProduct(product)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                        </svg>
                                        <span>Solicitar por WhatsApp</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="text-6xl mb-4">🛍️</div>
                    <p className="text-gray-400 text-lg">No hay productos disponibles en este momento</p>
                </div>
            )}
        </div>
    );
};

export default StorePage;
