'use client';
import React from 'react';

const ComponentsPagesContactUsForm = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <input type="text" placeholder="Full Name" className="form-input" required />
            </div>
            <div>
                <input type="email" placeholder="Email" className="form-input" required />
            </div>
            <div>
                <input type="text" placeholder="Subject" className="form-input" required />
            </div>
            <div>
                <textarea
                    rows={4}
                    placeholder="Message"
                    className="form-textarea resize-none"
                    required
                ></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full">
                Submit
            </button>
        </form>
    );
};

export default ComponentsPagesContactUsForm;
