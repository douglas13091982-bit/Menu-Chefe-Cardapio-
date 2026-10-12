// Loja (tenant) atual: preenchida pelo StoreProvider assim que a loja é resolvida.
let currentStoreId = ''
export const getCurrentStoreId = () => currentStoreId
export const setCurrentStoreId = (id: string) => { currentStoreId = id || '' }
