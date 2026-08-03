import { FC } from 'react';

interface IconTrendingDownProps {
    className?: string;
}

const IconTrendingDown: FC<IconTrendingDownProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                opacity="0.5"
                d="M22 17L14.6203 9.6653C13.6227 8.6737 13.1238 8.178 12.5051 8.178C11.8864 8.1781 11.3876 8.674 10.3902 9.6658L10.1509 9.9038C9.15254 10.8965 8.65338 11.3929 8.03422 11.3926C7.41506 11.3924 6.91626 10.8957 5.91867 9.9023L2 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M22.0001 11.4542V17H16.418" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default IconTrendingDown;
