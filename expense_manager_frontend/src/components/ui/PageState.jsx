// Reusable loading and error state components
// Used across Dashboard, ExpensesPage, ProfilePage etc.

export function LoadingState({ message = "Loading..." }) {
    return (
        <div className="flex items-center justify-center h-full min-h-48">
            <p className="text-text-secondary text-sm">{message}</p>
        </div>
    );
}

export function ErrorState({ message = "Something went wrong." }) {
    return (
        <div className="flex items-center justify-center h-full min-h-48">
            <p className="text-error text-sm">{message}</p>
        </div>
    );
}
