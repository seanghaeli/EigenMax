interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, handler: (params: any) => void) => void;
    removeListener: (eventName: string, handler: (params: any) => void) => void;
  };
}
