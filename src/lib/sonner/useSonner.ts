import { toast } from 'sonner';

export const useSonner = () => {
    const success = (message: string, description?: string) => {
        toast.success(message, {
            description,
            duration: 5000,
        });
    };

    const error = (message: string, description?: string) => {
        toast.error(message, {
            description,
            duration: 6000,
        });
    };

    const warning = (message: string, description?: string) => {
        toast.warning(message, {
            description,
        });
    };

    const info = (message: string, description?: string) => {
        toast.info(message, {
            description,
        });
    };

    const loading = (message: string, description?: string) => {
        return toast.loading(message, {
            description,
        });
    };

    const promise = (promise: Promise<any>, options: {
        loading: string;
        success: string | ((data: any) => string);
        error: string | ((error: any) => string);
    }) => {
        return toast.promise(promise, options);
    };

    const dismiss = (id?: string | number) => {
        toast.dismiss(id);
    };

    return {
        success,
        error,
        warning,
        info,
        loading,
        promise,
        dismiss
    };
};