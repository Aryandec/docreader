import { DataAPIClient } from "@datastax/astra-db-ts";
import { AstraDBVectorStore } from "@langchain/community/vectorstores/astradb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Read environment variables
const endpoint = process.env.ASTRA_DB_ENDPOINT || "";
const token = process.env.ASTRA_DB_APPLICATION_TOKEN || "";
const collection = process.env.ASTRA_DB_COLLECTION || ""; // must be alphanumeric/underscores
const geminiApiKey = process.env.GOOGLE_API_KEY || "";

// Validate env vars
if (!token || !endpoint || !collection || !geminiApiKey) {
  throw new Error(
    "Missing required env variables: ASTRA_DB_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_COLLECTION, GOOGLE_API_KEY"
  );
}

// Initialize the Astra DB client
const client = new DataAPIClient({ logging: "all" });
const db = client.db(endpoint, { token });

export async function getVectorStore() {
  const embedding = new GoogleGenerativeAIEmbeddings({
    apiKey: geminiApiKey,
    modelName: "embedding-001",
  });

  return AstraDBVectorStore.fromExistingIndex(embedding, {
    token,
    endpoint,
    collection,
    collectionOptions: {
      vector: {
        dimension: 768, // Gemini's embeddings have 768 dimensions
        metric: "cosine",
      },
    },
  });
}

export async function getEmbeddingsCollection() {
  return db.collection(collection);
}
