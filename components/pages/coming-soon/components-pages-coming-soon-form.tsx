'use client';
import React from 'react';

const ComponentsPagesComingSoonForm = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <form className="mb-5" onSubmit={handleSubmit}>
            <div className="relative flex">
                <input
                    type="email"
                    placeholder="Enter Email"
                    className="form-input ltr:pr-12 rtl:pl-12"
                    required
                />
                <button
                    type="submit"
                    className="btn btn-primary absolute top-1/2 -translate-y-1/2 ltr:right-1 rtl:left-1"
                >
                    Subscribe
                </button>
            </div>
        </form>
    );
};

export default ComponentsPagesComingSoonForm;
