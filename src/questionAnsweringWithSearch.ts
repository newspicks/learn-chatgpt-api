import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import chalk from "chalk";
import { search, SearchResult } from "./util";

const maxTurns = 10;

type ChatStatus = "INIT" | "FIX_ACTION" | "SEARCH_INPUT" | "SEARCH_RESULT" | "ANSWER";

function initialPrompt(question: string): string {
    return `これからあなたに質問をするので、まず質問に回答するためにあなたが考えたことと、次に取るべき行動を以下の形式で書いてください。

思考：＜質問に答えるために考えたことをここに書く＞
行動：＜質問に答えるために取るべき行動をここに書く。ただし、行動は必ず「検索」か「回答」のどちらかである必要があります＞

それでは質問を始めます！

質問：${question}`;
}

function fixActionPrompt(): string {
    return `余計な説明は書かず、「行動：検索」か「行動：回答」と1行で書いてください。書き直しをお願いします。`;
}

function searchInputPrompt(): string {
    return "検索に必要なキーワードをスペース区切りで並べて書いてください";
}

function searchResultPrompt(searchResults: SearchResult[]): string {
    return `検索結果は以下の通りです。

${searchResults.map((result, index) => `検索結果${index + 1}：\n・見出し：${result.title}\n・概要：${result.description}`).join("\n")}

以上を踏まえて、再び質問に回答するためにあなたが考えたことと、次に取るべき行動を以下の形式で書いてください。

思考：＜質問に答えるために考えたことをここに書く＞
行動：＜質問に答えるために取るべき行動をここに書く。ただし、行動は「検索」か「回答」のどちらかである必要があります。＞`;
}

function answerPrompt(): string {
    return `それでは、以上のやりとりを踏まえて最終的な回答を書いてください。回答にあたっては、検索で得た情報以外は使わないようにしてください。`
}

interface Config {
    debug: boolean;
}

export async function questionAnsweringWithSearchApp(question: string, { debug }: Config): Promise<void> {
    const answer = await getAnswer(question, debug);
    console.log(answer);
}

async function getAnswer(question: string, debug: boolean): Promise<string> {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    let chatStatus: ChatStatus = "INIT";
    let answer = "";
    const messages: ChatCompletionRequestMessage[] = [
        { role: "user", content: initialPrompt(question) },
    ];
    if (debug) { console.log(`user: ${messages[0].content}`) }
    for (let i = 0; i < maxTurns; i++) {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
        });
        const response = completion.data.choices[0].message?.content || "";
        if (i === maxTurns - 2) {
            messages.push({ role: "assistant", content: response })
            messages.push({ role: "user", content: answerPrompt() });
            chatStatus = "ANSWER";
        } else if (chatStatus === "ANSWER") {
            answer = response;
            break;
        } else {
            const { prompt: nextPrompt, status: nextChatStatus } = await getNextPrompt(response, chatStatus);
            messages.push({ role: "assistant", content: response });
            messages.push({ role: "user", content: nextPrompt });
            chatStatus = nextChatStatus as ChatStatus; // workaround for TS7022
        }
        if (debug) {
            console.log(chalk.green(`assistant: ${messages[messages.length - 2].content}`));
            console.log(`user: ${messages[messages.length - 1].content}`);
        }
    }
    return answer;
}


async function getNextPrompt(response: string, chatStatus: Exclude<ChatStatus, "ANSWER">): Promise<{ prompt: string, status: ChatStatus }> {
    switch (chatStatus) {
        case "INIT":
            return getSearchInputOrAnswerPrompt(response);
        case "SEARCH_INPUT":
            return getSearchResultPrompt(response);
        case "SEARCH_RESULT":
            return getSearchInputOrAnswerPrompt(response);
        case "FIX_ACTION":
            return getSearchInputOrAnswerPrompt(response);
    }
}

function getSearchInputOrAnswerPrompt(response: string): { prompt: string, status: ChatStatus } {
    if (response.includes("行動：検索")) {
        return { prompt: searchInputPrompt(), status: "SEARCH_INPUT" };
    } else if (response.includes("行動：回答")) {
        return { prompt: answerPrompt(), status: "ANSWER" };
    } else {
        return { prompt: fixActionPrompt(), status: "FIX_ACTION" };
    }
}

async function getSearchResultPrompt(response: string): Promise<{ prompt: string, status: ChatStatus }> {
    const searchResults = await search(response);
    return { prompt: searchResultPrompt(searchResults), status: "SEARCH_RESULT" };
}
