import { Pinecone } from "@pinecone-database/pinecone";
import { IVectorStore, VectorChunk } from "./types";

export class PineconeVectorStore implements IVectorStore {
  private getIndex() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME || "atlas-ai";
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set.");
    }
    const pc = new Pinecone({ apiKey });
    return pc.index(indexName);
  }

  async upsertChunks(chunks: Omit<VectorChunk, "id">[]): Promise<void> {
    try {
      const index = this.getIndex();
      const records = chunks.map((c) => ({
        id: `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        values: c.embedding,
        metadata: {
          docId: c.docId,
          userId: c.userId,
          text: c.text,
          ...c.metadata,
        },
      }));
      // Batch upsert to Pinecone
      await index.upsert({ records });
    } catch (error) {
      console.error("Failed to upsert chunks to Pinecone:", error);
      throw error;
    }
  }

  async similaritySearch(
    userId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<Omit<VectorChunk, "embedding">[]> {
    try {
      const index = this.getIndex();
      const response = await index.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: {
          userId: { $eq: userId },
        },
      });

      return (response.matches || [])
        .filter((m) => m.metadata)
        .map((m) => ({
          id: m.id,
          docId: m.metadata!.docId as string,
          userId: m.metadata!.userId as string,
          text: m.metadata!.text as string,
          metadata: m.metadata || {},
        }));
    } catch (error) {
      console.error("Pinecone similarity search failed:", error);
      // Fail gracefully and return empty array to prevent app crash
      return [];
    }
  }

  async deleteDocumentChunks(docId: string, userId: string): Promise<void> {
    try {
      const index = this.getIndex();
      await index.deleteMany({
        filter: {
          docId: { $eq: docId },
          userId: { $eq: userId },
        },
      });
    } catch (error) {
      console.error("Failed to delete chunks from Pinecone:", error);
      throw error;
    }
  }
}
