import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "@/lib/astradb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are supported" },
      { status: 400 }
    );
  }

  let extractedText = "";
  
  try {
    // Create worker with minimal configuration for Next.js
    const worker = await createWorker("eng", 1);

    // Alternative approach if the above doesn't work:
    // const worker = await createWorker();
    // await worker.loadLanguage("eng");
    // await worker.initialize("eng");

    const {
      data: { text },
    } = await worker.recognize(buffer);
    
    await worker.terminate();
    extractedText = text;
    
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json(
      { error: "OCR failed", details: err.message },
      { status: 500 }
    );
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "No text extracted" }, { status: 400 });
  }

  // Split text into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const docs = await splitter.createDocuments([extractedText]);

  // Store in vector database
  try {
    const vectorStore = await getVectorStore(
      new GoogleGenerativeAIEmbeddings({ modelName: "models/embedding-001" })
    );
    
    await vectorStore.addDocuments(docs);
    
  } catch (err) {
    console.error("Embedding or DB error:", err);
    return NextResponse.json(
      { error: "Embedding/storage failed", details: err.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    success: true, 
    chunks: docs.length,
    extractedText: extractedText.substring(0, 200) + "..." // Preview of extracted text
  });
}