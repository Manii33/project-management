interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'Something went wrong', onRetry }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-500/10 dark:border-red-500/30">
      <p className="text-red-700 text-sm dark:text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
          Try again
        </button>
      )}
    </div>
  );
}