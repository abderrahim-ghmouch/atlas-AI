export interface VectorChunk {
  id: string;
  docId: string;
  userId: string;
  text: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface IVectorStore {
  upsertChunks(chunks: Omit<VectorChunk, "id">[]): Promise<void>;
  similaritySearch(userId: string, queryEmbedding: number[], limit: number): Promise<Omit<VectorChunk, "embedding">[]>;
  deleteDocumentChunks(docId: string, userId: string): Promise<void>;
}
