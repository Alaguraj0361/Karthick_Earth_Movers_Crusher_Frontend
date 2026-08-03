import { FC } from 'react';

interface IconFileUploadProps {
    className?: string;
}

const IconFileUpload: FC<IconFileUploadProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                opacity="0.5"
                d="M17 15C19.175 14.9879 20.3529 14.8914 21.1213 14.123C22 13.2443 22 11.8301 22 9.00171V8.00171C22 5.17329 22 3.75908 21.1213 2.88041C20.2426 2.00171 18.8284 2.00171 16 2.00171H8C5.17157 2.00171 3.75736 2.00171 2.87868 2.88041C2 3.75908 2 5.17329 2 8.00171L2 9.00171C2 11.8301 2 13.2443 2.87868 14.1231C3.64706 14.8914 4.82497 14.9879 7 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path d="M12 22L12 9M12 9L9 12.5M12 9L15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default IconFileUpload;
