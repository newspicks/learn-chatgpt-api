import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { extractArticleContent } from "./util";


function classificationPrompt(text: string, tag: string): string {
    return `以下の記事に「${tag}」に関する内容は含まれていますか？含まれている場合は「はい」、含まれていない場合は「いいえ」、わからない場合は「不明」と「回答：」に続けて書いてください。
仮に判断に自信がなくても、「${tag}」に少しでも関係する内容であれば「はい」と答えるようにし、本当に全く微塵も「${tag}」と関係ない場合だけ「いいえ」と答えてください。

記事：${text}

回答：`;
}

const reasonPrompt = "そのように判断した理由を教えてください。"

const answerSet = ["はい", "いいえ", "不明"] as const;

interface ClassificationAnswer {
    answer: typeof answerSet[number];
    reason: string;
}

interface Config {
    debug: boolean;
}

export async function classificationApp(url: string, tag: string, { debug }: Config): Promise<void> {
    const text = await extractArticleContent(url);
    if (debug) {
        console.log(`記事：\n${text.trim().slice(0, 100) + "……"}\n`);
    }
    const { answer, reason } = await classifyText(text, tag);
    console.log(
        (answer === "はい"
            ? `この記事は「${tag}」に関係あります。`
            : answer === "いいえ"
                ? `この記事は「${tag}」に関係ありません。`
                : `この記事が「${tag}」に関係するかどうかわかりません。`) + "\n"
    );
    console.log(`理由：\n${reason}`);
}

async function classifyText(text: string, tag: string): Promise<ClassificationAnswer> {
    // 設定
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    // はい／いいえ／不明を回答
    const messages: ChatCompletionRequestMessage[] = [
        { role: "user", content: classificationPrompt(text, tag) },
    ]
    const answerCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    const rawAnswer = answerCompletion.data.choices[0].message?.content;
    const answer = rawAnswer === undefined
        ? "不明"
        : rawAnswer.trim() === "はい"
            ? "はい"
            : rawAnswer.trim() === "いいえ"
                ? "いいえ"
                : "不明";

    // 判断理由
    messages.push({ role: "assistant", content: answer });
    messages.push({ role: "user", content: reasonPrompt });
    const reasonCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    const reason = reasonCompletion.data.choices[0].message?.content.trim() ?? "";

    return { answer, reason };
}
