"use strict";

// Preserved imports from original code
import "server-only";
import { userHashedId } from "@/features/auth-page/helpers";
import { HistoryContainer } from "@/features/common/services/cosmos";
import { RevalidateCache } from "@/features/common/navigation-helpers";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { DocumentIntelligenceInstance } from "@/features/common/services/document-intelligence";
import { uniqueId } from "@/features/common/util";
import { SqlQuerySpec } from "@azure/cosmos";
import { EnsureIndexIsCreated } from "./azure-ai-search/azure-ai-search";
import { CHAT_DOCUMENT_ATTRIBUTE, ChatDocumentModel } from "./models";

// Constants for document processing
const MAX_UPLOAD_DOCUMENT_SIZE: number = 20000000; // 20 MB limit for document upload
const CHUNK_SIZE = 2300; // Define the size of each chunk for the documents
// Define the overlap size for chunks based on 25% of the chunk size
const CHUNK_OVERLAP = CHUNK_SIZE * 0.25;

// Function to crack the document received from formData
export const CrackDocument = async (
  formData: FormData
): Promise<ServerActionResponse<string[]>> => {
  // Start logging
  console.log("CrackDocument function started");
  try {
    // Ensure the index is created before proceeding
    const response = await EnsureIndexIsCreated();
    if (response.status !== "OK") {
      // Log and return error if index creation is not successful
      console.error("EnsureIndexIsCreated did not return status OK", response);
      return response;
    }

    // Load the file from formData
    const fileResponse = await LoadFile(formData);
    if (fileResponse.status !== "OK") {
      // Log and return error if file loading fails
      console.error("LoadFile did not return status OK", fileResponse);
      return fileResponse;
    }

    // Split loaded document into chunks with overlap
    const splitDocuments = await ChunkDocumentWithOverlap(
      fileResponse.response.join("\n")
    );

    // Successful response logged and returned
    console.log("CrackDocument function completed successfully with split documents");
    return {
      status: "OK",
      response: splitDocuments,
    };
  } catch (e) {
    // Catch all exceptions and log the error
    console.error("CrackDocument encountered an exception:", e);
    return {
      status: "ERROR",
      errors: [{ message: `Exception: ${(e as Error).message || e}` }],
    };
  }
};

// Load file from the supplied FormData
const LoadFile = async (
  formData: FormData
): Promise<ServerActionResponse<string[]>> => {
  // Start logging
  console.log("LoadFile function started");
  try {
    // Extract "file" from formData
    const file: File | null = formData.get("file") as unknown as File;

    // Determine the maximum file size for processing
    const fileSize = process.env.MAX_UPLOAD_DOCUMENT_SIZE
      ? Number(process.env.MAX_UPLOAD_DOCUMENT_SIZE)
      : MAX_UPLOAD_DOCUMENT_SIZE;

    if (file && file.size < fileSize) {
      // Processing is carried out only if the file size is within limits
      const client = DocumentIntelligenceInstance();
      const blob = new Blob([file], { type: file.type });
      const poller = await client.beginAnalyzeDocument(
        "prebuilt-read",
        await blob.arrayBuffer()
      );
      const { paragraphs } = await poller.pollUntilDone();

      const docs: Array<string> = [];
      if (paragraphs) {
        for (const paragraph of paragraphs) {
          docs.push(paragraph.content);
        }
      }

      // Successful file load logged and returned
      console.log("LoadFile function processed the document successfully");
      return {
        status: "OK",
        response: docs,
      };
    } else {
      // Log error for files exceeding the size limit
      console.error(`LoadFile: File is too large (${file.size} bytes), must be less than ${MAX_UPLOAD_DOCUMENT_SIZE} bytes.`);
      return {
        status: "ERROR",
        errors: [
          { message: `File is too large and must be less than ${MAX_UPLOAD_DOCUMENT_SIZE} bytes.` },
        ],
      };
    }
  } catch (e) {
    // Catch all exceptions and log the error
    console.error("LoadFile encountered an exception:", e);
    return {
      status: "ERROR",
      errors: [{ message: `Exception: ${(e as Error).message || e}` }],
    };
  }
};

