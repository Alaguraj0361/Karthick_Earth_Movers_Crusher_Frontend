'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconPlus from '@/components/icon/icon-plus';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';

const MaintenanceTypeMaster = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const { showToast } = useToast();
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const activeTab = 'maintenance-types';
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({
        name: '',
        description: ''
    });
    const [formView, setFormView] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: json } = await api.get(`/master/${activeTab}`);
            if (json.success) setData(json.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (e: any) => {
        e.preventDefault();
        try {
            const endpoint = editItem
                ? `/master/${activeTab}/${editItem._id}`
                : `/master/${activeTab}`;

            const method = editItem ? 'put' : 'post';

            const { data: json } = await (api as any)[method](endpoint, newItem);
            if (json.success) {
                showToast(editItem ? 'Maintenance Type updated successfully!' : 'Maintenance Type added successfully!', 'success');
                setNewItem({
                    name: '',
                    description: ''
                });
                setEditItem(null);
                setFormView(false);
                fetchData();
            }
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Error saving data';
            showToast(message, 'error');
        }
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setNewItem({
            name: item.name,
            description: item.description || ''
        });
        setFormView(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { data: json } = await api.delete(`/master/${activeTab}/${deleteId}`);
            if (json.success) {
                showToast('Maintenance type deleted successfully!', 'success');
                fetchData();
            }
        } catch (error) {
            console.error(error);
            showToast('Error deleting maintenance type', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline font-bold">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Masters</span></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 font-bold text-white-dark uppercase tracking-widest text-[10px]"><span>Maintenance Types</span></li>
            </ul>

            {formView ? (
                <div className="panel shadow-2xl rounded-2xl border-none">
                    <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm ltr:mr-4 rtl:ml-4 flex items-center justify-center rounded-xl w-10 h-10 p-0 transform hover:scale-105 transition-all"
                                onClick={() => { setFormView(false); setEditItem(null); }}
                            >
                                <IconArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h5 className="text-xl font-black text-black dark:text-white-light uppercase tracking-tight">{editItem ? 'Edit Maintenance Type' : 'Create New Maintenance Type'}</h5>
                                <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Configuration Portal: Maintenance Type Master</p>
                            </div>
                        </div>
                    </div>

                    <form className="max-w-5xl mx-auto space-y-10" onSubmit={handleAdd}>
                        <div className="grid grid-cols-1 gap-8">
                            <div>
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Maintenance Type Name (பராமரிப்பு வகை)</label>
                                <input
                                    type="text"
                                    className="form-input border-2 focus:border-primary transition-all text-lg font-bold rounded-xl h-12"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    placeholder="Enter Maintenance Type Name"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-white-dark uppercase tracking-widest mb-2 block">விவரம் (Description)</label>
                                <textarea
                                    className="form-textarea border-2 font-bold rounded-xl min-h-[100px]"
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Describe the maintenance nature..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-10 border-t-2 border-primary/5">
                            <button type="button" className="btn btn-outline-danger px-10 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => { setFormView(false); setEditItem(null); }}>
                                Discard
                            </button>
                            <button type="submit" className="btn btn-primary px-14 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_20px_rgba(67,97,238,0.3)]">
                                <IconSave className="ltr:mr-2 rtl:ml-2 w-4 h-4" />
                                {editItem ? 'Update Database' : 'Finalize Entry'}
                            </button>
                        </div>
                    </form>
                </div >
            ) : (
                <div className="panel shadow-lg rounded-2xl border-none">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-xl font-black text-black dark:text-white-light uppercase tracking-tight">
                            Maintenance Types Database
                        </h5>
                        <button type="button" className="btn btn-primary shadow-[0_10px_20px_rgba(67,97,238,0.3)] rounded-xl py-2.5 px-6 font-black uppercase tracking-widest text-[10px]" onClick={() => {
                            setNewItem({
                                name: '', description: ''
                            });
                            setEditItem(null);
                            setFormView(true);
                        }}>
                            <IconPlus className="mr-2 w-4 h-4" /> Add Maintenance Type
                        </button>
                    </div>
                    <div className="table-responsive">
                        <table className="table-hover">
                            <thead>
                                <tr className="!bg-primary/5">
                                    <th className="font-black uppercase tracking-widest text-[10px] py-4 w-1/3">Maintenance Type</th>
                                    <th className="font-black uppercase tracking-widest text-[10px] py-4">Description</th>
                                    <th className="text-center font-black uppercase tracking-widest text-[10px] py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold">
                                {loading ? (
                                    <tr><td colSpan={3} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs uppercase tracking-[0.2em] text-primary">Synchronizing...</span>
                                        </div>
                                    </td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-20 text-white-dark uppercase font-black tracking-widest text-sm opacity-20">No maintenance types found</td></tr>
                                ) : (
                                    data.map((item: any) => (
                                        <tr key={item._id} className="group hover:bg-primary/5 transition-all">
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-black dark:text-white-light text-base">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-white-dark text-sm">{item.description || '-'}</td>
                                            <td className="text-center py-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button type="button" className="p-2 rounded-lg text-primary hover:bg-primary hover:text-white transition-all transform group-hover:scale-110 shadow-lg shadow-transparent hover:shadow-primary/20" onClick={() => handleEdit(item)}>
                                                        <IconEdit className="h-4.5 w-4.5" />
                                                    </button>
                                                    {isOwner && (<button type="button" className="p-2 rounded-lg text-danger hover:bg-danger hover:text-white transition-all transform group-hover:scale-110 shadow-lg shadow-transparent hover:shadow-danger/20" onClick={() => handleDelete(item._id)}>
                                                        <IconTrashLines className="h-4.5 w-4.5" />
                                                    </button>)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Maintenance Type"
                message="Are you sure you want to delete this maintenance type? This action cannot be undone."
            />
        </div >
    );
};

export default MaintenanceTypeMaster;
