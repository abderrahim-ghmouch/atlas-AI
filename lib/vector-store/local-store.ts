import { IVectorStore, VectorChunk } from "./types";
import fs from "fs";
import path from "path";

const VECTOR_DB_PATH = path.join(process.cwd(), "data", "vector_db.json");

interface LocalVectorDbSchema {
  chunks: VectorChunk[];
}

export class LocalVectorStore implements IVectorStore {
  private readDb(): LocalVectorDbSchema {
    try {
      if (!fs.existsSync(VECTOR_DB_PATH)) {
        const dir = path.dirname(VECTOR_DB_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(VECTOR_DB_PATH, JSON.stringify({ chunks: [] }, null, 2));
        return { chunks: [] };
      }
      const raw = fs.readFileSync(VECTOR_DB_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to read local vector DB:", error);
      return { chunks: [] };
    }
  }

  private writeDb(data: LocalVectorDbSchema): void {
    try {
      fs.writeFileSync(VECTOR_DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to write local vector DB:", error);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async upsertChunks(chunks: Omit<VectorChunk, "id">[]): Promise<void> {
    const db = this.readDb();
    const newChunks: VectorChunk[] = chunks.map((c) => ({
      id: `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...c,
    }));
    db.chunks.push(...newChunks);
    this.writeDb(db);
  }

  async similaritySearch(
    userId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<Omit<VectorChunk, "embedding">[]> {
    const db = this.readDb();
    const userChunks = db.chunks.filter((c) => c.userId === userId);

    const scored = userChunks.map((c) => {
      const similarity = this.cosineSimilarity(queryEmbedding, c.embedding);
      return { chunk: c, similarity };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    const top = scored.slice(0, limit);

    return top.map(({ chunk }) => {
      const { embedding, ...clean } = chunk;
      return clean;
    });
  }

  async deleteDocumentChunks(docId: string, userId: string): Promise<void> {
    const db = this.readDb();
    db.chunks = db.chunks.filter((c) => !(c.docId === docId && c.userId === userId));
    this.writeDb(db);
  }
}
