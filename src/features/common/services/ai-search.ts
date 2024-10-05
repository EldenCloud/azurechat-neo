import { DefaultAzureCredential } from "@azure/identity";
import {
  AzureKeyCredential,
  SearchClient,
  SearchIndexClient,
  SearchIndexerClient,
} from "@azure/search-documents";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";


export const AzureAISearchCredentials = () => {
  const apiKey = process.env.AZURE_SEARCH_API_KEY;
  const searchName = process.env.AZURE_SEARCH_NAME;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME;

  if (!apiKey || !searchName || !indexName) {
    throw new Error(
      "One or more Azure AI Search environment variables are not set"
    );
  }
  const endpointSuffix = process.env.AZURE_SEARCH_ENDPOINT_SUFFIX || "search.windows.net";

  const endpoint = `https://${searchName}.${endpointSuffix}`;
  return {
    apiKey,
    endpoint,
    indexName,
  };
};

export const AzureAISearchInstance = <T extends object>() => {
  const { apiKey, endpoint, indexName } = AzureAISearchCredentials();
  const credential = USE_MANAGED_IDENTITIES
  ? new DefaultAzureCredential()
  : new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
  const searchClient = new SearchClient<T>(
    endpoint,
    indexName,
    credential
  );

  return searchClient;
};

export const AzureAISearchIndexClientInstance = () => {
  const { apiKey, endpoint } = AzureAISearchCredentials();
  const credential = USE_MANAGED_IDENTITIES
  ? new DefaultAzureCredential()
  : new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
  const searchClient = new SearchIndexClient(
    endpoint,
    credential
  );  

  return searchClient;
};

export const AzureAISearchIndexerClientInstance = () => {
  const { apiKey, endpoint } = AzureAISearchCredentials();
  const credential = USE_MANAGED_IDENTITIES
  ? new DefaultAzureCredential()
  : new AzureKeyCredential(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
  const client = new SearchIndexerClient(
    endpoint,
    credential
  );

  return client;
};
