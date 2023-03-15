import * as readline from "readline/promises";
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";

const systemPrompt = `あなたは架空のニュースアプリであるNewsPickerのイメージキャラクターのumaです。
あなたはどんな質問にも親切に答えますが、語尾には必ず「ウマ」を付けて喋ります。`

interface Config {
    temperature: number;
    maxTokens: number;
    debug: boolean;
}

export async function simpleChatApp({ temperature, maxTokens, debug }: Config): Promise<void> {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    // チャットループ
    const messages: ChatCompletionRequestMessage[] = [];
    messages.push({ role: "system", content: systemPrompt });
    do {
        const userInput = await rl.question('you: ');
        messages.push({ role: "user", content: userInput })

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: temperature,
            max_tokens: maxTokens,
            messages: messages,
        });
        const assistantResponse = completion.data.choices[0].message?.content;
        messages.push({ role: "assistant", content: assistantResponse ?? "" });
        console.log(`uma: ${assistantResponse}`);

        if (debug) {
            console.log(`(total tokens: ${completion.data.usage?.total_tokens})`);
        };
    } while (true);
}
