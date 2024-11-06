import {
  AzureKeyCredential,
  SearchClient,
  SearchIndexClient,
  SearchIndexerClient,
} from "@azure/search-documents";
import { DefaultAzureCredential } from "@azure/identity";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";
const endpointSuffix = process.env.AZURE_SEARCH_ENDPOINT_SUFFIX || "search.windows.net";
const apiKey = process.env.AZURE_SEARCH_API_KEY;
const searchName = process.env.AZURE_SEARCH_NAME;
const indexName = process.env.AZURE_SEARCH_INDEX_NAME;
const endpoint = `https://${searchName}.${endpointSuffix}`;

const logSetup = () => {
  console.log({
    USE_MANAGED_IDENTITIES,
    endpointSuffix,
    apiKey: USE_MANAGED_IDENTITIES ? "Using Managed Identity" : "API Key Set",
    searchName,
    indexName,
    endpoint,
  });
};

export const GetCredential = () => {
  logSetup(); // Log the setup configuration

  try {
    const credential = USE_MANAGED_IDENTITIES
      ? new DefaultAzureCredential()
      : new AzureKeyCredential(apiKey);

    console.log("Credential initialized:", {
      useManagedIdentities: USE_MANAGED_IDENTITIES,
      credentialType: USE_MANAGED_IDENTITIES ? "DefaultAzureCredential" : "AzureKeyCredential"
    });

    return credential;
  } catch (error: any) {
    console.error("Error initializing credential:", {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
};

export const AzureAISearchInstance = <T extends object>() => {
  const credential = GetCredential();

  try {
    const searchClient = new SearchClient<T>(
      endpoint,
      indexName,
      credential
    );
    console.log("AzureAI SearchClient created successfully");
    return searchClient;
  } catch (error: any) {
    console.error("Error creating AzureAI SearchClient:", {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
};

export const AzureAISearchIndexClientInstance = () => {
  const credential = GetCredential();

  try {
    const searchClient = new SearchIndexClient(
      endpoint,
      credential
    );
    console.log("AzureAI SearchIndexClient created successfully");
    return searchClient;
  } catch (error: any) {
    console.error("Error creating AzureAI SearchIndexClient:", {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
};

export const AzureAISearchIndexerClientInstance = () => {
  const credential = GetCredential();

  try {
    const client = new SearchIndexerClient(
      endpoint,
      credential
    );
    console.log("AzureAI SearchIndexerClient created successfully");
    return client;
  } catch (error: any) {
    console.error("Error creating AzureAI SearchIndexerClient:", {
      message: error.message,
      name: error.name,
    });
    throw error;
  }
};
