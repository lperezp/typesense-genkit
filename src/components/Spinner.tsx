
interface SpinnerProps {
    message?: string;
}

export default function Spinner({ message }: SpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center my-10">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            {message && (
                <p className='text-muted-foreground font-light mt-3 text-center'>
                    {message}
                </p>
            )}
        </div>
    );
}
