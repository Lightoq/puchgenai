import React from 'react';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, id, ...props }) => {
    const isRange = props.type === 'range';
    
    const baseClasses = "w-full focus:ring-teal-500 focus:border-teal-500 transition";
    const rangeClasses = "h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-600";
    const textClasses = "bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-gray-200 placeholder-gray-400";

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
                {label}
            </label>
            <input
                id={id}
                {...props}
                className={`${baseClasses} ${isRange ? rangeClasses : textClasses}`}
            />
        </div>
    );
};