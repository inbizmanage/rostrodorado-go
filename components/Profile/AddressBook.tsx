import React, { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../Layout/Navbar';
import Footer from '../Layout/Footer';

import { Address, UserProfile } from '../../types';
import { MapPin, Plus, Trash2, Home, Star, Check, Pencil } from 'lucide-react';
import { COLOMBIA_DATA } from '../../data/colombia';
import CustomSelect from '../CustomSelect';

// Simple ID generator if uuid is not available
const generateId = () => Math.random().toString(36).substr(2, 9);

interface AddressBookProps {
    isModal?: boolean;
    onClose?: () => void;
}

const AddressBook: React.FC<AddressBookProps> = ({ isModal = false, onClose }) => {
    const { currentUser } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newAddress, setNewAddress] = useState<Partial<Address>>({
        name: 'Casa',
        recipientName: '',
        phone: '',
        address: '',
        department: '',
        city: '',
        postalCode: '',
        notes: '',
        isDefault: false
    });

    useEffect(() => {
        const fetchAndSyncAddresses = async () => {
            if (!currentUser) return;
            try {
                // 1. Fetch User's Current Saved Addresses
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                let currentAddresses: Address[] = [];

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data() as UserProfile;
                    currentAddresses = data.addresses || [];
                }

                // 2. Fetch Orders to find historical addresses
                const ordersRef = collection(db, 'orders');
                // Query by Email to capture Guest orders too
                const q = query(ordersRef, where('customer.email', '==', currentUser.email));
                const orderSnap = await getDocs(q);

                const newAddressesToAdd: Address[] = [];
                const seenAddresses = new Set(currentAddresses.map(a => `${a.address}-${a.city}`.toLowerCase()));

                orderSnap.forEach(doc => {
                    const orderData = doc.data();
                    const cust = orderData.customer;

                    if (cust && cust.address && cust.city) {
                        const uniqueKey = `${cust.address}-${cust.city}`.toLowerCase();

                        if (!seenAddresses.has(uniqueKey)) {
                            // Found a new address from history!
                            seenAddresses.add(uniqueKey); // Prevent adding same order address multiple times in this loop

                            newAddressesToAdd.push({
                                id: generateId(),
                                name: 'Dirección de Pedido', // Default Label
                                recipientName: `${cust.firstName} ${cust.lastName}`,
                                phone: cust.phone || '',
                                address: cust.address,
                                department: cust.department,
                                city: cust.city,
                                postalCode: cust.postalCode || '',
                                notes: cust.notes || '',
                                isDefault: currentAddresses.length === 0 && newAddressesToAdd.length === 0 // Make default if it's the very first
                            });
                        }
                    }
                });

                if (newAddressesToAdd.length > 0) {
                    // 3. Merge and Save to Firestore
                    const updatedAddresses = [...currentAddresses, ...newAddressesToAdd];
                    await updateDoc(userDocRef, {
                        addresses: updatedAddresses
                    });
                    setAddresses(updatedAddresses);
                    console.log(`Synced ${newAddressesToAdd.length} addresses from order history.`);
                } else {
                    setAddresses(currentAddresses);
                }

            } catch (error) {
                console.error("Error fetching/syncing addresses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndSyncAddresses();
    }, [currentUser]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
    };

    const cities = COLOMBIA_DATA.find(d => d.departamento === newAddress.department)?.ciudades || [];

    const handleEdit = (address: Address) => {
        setEditingId(address.id);
        setNewAddress({
            name: address.name,
            recipientName: address.recipientName,
            phone: address.phone,
            address: address.address,
            department: address.department,
            city: address.city,
            postalCode: address.postalCode || '',
            notes: address.notes || '',
            isDefault: address.isDefault
        });
        setIsAdding(true);
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            let updatedAddresses = [...addresses];

            if (editingId) {
                // Update existing address
                updatedAddresses = updatedAddresses.map(addr => {
                    if (addr.id === editingId) {
                        return {
                            ...addr,
                            name: newAddress.name || 'Casa',
                            recipientName: newAddress.recipientName || '',
                            phone: newAddress.phone || '',
                            address: newAddress.address || '',
                            department: newAddress.department || '',
                            city: newAddress.city || '',
                            postalCode: newAddress.postalCode || '',
                            notes: newAddress.notes || '',
                            isDefault: newAddress.isDefault
                        } as Address;
                    }
                    return addr;
                });

                // If updated address is set to default, unset others
                if (newAddress.isDefault) {
                    updatedAddresses = updatedAddresses.map(a =>
                        a.id === editingId ? a : { ...a, isDefault: false }
                    );
                }

            } else {
                // Add new address
                const addressToAdd: Address = {
                    id: generateId(),
                    name: newAddress.name || 'Casa',
                    recipientName: newAddress.recipientName || currentUser.displayName || '',
                    phone: newAddress.phone || '',
                    address: newAddress.address || '',
                    department: newAddress.department || '',
                    city: newAddress.city || '',
                    postalCode: newAddress.postalCode || '',
                    notes: newAddress.notes || '',
                    isDefault: addresses.length === 0 || newAddress.isDefault // First address is always default
                };

                // If new address is default, remove default from others
                if (addressToAdd.isDefault) {
                    updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
                }
                updatedAddresses.push(addressToAdd);
            }

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                addresses: updatedAddresses
            });

            setAddresses(updatedAddresses);
            setIsAdding(false);
            setEditingId(null);
            setNewAddress({
                name: 'Casa',
                recipientName: '',
                phone: '',
                address: '',
                department: '',
                city: '',
                postalCode: '',
                notes: '',
                isDefault: false
            });
        } catch (error) {
            console.error("Error saving address:", error);
        } finally {
            setLoading(false);
        }
    };

    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setAddressToDelete(id);
    };

    const confirmDelete = async () => {
        if (!currentUser || !addressToDelete) return;

        try {
            const id = addressToDelete;
            const addressToDeleteObj = addresses.find(a => a.id === id);
            if (!addressToDeleteObj) return;

            const updatedAddresses = addresses.filter(a => a.id !== id);

            // If we deleted the default, make the first one default (if exists)
            if (addressToDeleteObj.isDefault && updatedAddresses.length > 0) {
                updatedAddresses[0].isDefault = true;
            }

            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                addresses: updatedAddresses
            });

            setAddresses(updatedAddresses);

            // If we were editing this address, clear form
            if (editingId === id) {
                setIsAdding(false);
                setEditingId(null);
                setNewAddress({
                    name: 'Casa',
                    recipientName: '',
                    phone: '',
                    address: '',
                    department: '',
                    city: '',
                    postalCode: '',
                    notes: '',
                    isDefault: false
                });
            }
        } catch (error) {
            console.error("Error deleting address:", error);
        } finally {
            setAddressToDelete(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        if (!currentUser) return;

        const updatedAddresses = addresses.map(a => ({
            ...a,
            isDefault: a.id === id
        }));

        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            addresses: updatedAddresses
        });
        setAddresses(updatedAddresses);
    };

    const content = (
        <div className={`w-full ${isModal ? 'bg-[#0a0a0a] rounded-xl relative p-8 md:p-12' : 'flex-grow pt-32 pb-24 px-6 md:px-12 max-w-[1000px] mx-auto'}`}>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Mis Direcciones</h1>
                    <p className="text-white/50 text-sm">Gestiona tus lugares de entrega</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding) {
                            setIsAdding(false);
                            setEditingId(null);
                            setNewAddress({
                                name: 'Casa',
                                recipientName: '',
                                phone: '',
                                address: '',
                                department: '',
                                city: '',
                                postalCode: '',
                                notes: '',
                                isDefault: false
                            });
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    className="bg-white/5 hover:bg-gold hover:text-black text-white px-5 py-3 rounded-lg flex items-center gap-2 transition-all border border-white/10 text-sm font-bold uppercase tracking-wider"
                >
                    {isAdding ? 'Cancelar' : <><Plus size={16} /> Agregar Nueva</>}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', transitionEnd: { overflow: 'visible' } }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        onSubmit={handleAddAddress}
                        className="bg-white/5 border border-white/10 p-6 rounded-xl mb-8"
                    >
                        <h3 className="text-lg text-white font-serif mb-4">{editingId ? 'Editar Dirección' : 'Nueva Dirección'}</h3>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-white/50">Nombre del lugar</label>
                                <input placeholder="Ej: Casa, Oficina" name="name" value={newAddress.name} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-white/50">Destinatario</label>
                                <input placeholder="Nombre de quien recibe" name="recipientName" value={newAddress.recipientName} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-white/50">Teléfono</label>
                                <input type="tel" name="phone" value={newAddress.phone} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-white/50">Dirección</label>
                                <input name="address" value={newAddress.address} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none" required />
                            </div>

                            <CustomSelect
                                label="Departamento"
                                value={newAddress.department || ''}
                                onChange={(val) => setNewAddress(prev => ({ ...prev, department: val, city: '' }))}
                                options={COLOMBIA_DATA.map(d => d.departamento)}
                                placeholder="Seleccionar..."
                            />

                            <CustomSelect
                                label="Ciudad"
                                value={newAddress.city || ''}
                                onChange={(val) => setNewAddress(prev => ({ ...prev, city: val }))}
                                options={cities}
                                disabled={!newAddress.department}
                                placeholder="Seleccionar..."
                            />

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-white/50">Código Postal (Opcional)</label>
                                <input name="postalCode" value={newAddress.postalCode || ''} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-gold outline-none" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <input type="checkbox" id="isDefault" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} className="accent-gold w-4 h-4" />
                            <label htmlFor="isDefault" className="text-white/70 text-xs">Establecer como dirección predeterminada</label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-gold text-black font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:bg-white transition-colors text-sm">
                            {loading ? 'Guardando...' : 'Guardar Dirección'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {addresses.map((addr) => (
                    <motion.div
                        key={addr.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-xl border transition-all relative group ${addr.isDefault ? 'bg-gold/10 border-gold/30' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                    >
                        {addr.isDefault && (
                            <div className="absolute top-3 right-3 bg-gold text-black text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                <Check size={10} /> Default
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-3 text-gold">
                            <Home size={16} />
                            <h3 className="font-serif text-lg text-white">{addr.name}</h3>
                        </div>

                        <div className="space-y-1 text-xs text-white/70 mb-4">
                            <p><span className="text-white/30 uppercase w-12 inline-block">Para:</span> {addr.recipientName}</p>
                            <p><span className="text-white/30 uppercase w-12 inline-block">Tel:</span> {addr.phone}</p>
                            <p><span className="text-white/30 uppercase w-12 inline-block">Dir:</span> {addr.address}</p>
                            <p><span className="text-white/30 uppercase w-12 inline-block">Ubic:</span> {addr.city}, {addr.department} {addr.postalCode ? `- ${addr.postalCode}` : ''}</p>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!addr.isDefault && (
                                <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] uppercase tracking-wider text-white/50 hover:text-gold flex items-center gap-1">
                                    <Star size={10} /> Hacer default
                                </button>
                            )}
                            <button onClick={() => handleDelete(addr.id)} className="text-[10px] uppercase tracking-wider text-red-500/70 hover:text-red-500 flex items-center gap-1 ml-auto">
                                <Trash2 size={10} /> Eliminar
                            </button>
                            <button onClick={() => handleEdit(addr)} className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white flex items-center gap-1 ml-2">
                                <Pencil size={10} /> Editar
                            </button>
                        </div>
                    </motion.div>
                ))}

                {addresses.length === 0 && !loading && !isAdding && (
                    <div className="col-span-full text-center py-12 text-white/30">
                        <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tienes direcciones guardadas.</p>
                    </div>
                )}
            </div>

            {/* Close button for Modal */}
            {onClose && (
                <button onClick={onClose} className="mt-6 w-full text-center text-white/50 hover:text-white text-xs uppercase tracking-widest">
                    Cerrar
                </button>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {addressToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl"
                        >
                            <h3 className="text-xl font-serif text-white mb-2">Eliminar Dirección</h3>
                            <p className="text-white/60 text-sm mb-6">
                                ¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer.
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setAddressToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-all"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

    if (isModal) {
        return content;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0a] selection:bg-gold selection:text-white">
            <Navbar />
            {content}
            <Footer />
        </div>
    );
};

export default AddressBook;
