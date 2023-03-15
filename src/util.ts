import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import google from 'googlethis';

export interface SearchResult {
    title: string;
    description: string;
}

export async function search(text: string): Promise<SearchResult[]> {
    const response = await google.search(text);
    return response.results.map(result => ({ title: result.title, description: result.description }));
}

export async function extractArticleContent(url: string): Promise<string> {
    // URLから記事本文を抽出
    const dom = await JSDOM.fromURL(url);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article) {
        throw new Error(`Failed to extract article content from "${url}"`);
    }
    const content = new dom.window.DOMParser()
        .parseFromString(article.content, "text/html")
        .body
        .textContent || "";
    return content;
}


export function chunkString(str: string, chunkLength: number): string[] {
    const chunks: string[] = [];
    let index = 0;
    while (index < str.length) {
        chunks.push(str.slice(index, index + chunkLength));
        index += chunkLength;
    }
    return chunks;
}

export function getDistance(a: number[], b: number[], metric: "cosine" | "euclid" = "cosine"): number {
    switch (metric) {
        case "cosine":
            return 1 - a.reduce((acc, v, i) => acc + v * b[i], 0) / (Math.sqrt(a.reduce((acc, v) => acc + v ** 2, 0)) * Math.sqrt(b.reduce((acc, v) => acc + v ** 2, 0)));
        case "euclid":
            return Math.sqrt(a.reduce((acc, v, i) => acc + (v - b[i]) ** 2, 0));
    }
}

export function argSort(array: Array<any>): Array<number> {
    const len = array.length;
    const indices = Array(len).fill(0).map((_, i) => i);
    indices.sort((a, b) => {
        if (array[a] < array[b]) {
            return -1;
        } else if (array[a] > array[b]) {
            return 1;
        } else {
            return 0;
        }
    });
    return indices;
}
