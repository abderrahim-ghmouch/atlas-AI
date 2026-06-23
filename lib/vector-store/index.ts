import { IVectorStore } from "./types";
import { PineconeVectorStore } from "./pinecone-store";
import { LocalVectorStore } from "./local-store";

export const vectorStore: IVectorStore =
  typeof process.env.PINECONE_API_KEY === "string" && process.env.PINECONE_API_KEY.length > 0
    ? new PineconeVectorStore()
    : new LocalVectorStore();
