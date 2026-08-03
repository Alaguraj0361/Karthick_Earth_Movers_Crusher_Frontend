'use client';
import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconEdit from '@/components/icon/icon-edit';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconLockDots from '@/components/icon/icon-lock-dots';
import { useToast } from '@/components/stone-mine/toast-notification';
import DeleteConfirmModal from '@/components/stone-mine/delete-confirm-modal';
import ConfirmationModal from '@/components/stone-mine/confirmation-modal';
import PasswordResetModal from '@/components/stone-mine/password-reset-modal';
import IconEye from '@/components/icon/icon-eye';

interface User {
    _id: string;
    name: string;
    username: string;
    email?: string;
    role: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

const defaultForm = { name: '', username: '', email: '', password: '', role: 'Supervisor', status: 'active' };

const UserManagement = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const userRole = currentUser?.role?.toLowerCase() || '';
    const isOwner = userRole === 'owner';
    const canManageUsers = isOwner; // Only owner can manage users now

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState('');
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const { showToast } = useToast();
    const [form, setForm] = useState<any>(defaultForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [roleList, setRoleList] = useState<any[]>([]);
    const [resetUser, setResetUser] = useState<User | null>(null);
    const [statusChangeUser, setStatusChangeUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users');
            setUsers(data.data || []);
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await api.get('/master/roles');
            setRoleList(data.data || []);
        } catch (error) {
            console.error('Failed to load roles', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const openCreate = () => {
        setForm(defaultForm);
        setEditMode(false);
        setEditId('');
        setShowPassword(false); // Reset showPassword state
        setShowModal(true);
    };

    const openEdit = (user: User) => {
        setForm({ name: user.name, username: user.username, email: user.email || '', password: '', role: user.role, status: user.status });
        setEditMode(true);
        setEditId(user._id);
        setShowPassword(false); // Reset showPassword state
        setShowModal(true);
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editMode) {
                const payload: any = { name: form.name, username: form.username, email: form.email, role: form.role, status: form.status };
                await api.put(`/users/${editId}`, payload);
                showToast('User updated successfully', 'success');
            } else {
                await api.post('/users', form);
                showToast('User created successfully', 'success');
            }
            setShowModal(false);
            fetchUsers();
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteUser) return;
        try {
            await api.delete(`/users/${deleteUser._id}`);
            showToast('User deleted successfully', 'success');
            fetchUsers();
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Delete failed', 'error');
        } finally {
            setDeleteUser(null);
        }
    };

    const handleResetPassword = async (password: string) => {
        if (!resetUser) return;
        try {
            await api.put(`/users/${resetUser._id}/reset-password`, { newPassword: password });
            showToast('Password reset successfully', 'success');
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Reset failed', 'error');
        } finally {
            setResetUser(null);
        }
    };

    const confirmToggleStatus = async () => {
        if (!statusChangeUser) return;
        const newStatus = statusChangeUser.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/users/${statusChangeUser._id}`, { status: newStatus });
            showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
            fetchUsers();
        } catch (e: any) {
            showToast(e.response?.data?.message || 'Update failed', 'error');
        } finally {
            setStatusChangeUser(null);
        }
    };

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const roleBadge: Record<string, string> = {
        owner: 'badge bg-primary',
        accountant: 'badge bg-success',
        supervisor: 'badge bg-info',
        operator: 'badge bg-warning',
        manager: 'badge bg-secondary',
    };

    if (!isOwner && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] panel p-10">
                <div className="text-danger mb-4">
                    <IconLockDots className="w-16 h-16 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white-light mb-2">Access Denied</h2>
                <p className="text-gray-500 mb-6">You do not have permission to access User Management. Only owners can view or manage users.</p>
                <a href="/" className="btn btn-primary">Go to Dashboard</a>
            </div>
        );
    }

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-6">
                <li><a href="/" className="text-primary hover:underline">Dashboard</a></li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2"><span>User Management</span></li>
            </ul>

            <div className="panel">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <h5 className="text-lg font-semibold dark:text-white-light">
                        👥 User &amp; Role Management
                    </h5>
                    <div className="flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="form-input w-48"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {canManageUsers && (
                            <button className="btn btn-primary gap-2" onClick={openCreate}>
                                <IconUserPlus className="w-4 h-4" />
                                Add User
                            </button>
                        )}
                    </div>
                </div>

                {/* Role Access Info */}
                <div className="mb-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border-l-4 border-primary bg-primary/10 p-3">
                        <div className="font-semibold text-primary">Owner</div>
                        <div className="text-[10px] mt-1 text-white-dark uppercase font-bold tracking-widest">Master Access</div>
                    </div>
                    {roleList.filter(r => r.name.toLowerCase() !== 'owner').map(r => (
                        <div key={r._id} className="rounded-lg border-l-4 border-info bg-info/10 p-3">
                            <div className="font-semibold text-info">{r.name}</div>
                            <div className="text-[10px] mt-1 text-white-dark uppercase font-bold tracking-widest truncate">{r.description || 'Custom Role'}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                {canManageUsers && <th className="text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={canManageUsers ? 8 : 7} className="text-center py-6">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={canManageUsers ? 8 : 7} className="text-center py-6 text-gray-400">No users found</td></tr>
                            ) : filtered.map((u, i) => (
                                <tr key={u._id}>
                                    <td>{i + 1}</td>
                                    <td className="font-semibold capitalize">{u.name}</td>
                                    <td className="text-gray-500">@{u.username}</td>
                                    <td>{u.email || '—'}</td>
                                    <td><span className={roleBadge[u.role.toLowerCase()] || 'badge bg-secondary'}>{u.role}</span></td>
                                    <td>
                                        {canManageUsers ? (
                                            <button
                                                className={`badge cursor-pointer ${u.status === 'active' ? 'bg-success' : 'bg-danger'}`}
                                                onClick={() => setStatusChangeUser(u)}
                                                title="Click to toggle status"
                                            >
                                                {u.status}
                                            </button>
                                        ) : (
                                            <span className={`badge ${u.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{u.status}</span>
                                        )}
                                    </td>
                                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                    {canManageUsers && (
                                        <td>
                                            {/* Hide management icons for Owners if the current user is an Accountant */}
                                            {(isOwner || u.role.toLowerCase() !== 'owner') ? (
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary px-2"
                                                        title="Edit"
                                                        onClick={() => openEdit(u)}
                                                    >
                                                        <IconEdit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning px-2"
                                                        title="Reset Password"
                                                        onClick={() => setResetUser(u)}
                                                    >
                                                        <IconLockDots className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger px-2"
                                                        title="Delete"
                                                        onClick={() => setDeleteUser(u)}
                                                        disabled={u._id === currentUser?.id}
                                                    >
                                                        <IconTrashLines className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center text-xs text-gray-400 italic">Restricted</div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="panel w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="text-lg font-semibold">{editMode ? 'Edit User' : 'Create New User'}</h5>
                            <button className="text-gray-400 hover:text-danger text-xl font-bold" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label>Full Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    placeholder="Enter Full Name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Username <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-input mt-1"
                                    placeholder="Enter Username"
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-input mt-1"
                                    placeholder="Enter Email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            {!editMode && (
                                <div>
                                    <label>Password <span className="text-danger">*</span></label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-input mt-1 pe-12"
                                            placeholder="Enter Password"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="absolute end-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? 'Hide Password' : 'Show Password'}
                                        >
                                            <IconEye fill={showPassword} className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label>Role <span className="text-danger">*</span></label>
                                <select
                                    className="form-select mt-1 font-bold"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    required
                                >
                                    <option value="">Select a Role</option>
                                    <option value="Owner">Owner (Master)</option>
                                    {roleList.filter(r => r.name.toLowerCase() !== 'owner').map(r => (
                                        <option key={r._id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            {editMode && (
                                <div>
                                    <label>Status</label>
                                    <select
                                        className="form-select mt-1"
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" className="btn btn-outline-danger" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editMode ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                show={!!deleteUser}
                onCancel={() => setDeleteUser(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteUser?.name}"? This cannot be undone.`}
            />

            <PasswordResetModal
                show={!!resetUser}
                title="Reset User Password"
                userName={resetUser?.name || ''}
                onCancel={() => setResetUser(null)}
                onConfirm={handleResetPassword}
            />

            <ConfirmationModal
                show={!!statusChangeUser}
                title={statusChangeUser?.status === 'active' ? 'Deactivate User?' : 'Activate User?'}
                message={`Are you sure you want to set "${statusChangeUser?.name}" to ${statusChangeUser?.status === 'active' ? 'Inactive' : 'Active'}?`}
                type="question"
                confirmText="Yes, Update Status"
                onCancel={() => setStatusChangeUser(null)}
                onConfirm={confirmToggleStatus}
            />
        </div>
    );
};

export default UserManagement;
