import {
  AzureKeyCredential,
  SearchClient,
  SearchIndexClient,
  SearchIndexerClient,
} from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";

// Check if the app should use a managed identity
const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

const getSearchCredential = () => {
  if (USE_MANAGED_IDENTITIES) {
    // Return DefaultAzureCredential for managed identity
    return new DefaultAzureCredential();
  } else {
    // Fall back to using the API key
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    if (!apiKey) {
      throw new Error("Azure AI Search API key is not provided in environment variables.");
    }
    return new AzureKeyCredential(apiKey);
  }
};

export const AzureAISearchCredentials = () => {
  const searchName = process.env.AZURE_SEARCH_NAME;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME;

  if (!searchName || !indexName) {
    throw new Error(
      "One or more Azure AI Search environment variables are not set"
    );
  }
  
  const endpointSuffix = process.env.AZURE_SEARCH_ENDPOINT_SUFFIX || "search.windows.net";
  const endpoint = `https://${searchName}.${endpointSuffix}`;
  
  return {
    endpoint,
    indexName,
  };
};

export const AzureAISearchInstance = <T extends object>() => {
  const { endpoint, indexName } = AzureAISearchCredentials();
  const credential = getSearchCredential();

  return new SearchClient<T>(endpoint, indexName, credential);
};

export const AzureAISearchIndexClientInstance = () => {
  const { endpoint } = AzureAISearchCredentials();
  const credential = getSearchCredential();

  return new SearchIndexClient(endpoint, credential);
};

export const AzureAISearchIndexerClientInstance = () => {
  const { endpoint } = AzureAISearchCredentials();
  const credential = getSearchCredential();

  return new SearchIndexerClient(endpoint, credential);
};
