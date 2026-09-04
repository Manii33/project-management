interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'Something went wrong', onRetry }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700 text-sm break-words">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm text-red-600 underline hover:text-red-800 min-h-[44px] px-2 -ml-2 py-2 sm:min-h-0 sm:ml-0 sm:px-0 sm:py-0">
          Try again
        </button>
      )}
    </div>
  );
}