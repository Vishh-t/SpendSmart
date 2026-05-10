import { createContext, useContext, useState } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
    const [refreshKey, setRefreshKey] = useState(0);

    function triggerRefresh() {
        setRefreshKey(prev => prev + 1);
    }

    return (
        <DataContext.Provider value={{ refreshKey, triggerRefresh }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    return useContext(DataContext);
}
