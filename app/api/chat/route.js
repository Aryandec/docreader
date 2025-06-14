import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { getVectorStore } from "@/lib/astradb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // 1. Setup vector store and retriever
    const vectorstore = await getVectorStore();
    const retriever = vectorstore.asRetriever();

    // 2. Use ChatGoogleGenerativeAI for chat-based operations
    const chatLLM = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash", // Updated model name format
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 3. Create history-aware retriever
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
      llm: chatLLM,
      retriever,
      rephrasePrompt: ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful assistant. Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is."],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
      ]),
    });

    // 4. Create document chain with proper prompt template
    const documentChain = await createStuffDocumentsChain({
      llm: chatLLM,
      prompt: ChatPromptTemplate.fromMessages([
        ["system", "You are an expert AI assistant. Use only the following context to answer the user's question. If you cannot find the answer in the context, say so clearly.\n\nContext: {context}"],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
      ]),
    });

    // 5. Create the full retrieval chain
    const retrievalChain = await createRetrievalChain({
      retriever: historyAwareRetrieverChain,
      combineDocsChain: documentChain,
    });

    // 6. Prepare chat history (exclude the last message as it's the current input)
    const chatHistory = messages.slice(0, -1).map(msg => {
      return msg.role === 'user' ? ['human', msg.content] : ['assistant', msg.content];
    }).flat();

    // 7. Get the current user input
    const currentInput = messages[messages.length - 1].content;

    // 8. Invoke the retrieval chain to get the response
    const response = await retrievalChain.invoke({
      chat_history: chatHistory,
      input: currentInput,
    });

    // 9. Use ai-sdk to stream the final response
    const googleAI = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const result = await streamText({
      model: googleAI("gemini-1.5-flash"), // Updated model name
      prompt: response.answer, // Use the answer from the retrieval chain
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong", details: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}