"use server";

import { DefaultAzureCredential } from "@azure/identity";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

export const GetSpeechToken = async () => {
  if (
    process.env.AZURE_SPEECH_REGION === undefined ||
    process.env.AZURE_SPEECH_KEY === undefined
  ) {
    return {
      error: true,
      errorMessage: "Missing Azure Speech credentials",
      token: "",
      region: "",
    };
  }

  let token;
  if (USE_MANAGED_IDENTITIES) {
    try {
      console.log("Using Managed Identities");
      const credential = new DefaultAzureCredential();
      const tokenResponse = await credential.getToken("https://cognitiveservices.azure.com/.default");
      token = tokenResponse.token
      console.log("Token Response:", tokenResponse);
      if (!tokenResponse) {
        throw new Error("Failed to acquire token using managed identity");
      }
    }
    catch (e) {
      console.error(e)
      return {
        error: true,
        errorMessage: e,
        token: token,
        region: process.env.AZURE_SPEECH_REGION,
      };
    }
  }
  else {
    token = process.env.AZURE_SPEECH_KEY
  }

  const response = await fetch(
    `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": token!,
      },
      cache: "no-store",
    }
  );

  return {
    error: response.status !== 200,
    errorMessage: response.statusText,
    token: await response.text(),
    region: process.env.AZURE_SPEECH_REGION,
  };
};
