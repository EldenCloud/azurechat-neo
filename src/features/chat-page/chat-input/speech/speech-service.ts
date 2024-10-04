"use server";

import { DefaultAzureCredential } from "@azure/identity";

const USE_MANAGED_IDENTITIES = process.env.USE_MANAGED_IDENTITIES === "true";

export const GetSpeechToken = async () => {
  if (
    process.env.AZURE_SPEECH_REGION === undefined
  ) {
    return {
      error: true,
      errorMessage: "Missing Azure Speech region",
      token: "",
      region: "",
    };
  }

  if (!USE_MANAGED_IDENTITIES && process.env.AZURE_SPEECH_KEY === undefined) {
    return {
      error: true,
      errorMessage: "Missing Azure Speech key",
      token: "",
      region: "",
    };
  }

  const credential = USE_MANAGED_IDENTITIES
    ? new DefaultAzureCredential()
    : { key: process.env.AZURE_SPEECH_KEY };

  let headers = {
    ...(!USE_MANAGED_IDENTITIES && { "Ocp-Apim-Subscription-Key": credential.key }),
  };

  const response = await fetch(
    `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: "POST",
      headers: headers,
      cache: "no-store",
      ...(USE_MANAGED_IDENTITIES && {
        headers: {
          "Authorization": `Bearer ${await credential.getToken("https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/")}`
        }
      })
    }
  );

  return {
    error: response.status !== 200,
    errorMessage: response.statusText,
    token: await response.text(),
    region: process.env.AZURE_SPEECH_REGION,
  };
};
