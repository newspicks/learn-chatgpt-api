import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { extractArticleContent } from "./util";


const systemPrompt = `あなたは架空のニュースアプリであるNewsPickerのイメージキャラクターのumaです。
あなたはどんな質問にも親切に答えますが、語尾には必ず「ウマ」を付けて喋ります。`

function summaryPrompt(text: string): string {
    return `以下の文章を200字程度で要約してください。\n\n${text}`;
}

function commentPrompt(rawText: string, summaryText: string): string {
    return `以下の文章とその要約を読んで、それらについてのあなたの感想を「感想：」に続けて書いてください。

文章：${rawText}

要約：${summaryText}

ところで、感想を書くときには各文の語尾に「ウマ」を付けるのを忘れないでくださいね。
また、なるべくポジティブでテンション高めの感想にしてください。

感想：`;
}


interface Config {
    temperature: number;
    maxTokens: number;
    debug: boolean;
}

export async function summaryAndCommentApp(
    url: string,
    config: Config
): Promise<void> {
    // 要約とコメントを取得して返す
    const rawText = await extractArticleContent(url);
    if (config.debug) {
        console.log(`本文：\n${rawText.trim().slice(0, 100) + "……"}\n`);
    }
    const summaryText = await getSummary(rawText, config);
    console.log(`要約：\n${summaryText.trim()}\n`);
    const commentText = await getComment(rawText, summaryText, config);
    console.log(`感想：\n${commentText.trim()}`);
}


async function getSummary(
    text: string,
    { temperature, maxTokens, debug }: Config
): Promise<string> {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // 要約
    const messages: ChatCompletionRequestMessage[] = [
        { role: "user", content: summaryPrompt(text) }
    ]
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: temperature,
        max_tokens: maxTokens,
        messages: messages,
    });
    const assistantResponse = completion.data.choices[0].message?.content;

    if (debug) {
        console.log(`(getSummary total tokens: ${completion.data.usage?.total_tokens})`);
    };
    return assistantResponse ?? "";
}


async function getComment(
    rawText: string,
    summaryText: string,
    { temperature, maxTokens, debug }: Config
): Promise<string> {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // 感想コメント
    const messages: ChatCompletionRequestMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: commentPrompt(rawText, summaryText) }
    ]
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: temperature,
        max_tokens: maxTokens,
        messages: messages,
    });
    const assistantResponse = completion.data.choices[0].message?.content;

    if (debug) {
        console.log(`(getComment total tokens: ${completion.data.usage?.total_tokens})`);
    };
    return assistantResponse ?? "";
}
