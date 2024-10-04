"use server";

import { DefaultAzureCredential } from "@azure/identity";

export const GetSpeechToken = async () => {
  try {
    
  const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

  let token = "";
  const region = process.env.AZURE_SPEECH_REGION || "";
  let error = false;
  let errorMessage = "";

  if (region === "") {
    return {
      error: true,
      errorMessage: "Missing Azure Speech region",
      token: "",
      region: "",
    };
  }

  if (USE_MANAGED_IDENTITIES) {
    try {
      console.log("Using Managed Identities")
      const credential = new DefaultAzureCredential();
      const tokenResponse = await credential.getToken("https://cognitiveservices.azure.com/.default");

      if (!tokenResponse) {
        throw new Error("Failed to acquire token using managed identity");
      }

      const response = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenResponse.token}`,
          },
          cache: "no-store",
        }
      );

      error = response.status !== 200;
      errorMessage = response.statusText;
      token = await response.text();
    } catch (err) {
      error = true;
      errorMessage = `Failed to retrieve token using managed identity: ${(err as Error).message}`;
    }
  } else {
    console.log("Using Speech key")
    if (!process.env.AZURE_SPEECH_KEY) {
      return {
        error: true,
        errorMessage: "Missing Azure Speech key",
        token: "",
        region: "",
      };
    }

    try {
      const response = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
          },
          cache: "no-store",
        }
      );

      error = response.status !== 200;
      errorMessage = response.statusText;
      token = await response.text();
    } catch (err) {
      console.log(err)
      error = true;
      errorMessage = `Failed to retrieve token using subscription key: ${(err as Error).message}`;
    }
  }

  return {
    error,
    errorMessage,
    token,
    region,
  };
  } catch (error) {
    console.log(error)
  }
};
