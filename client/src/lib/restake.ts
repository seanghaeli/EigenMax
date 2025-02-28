import type { Protocol } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface RestakeResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeRestake(
  strategy: string,
  selectedProtocols: Protocol[]
): Promise<RestakeResult> {
  try {
    // Make API call to perform restaking
    const response = await apiRequest("/api/vaults/1/optimize-restake", {
      method: "POST",
      body: {
        strategy,
        protocols: selectedProtocols.map(p => p.id)
      }
    });

    if (response.vault) {
      return {
        success: true,
        message: "Successfully restaked with selected protocols",
        data: response
      };
    }

    return {
      success: false,
      message: response.message || "No profitable restaking opportunity found"
    };
  } catch (error) {
    console.error("Error executing restake:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to execute restaking"
    };
  }
}
