import * as fs from "fs/promises";
import { Configuration, OpenAIApi, CreateEmbeddingRequestInput } from "openai";
import { chunkString } from "./util";

export async function createEmbeddingApp(file: string, outFile: string, chunkLength: number = 400): Promise<void> {
    console.log(`Reading ${file} ...`)
    const text = await fs.readFile(file, "utf-8");
    const textChunks = chunkString(text, chunkLength);
    console.log(`Create embeddings ...`)
    const embeddings = await createEmbedding(textChunks);
    console.log(`Save embeddings to ${outFile} ...`)
    const text2emb = textChunks.map((text, index) => ({ id: index, text, embedding: embeddings[index] }));
    const json = JSON.stringify(text2emb);
    fs.writeFile(outFile, json);
    console.log(`Done.`)
}

async function createEmbedding(input: CreateEmbeddingRequestInput): Promise<number[][]> {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createEmbedding({
        input: input,
        model: 'text-embedding-ada-002',
    });
    const embeddings = response.data.data.map(embedding => embedding.embedding);
    return embeddings;
}
