import { redirect } from 'next/navigation';

const BoxedSignUp = () => {
    redirect('/login');
    return null;
};

export default BoxedSignUp;
