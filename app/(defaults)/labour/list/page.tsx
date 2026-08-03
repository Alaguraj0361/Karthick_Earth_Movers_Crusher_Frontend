'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconPlus from '@/components/icon/icon-plus';
import IconSave from '@/components/icon/icon-save';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconArrowLeft from '@/components/icon/icon-arrow-left';
import IconEye from '@/components/icon/icon-eye';
import Link from 'next/link';
import api from '@/utils/api';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import { canEditRecord } from '@/utils/permissions';

const LabourListPage = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';
    const canSeeFinancials = currentUser?.role?.toLowerCase() !== 'supervisor';

    const [data, setData] = useState<any[]>([]);
    const [workTypes, setWorkTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formView, setFormView] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        address: '',
        workType: '',
        wage: '',
        wageType: 'Daily',
        labourType: 'Direct',
        contractor: '',
        joiningDate: new Date().toISOString().split('T')[0],
        description: '',
        status: 'active'
    });

    const [filters, setFilters] = useState({
        search: '',
        workType: '',
        startDate: '',
        endDate: '',
        status: 'active'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [labourRes, workTypesRes] = await Promise.all([
                api.get('/labour'),
                api.get('/master/work-types')
            ]);
            if (labourRes.data.success) setData(labourRes.data.data);
            if (workTypesRes.data.success) setWorkTypes(workTypesRes.data.data);
        } catch (error) {
            console.error(error);
            showToast('Error fetching data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.labourType === 'Direct') {
                payload.contractor = '';
            }

            const endpoint = editItem ? `/labour/${editItem._id}` : '/labour';
            const method = editItem ? 'put' : 'post';

            const { data: json } = await (api as any)[method](endpoint, payload);
            if (json.success) {
                showToast(editItem ? 'Labour profile updated successfully' : 'New labour profile added successfully', 'success');
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.error || 'Error saving data', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            mobile: '',
            address: '',
            workType: workTypes[0]?.name || '',
            wage: '',
            wageType: 'Daily',
            labourType: 'Direct',
            contractor: '',
            joiningDate: new Date().toISOString().split('T')[0],
            description: '',
            status: 'active'
        });
        setEditItem(null);
        setFormView(false);
    };

    const handleEdit = (item: any) => {
        setEditItem(item);
        setFormData({
            name: item.name,
            mobile: item.mobile || '',
            address: item.address || '',
            workType: item.workType || '',
            wage: item.wage || '',
            wageType: item.wageType || 'Daily',
            labourType: 'Direct',
            contractor: '',
            joiningDate: item.joiningDate ? new Date(item.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: item.description || '',
            status: item.status || 'active'
        });
        setFormView(true);
    };

    const toggleStatus = async (item: any) => {
        try {
            const newStatus = item.status === 'active' ? 'inactive' : 'active';
            const { data: json } = await api.put(`/labour/${item._id}`, { status: newStatus });
            if (json.success) {
                showToast(`Labour profile ${newStatus === 'active' ? 'activated' : 'inactivated'} successfully`, 'success');
                fetchData();
            }
        } catch (error) {
            console.error(error);
            showToast('Error updating status', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const { data: json } = await api.delete(`/labour/${deleteId}`);
            if (json.success) {
                showToast('Labour profile has been deleted.', 'success');
                fetchData();
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to delete labour profile', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const filteredLabours = data.filter(item => {
        // Search filter (Name)
        if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;

        // Work Type filter
        if (filters.workType && item.workType !== filters.workType) return false;

        // Date filter (Joining Date)
        if (filters.startDate || filters.endDate) {
            const joinDate = new Date(item.joiningDate).toISOString().split('T')[0];
            if (filters.startDate && joinDate < filters.startDate) return false;
            if (filters.endDate && joinDate > filters.endDate) return false;
        }

        // Status filter
        if (filters.status && item.status !== filters.status) return false;

        return true;
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white-light uppercase">Labour Database</h2>
                    <p className="text-white-dark text-sm mt-1">Manage and track all direct and contractor labour records.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="btn btn-primary gap-2"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, labourType: 'Direct' }));
                            setFormView(true);
                        }}
                    >
                        <IconPlus />
                        Add New Labour
                    </button>
                </div>
            </div>

            {formView ? (
                <div className="panel shadow-2xl rounded-3xl border-none">
                    <div className="mb-8 flex items-center justify-between border-b border-[#ebedf2] dark:border-[#1b2e4b] pb-5">
                        <div className="flex items-center">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm ltr:mr-4 rtl:ml-4 flex items-center justify-center rounded-xl w-10 h-10 p-0 transform hover:scale-105 transition-all"
                                onClick={resetForm}
                            >
                                <IconArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h5 className="text-xl font-black dark:text-white-light tracking-tight">{editItem ? 'Edit Labour Profile' : 'Add New Labour'}</h5>
                                <p className="text-primary text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Register Employee (தொழிலாளர் விவரங்களைப் பதிவு செய்யவும்)</p>
                            </div>
                        </div>
                    </div>

                    <form className="max-w-4xl mx-auto space-y-8" onSubmit={handleSubmit}>
                        {/* Section 1: Personal & Work Info */}
                        <div className="space-y-5 bg-info/5 p-6 rounded-2xl border border-info/10 shadow-sm">
                            <div className="flex items-center gap-2 text-info font-black uppercase text-[10px] tracking-widest border-b border-info/10 pb-2 mb-4">
                                <IconPlus className="w-4 h-4" />
                                1. Personal &amp; Work Information (தனிப்பட்ட விவரங்கள்)
                            </div>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                <div className="md:col-span-2 lg:col-span-1">
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Labour Name (பெயர்)</label>
                                    <input type="text" name="name" className="form-input border-info focus:ring-info font-bold rounded-xl h-11" value={formData.name} onChange={handleChange} required placeholder="Enter full name" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Mobile number (தொலைபேசி)</label>
                                    <input type="text" name="mobile" className="form-input font-bold rounded-xl h-11" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Joining Date (சேர்ந்த நாள்)</label>
                                    <input type="date" name="joiningDate" className="form-input font-bold rounded-xl h-11" value={formData.joiningDate} onChange={handleChange} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Address (முகவரி)</label>
                                    <input type="text" name="address" className="form-input font-bold rounded-xl h-11" value={formData.address} onChange={handleChange} placeholder="Full address" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Work Type (வேலை வகை)</label>
                                    <select
                                        name="workType"
                                        className="form-select font-bold rounded-xl h-11"
                                        value={formData.workType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Work Type</option>
                                        {workTypes.map((type: any) => (
                                            <option key={type._id} value={type.name}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {canSeeFinancials && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Wage Amount (சம்பளம்)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-info font-black">₹</span>
                                                <input
                                                    type="number"
                                                    name="wage"
                                                    className="form-input pl-8 font-black border-info rounded-xl h-11"
                                                    value={formData.wage}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Wage Type (சம்பள முறை)</label>
                                            <select
                                                name="wageType"
                                                className="form-select font-bold rounded-xl h-11"
                                                value={formData.wageType}
                                                onChange={handleChange}
                                            >
                                                <option value="Daily">Daily Wage (தினக்கூலி)</option>
                                                <option value="Monthly">Monthly Salary (மாதச் சம்பளம்)</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="text-[10px] font-black text-white-dark uppercase mb-2 block">Account Status (நிலை)</label>
                                    <select name="status" className="form-select font-bold rounded-xl h-11" value={formData.status} onChange={handleChange}>
                                        <option value="active">Active (வேலையில் உள்ளார்)</option>
                                        <option value="inactive">Inactive (வேலையில் இல்லை)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest border-b border-primary/10 pb-2">
                                <IconEdit className="w-4 h-4" />
                                Remarks
                            </div>
                            <textarea name="description" className="form-textarea min-h-[100px] font-bold rounded-2xl" value={formData.description} onChange={handleChange} placeholder="Optional notes..."></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-10 border-t border-[#ebedf2] dark:border-[#1b2e4b]">
                            <button type="button" className="btn btn-outline-danger px-10 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary px-14 h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_10px_20px_rgba(67,97,238,0.3)]">
                                <IconSave className="ltr:mr-2 rtl:ml-2 w-4 h-4" />
                                {editItem ? 'Update Profile' : 'Save Labour'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="panel p-0 border-none shadow-none bg-transparent">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-5 bg-primary/10 p-4 rounded-xl items-end">
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark mb-1 block ml-1">Search Employee Name</label>
                            <input
                                type="text"
                                className="form-input rounded-xl border-none shadow-sm font-bold text-xs h-10"
                                placeholder="Start typing name..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark mb-1 block ml-1">Work Category</label>
                            <select
                                className="form-select rounded-xl border-none shadow-sm font-bold text-xs h-10"
                                value={filters.workType}
                                onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
                            >
                                <option value="">All Categories</option>
                                {workTypes.map((type: any) => (
                                    <option key={type._id} value={type.name}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark mb-1 block ml-1">Joining From</label>
                            <input
                                type="date"
                                className="form-input rounded-xl border-none shadow-sm font-bold text-xs h-10"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark mb-1 block ml-1">Joining To</label>
                            <input
                                type="date"
                                className="form-input rounded-xl border-none shadow-sm font-bold text-xs h-10"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-white-dark mb-1 block ml-1">Account Status</label>
                            <select
                                className="form-select rounded-xl border-none shadow-sm font-bold text-xs h-10"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active (Active Only)</option>
                                <option value="inactive">Inactive (Resigned/Left)</option>
                            </select>
                        </div>
                        <div>
                            <button
                                className="btn btn-outline-danger btn-sm flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl hover:bg-danger hover:text-white transition-all w-full shadow-sm bg-white dark:bg-dark"
                                onClick={() => setFilters({ search: '', workType: '', startDate: '', endDate: '', status: 'active' })}
                            >
                                <IconTrashLines className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th className="font-black uppercase tracking-widest text-[10px] py-4">Labour Name</th>
                                        <th className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Work Type</th>
                                        <th className="font-black uppercase tracking-widest text-[10px] py-4">Mobile</th>
                                        {canSeeFinancials && <th className="font-black uppercase tracking-widest text-[10px] py-4">Wage Rate</th>}
                                        <th className="font-black uppercase tracking-widest text-[10px] py-4">Join Date</th>
                                        <th className="text-center font-black uppercase tracking-widest text-[10px] py-4 whitespace-nowrap">Status (நிலை)</th>
                                        <th className="text-center font-black uppercase tracking-widest text-[10px] py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="font-bold">
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-24">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs uppercase tracking-[0.2em] text-primary font-black">Synchronizing Registry...</span>
                                            </div>
                                        </td></tr>
                                    ) : filteredLabours.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-24 text-white-dark uppercase font-black tracking-widest text-sm opacity-20">No {filters.status || 'matching'} labours found</td></tr>
                                    ) : (
                                        filteredLabours.map((item: any) => (
                                            <tr key={item._id} className="group hover:bg-primary/5 transition-all">
                                                <td className="font-black text-primary py-4 text-base tracking-tight">{item.name}</td>
                                                <td className="py-4 text-center">
                                                    <span className="badge badge-outline-info rounded-lg font-black text-[9px] uppercase tracking-widest bg-info/5 px-2.5 py-1.5">{item.workType}</span>
                                                </td>
                                                <td className="py-4 text-white-dark">{item.mobile || '-'}</td>
                                                {canSeeFinancials && (
                                                    <td className="py-4">
                                                        <div className="font-black text-black dark:text-white-light text-base">₹{item.wage}</div>
                                                        <div className="text-[9px] text-primary uppercase font-bold tracking-widest mt-0.5">{item.wageType === 'Daily' ? 'Per Day' : 'Per Month'}</div>
                                                    </td>
                                                )}
                                                <td className="py-4 font-medium">{new Date(item.joiningDate).toLocaleDateString()}</td>
                                                <td className="text-center py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatus(item)}
                                                        className={`badge rounded-lg font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 transition-all hover:scale-105 ${item.status === 'active' ? 'badge-outline-success bg-success/5' : 'badge-outline-danger bg-danger/5'}`}
                                                    >
                                                        {item.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                                    </button>
                                                </td>
                                                <td className="text-center py-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Link href={`/labour/list/${item._id}`} className="p-2 rounded-xl text-info hover:bg-info/10 transition-all">
                                                            <IconEye className="h-4 w-4" />
                                                        </Link>
                                                        {canEditRecord(currentUser, item.createdAt) && (
                                                            <button type="button" className="p-2 rounded-xl text-primary hover:bg-primary/10 transition-all" onClick={() => handleEdit(item)}>
                                                                <IconEdit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {isOwner && (<button type="button" className="p-2 rounded-xl text-danger hover:bg-danger/10 transition-all" onClick={() => setDeleteId(item._id)}>
                                                            <IconTrashLines className="h-4 w-4" />
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
                </div>
            )}
            <DeleteConfirmModal
                show={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Labour Profile"
                message="Are you sure you want to delete this labour profile? This action is permanent and cannot be undone."
            />
        </div>
    );
};

export default LabourListPage;
