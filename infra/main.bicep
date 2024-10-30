targetScope = 'subscription'

// Environment Parameter
@minLength(1)
@maxLength(64)
@description('Name of the environment to generate a short unique hash for all resources.')
param name string

// Location Parameter
@minLength(1)
@description('Primary location for all resources.')
param location string

// OpenAI Location Parameter
@description('Location for the OpenAI resource group.')
@allowed(['australiaeast', 'brazilsouth', 'canadaeast', 'eastus', 'eastus2', 'francecentral', 'germanywestcentral', 'japaneast', 'koreacentral', 'northcentralus', 'norwayeast', 'polandcentral', 'spaincentral', 'southafricanorth', 'southcentralus', 'southindia', 'swedencentral', 'switzerlandnorth', 'uksouth', 'westeurope', 'westus', 'westus3'])
param openAILocation string

// VNet Integration
@description('Enable VNet integration for App Service.')
param enableAppServiceVNetIntegration bool = false

// OpenAI Parameters
@description('SKU for OpenAI.')
param openAISku string = 'S0'

@description('API version for OpenAI.')
param openAIApiVersion string = '2024-08-01-preview'

// ChatGPT Parameters
@description('Deployment capacity for ChatGPT.')
param chatGptDeploymentCapacity int = 30

@description('Deployment name for ChatGPT.')
param chatGptDeploymentName string = 'gpt-4o'

@description('Model name for ChatGPT.')
param chatGptModelName string = 'gpt-4o'

@description('Model version for ChatGPT.')
param chatGptModelVersion string = '2024-05-13'

// Embedding Parameters
@description('Deployment name for embeddings.')
param embeddingDeploymentName string = 'embedding'

@description('Deployment capacity for embeddings.')
param embeddingDeploymentCapacity int = 120

@description('Model name for embeddings.')
param embeddingModelName string = 'text-embedding-ada-002'

// DALL-E Parameters
@description('Location for the OpenAI DALL-E 3 instance resource group.')
@allowed(['swedencentral', 'eastus', 'australiaeast','francecentral'])
param dalleLocation string

@description('Deployment capacity for DALL-E.')
param dalleDeploymentCapacity int = 1

@description('Deployment name for DALL-E.')
param dalleDeploymentName string = 'dall-e-3'

@description('Model name for DALL-E.')
param dalleModelName string = 'dall-e-3'

@description('API version for DALL-E.')
param dalleApiVersion string = '2023-12-01-preview'

// Other Service Parameters
@description('SKU for Form Recognizer service.')
param formRecognizerSkuName string = 'S0'

@description('Index name for Azure Search service.')
param searchServiceIndexName string = 'azure-chat'

@description('SKU for Azure Search service.')
param searchServiceSkuName string = 'standard'

// Storage Parameters
@description('SKU for the storage account.')
param storageServiceSku object = { name: 'Standard_LRS' }

@description('Name of the image container in the storage account.')
param storageServiceImageContainerName string = 'images'

// Resource Group
@description('Optional resource group name.')
param resourceGroupName string = ''

// Deployment Control Parameters
@description('Deploy private endpoints for App Service.')
param deployAppServicePrivateEndpoint bool = false

@description('Deploy private endpoints for other resources.')
param deployOtherResourcesPrivateEndpoints bool = false

// Authentication
@description('Disable local authentication and enforce RBAC using managed identities.')
param disableLocalAuth bool = false

// Networking
var resourceToken = toLower(uniqueString(subscription().id, name, location))
var tags = { 'azd-env-name': name }

// Resource Group Definition
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : 'rg-${name}'
  location: location
  tags: tags
}

// Modules for Resource Deployment
module resources 'resources.bicep' = {
  name: 'all-resources'
  scope: rg
  params: {
    name: name
    resourceToken: resourceToken
    tags: tags
    enableAppServiceVNetIntegration: enableAppServiceVNetIntegration
    openai_api_version: openAIApiVersion
    openAiLocation: openAILocation
    openAiSkuName: openAISku
    chatGptDeploymentCapacity: chatGptDeploymentCapacity
    chatGptDeploymentName: chatGptDeploymentName
    chatGptModelName: chatGptModelName
    chatGptModelVersion: chatGptModelVersion
    embeddingDeploymentName: embeddingDeploymentName
    embeddingDeploymentCapacity: embeddingDeploymentCapacity
    embeddingModelName: embeddingModelName
    dalleLocation: dalleLocation
    dalleDeploymentCapacity: dalleDeploymentCapacity
    dalleDeploymentName: dalleDeploymentName
    dalleModelName: dalleModelName
    dalleApiVersion: dalleApiVersion
    formRecognizerSkuName: formRecognizerSkuName
    searchServiceIndexName: searchServiceIndexName
    searchServiceSkuName: searchServiceSkuName
    storageServiceSku: storageServiceSku
    storageServiceImageContainerName: storageServiceImageContainerName
    location: location
    disableLocalAuth: disableLocalAuth
    deployAppServicePE: deployAppServicePrivateEndpoint
    deployOtherResourcesPE: deployOtherResourcesPrivateEndpoints
  }
}


// Outputs
output APP_URL string = resources.outputs.url
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