// Function to find all chat documents for a given chatThreadID
export const FindAllChatDocuments = async (
  chatThreadID: string
): Promise<ServerActionResponse<ChatDocumentModel[]>> => {
  // Start logging
  console.log(`FindAllChatDocuments function started for chatThreadID: ${chatThreadID}`);
  try {
    // Construct the QuerySpec object
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.type = @type AND c.chatThreadId = @chatThreadId AND c.isDeleted = false",
      parameters: [
        { name: "@type", value: CHAT_DOCUMENT_ATTRIBUTE },
        { name: "@chatThreadId", value: chatThreadID },
      ],
    };

    // Query Cosmos DB container with prepared QuerySpec object
    const { resources } = await HistoryContainer().items.query<ChatDocumentModel>(querySpec).fetchAll();
  
    if (resources.length === 0) {
      // Log and return error if no documents are found
      console.log("FindAllChatDocuments: No documents found for the provided chatThreadID.");
      return {
        status: "ERROR",
        errors: [{ message: "No documents found." }],
      };
    }

    // Successful document retrieval logged and returned
    console.log(`FindAllChatDocuments function completed successfully with ${resources.length} documents found.`);
    return {
      status: "OK",
      response: resources,
    };
  } catch (e) {
    // Catch all exceptions and log the error
    console.error("FindAllChatDocuments encountered an exception:", e);
    return {
      status: "ERROR",
      errors: [{ message: `Exception: ${(e as Error).message || e}` }],
    };
  }
};

// Function to create a new chat document based on the provided fileName and chatThreadID
export const CreateChatDocument = async (
  fileName: string,
  chatThreadID: string
): Promise<ServerActionResponse<ChatDocumentModel>> => {
  // Start logging
  console.log(`CreateChatDocument function started for fileName: ${fileName}, chatThreadID: ${chatThreadID}`);
  try {
    // Prepare the new document model with details
    const modelToSave: ChatDocumentModel = {
      id: uniqueId(),
      chatThreadId: chatThreadID,
      userId: await userHashedId(),
      createdAt: new Date(),
      type: CHAT_DOCUMENT_ATTRIBUTE,
      isDeleted: false,
      name: fileName,
    };

    // Upsert the document into Cosmos DB container
    const { resource } = await HistoryContainer().items.upsert(modelToSave);
    
    if (!resource) {
      // Log and return error if document upsert fails
      console.error("CreateChatDocument: Failed to save the document to the database.");
      return {
        status: "ERROR",
        errors: [{ message: "Failed to save the document to the database." }],
      };
    }

    // Cache revalidation to reflect document addition in cache state
    RevalidateCache({ page: "chat", params: chatThreadID });

    // Successful document creation logged and returned
    console.log(`CreateChatDocument function completed successfully for document: ${fileName}`);
    return {
      status: "OK",
      response: resource as unknown as ChatDocumentModel,
    };
  } catch (e) {
    // Catch all exceptions and log the error
    console.error(`CreateChatDocument encountered an exception for fileName: ${fileName}:`, e);
    return {
      status: "ERROR",
      errors: [{ message: `Exception: ${(e as Error).message || e}` }],
    };
  }
};

// Function to chunk a given document string into overlapping chunks based on predefined sizes
export async function ChunkDocumentWithOverlap(document: string): Promise<string[]> {
  // Start logging
  console.log("ChunkDocumentWithOverlap function started for document processing");

  // Prepare chunks array to hold the resulting document chunks
  let chunks: string[] = [];
  
  // Chunking process begins
  if (document.length <= CHUNK_SIZE) {
    // If document size is within a single CHUNK_SIZE, no need to split it into parts
    console.log("ChunkDocumentWithOverlap: Document size is within the single chunk size limit");
    chunks.push(document);
  } else {
    // Processing for documents that exceed a single chunk size threshold
    let startIndex = 0;
  
    while (startIndex < document.length) {
      // Calculate the endIndex factoring the CHUNK_OVERLAP
      const endIndex = Math.min(startIndex + CHUNK_SIZE, document.length);
      // Create the chunk based on current startIndex and endIndex, include any possible overlap
      const chunk = document.substring(startIndex, endIndex);
      // Add the created chunk to chunks array
      chunks.push(chunk);
      // Move the startIndex to the next position factoring CHUNK_OVERLAP
      startIndex += (CHUNK_SIZE - CHUNK_OVERLAP);
    }
  }

  // Successful chunking of document logged and chunks returned
  console.log(`ChunkDocumentWithOverlap function processed document into ${chunks.length} chunks with overlaps (if needed).`);
  return chunks;
}

