import { OpenAI } from "openai";
import { DefaultAzureCredential } from "@azure/identity";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

const getAPIKey = () => {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Azure OpenAI API key is not provided in environment variables.");
  }
  return apiKey;
};

const getCredential = async () => {
  if (USE_MANAGED_IDENTITIES) {
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const tokenResponse = await credential.getToken(scope);
    if (!tokenResponse) {
      throw new Error("Failed to obtain an access token using managed identity.");
    }
    return tokenResponse.token;
  } else {
    return getAPIKey();
  }
};

const createOpenAIInstance = async (deploymentName: string) => {
  const endpointSuffix = process.env.AZURE_OPENAI_API_ENDPOINT_SUFFIX || "openai.azure.com";
  const instanceName = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2023-12-01-preview";
  if (!instanceName) {
    throw new Error("Azure OpenAI instance name is not set in environment variables.");
  }

  const baseURL = `https://${instanceName}.${endpointSuffix}/openai/deployments/${deploymentName}`;
  const credential = await getCredential();

  return new OpenAI({
    apiKey: credential, // This works for both API Key and Bearer Token scenarios
    baseURL: baseURL,
    defaultQuery: { "api-version": apiVersion },
  });
};

export const OpenAIInstance = async () => {
  const deploymentName = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;
  if (!deploymentName) {
    throw new Error("Azure OpenAI deployment name is not set in environment variables.");
  }
  return createOpenAIInstance(deploymentName);
};

export const OpenAIEmbeddingInstance = async () => {
  const deploymentName = process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME;
  if (!deploymentName) {
    throw new Error("Azure OpenAI embeddings deployment name is not set in environment variables.");
  }
  return createOpenAIInstance(deploymentName);
};

export const OpenAIDALLEInstance = async () => {
  const deploymentName = process.env.AZURE_OPENAI_DALLE_API_DEPLOYMENT_NAME;
  if (!deploymentName) {
    throw new Error("Azure OpenAI DALLE deployment name is not set in environment variables.");
  }
  return createOpenAIInstance(deploymentName);
};
