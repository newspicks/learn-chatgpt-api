import * as fs from "fs/promises";
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { getDistance, argSort } from "./util";

function askWithContextPrompt(question: string, contexts: string[]): string {
    const prompt = contexts.length !== 0
        ? `${contexts.map((c, index) => `文脈${index}：${c}`).join("\n")}

上記の文脈を踏まえて、以下の質問に回答してください。回答の際には、上記の文脈に書かれていない情報は可能な限り使わないようにしてください。
質問：${question}`
        : `以下の質問に回答してください。\n質問：${question}`;
    return prompt;
}

interface Context {
    id: string;
    text: string;
    embedding: number[];
}

interface Config {
    debug: boolean;
    contextNum: number;
    contextFile?: string;
}

export async function questionAnsweringWithEmbeddingApp(question: string, { debug, contextNum, contextFile }: Config): Promise<void> {
    const contexts = contextFile !== undefined ? await readContext(contextFile) : [];
    const { answer, citation } = await getAnswer(question, contexts, contextNum, debug);
    console.log(answer);
    if (citation.length !== 0) { console.log(`\n${citation}`) }
}

async function getAnswer(question: string, contexts: Context[], contextNum: number, debug: boolean): Promise<{ answer: string, citation: string }> {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    const relevantContexts = await getRelevantContexts(question, contexts, contextNum);
    const prompt = askWithContextPrompt(question, relevantContexts.map(c => c.text));
    if (debug) { console.log(`${prompt}\n`) }

    const messages: ChatCompletionRequestMessage[] = [
        { role: "user", content: prompt },
    ];
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    const answer = completion.data.choices[0].message?.content || "";
    const citation = relevantContexts.length !== 0
        ? `回答にあたっては以下の文章を参考にしました。\n${relevantContexts.map(c => `[chunk-id:${c.id}] ${c.text.replace(/\n/g, '').slice(0, 100)}……`).join("\n")}`
        : "";
    return { answer, citation };
}

async function readContext(file: string): Promise<Context[]> {
    const data = await fs.readFile(file, "utf-8");
    const contexts = JSON.parse(data);
    return contexts;
}

async function getRelevantContexts(text: string, contexts: Context[], topK: number = 5): Promise<Context[]> {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createEmbedding({
        input: text,
        model: 'text-embedding-ada-002',
    });
    const textEmbedding = response.data.data[0].embedding;
    const distances = contexts.map(context => getDistance(textEmbedding, context.embedding));
    const sortedIndices = argSort(distances);
    const sortedContexts = argSort(sortedIndices).map(i => contexts[i]);
    return sortedContexts.slice(0, topK);
}
