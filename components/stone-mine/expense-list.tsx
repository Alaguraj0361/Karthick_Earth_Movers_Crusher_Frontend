'use client';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import IconEdit from '@/components/icon/icon-edit';
import api from '@/utils/api';
import { canEditRecord } from '@/utils/permissions';
import IconTrashLines from '@/components/icon/icon-trash-lines';

const ExpenseList = () => {
    const currentUser = useSelector((state: IRootState) => state.auth.user);
    const isOwner = currentUser?.role?.toLowerCase() === 'owner';

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const { data } = await api.get('/expenses');
            if (data.success) {
                setExpenses(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">சமீபத்திய செலவுகள் (Recent Expenses)</h5>
            </div>
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Vehicle/Machine</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center">Loading...</td>
                            </tr>
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center">No expenses found.</td>
                            </tr>
                        ) : (
                            expenses.map((expense: any) => (
                                <tr key={expense._id}>
                                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${expense.category === 'Diesel' ? 'bg-primary' :
                                            expense.category === 'Labour Wages' ? 'bg-success' :
                                                expense.category === 'Explosive Cost' ? 'bg-danger' : 'bg-info'
                                            }`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td>{expense.vehicleOrMachine || '-'}</td>
                                    <td className="font-bold text-primary">₹{expense.amount.toLocaleString()}</td>
                                    <td>{expense.paymentMode}</td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-2">
                                            {canEditRecord(currentUser, expense.createdAt || expense.date) ? (
                                                <button type="button" className="btn btn-sm btn-outline-primary">
                                                    <IconEdit className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-white-dark italic">Locked</span>
                                            )}
                                            {isOwner && (
                                                <button type="button" className="btn btn-sm btn-outline-danger">
                                                    <IconTrashLines className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseList;
