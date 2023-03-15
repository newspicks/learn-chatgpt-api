#!/usr/bin/env node
import { Command } from "commander";
import { simpleChatApp } from "./simpleChat";
import { summaryAndCommentApp } from "./summaryAndComment";
import { classificationApp } from "./classification";
import { summaryLongTextApp } from "./summaryLongText";
import { questionAnsweringWithSearchApp } from "./questionAnsweringWithSearch";
import { createEmbeddingApp } from "./createEmbedding";
import { questionAnsweringWithEmbeddingApp } from "./questionAnsweringWithEmbedding";

function main() {
    const program = new Command();
    program
        .description("Learn ChatGPT API By Example");

    program
        .command("simple-chat", { isDefault: true })
        .description("simple chat with ChatGPT")
        .option("-t, --temperature <temperature>", "temperature", "0.9")
        .option("-m, --max-tokens <maxTokens>", "max tokens", undefined)
        .option("-d, --debug", "debug mode", false)
        .action(async (options) => {
            await simpleChatApp({
                temperature: parseFloat(options.temperature),
                maxTokens: parseInt(options.maxTokens),
                debug: options.debug
            });
        });

    program
        .command("summary-and-comment <url>")
        .description("summarize a web page")
        .option("-t, --temperature <temperature>", "temperature", "0.9")
        .option("-m, --max-tokens <maxTokens>", "max tokens", undefined)
        .option("-d, --debug", "debug mode", false)
        .action(async (url, options) => {
            await summaryAndCommentApp(url, {
                temperature: parseFloat(options.temperature),
                maxTokens: parseInt(options.maxTokens),
                debug: options.debug
            });
        });

    program
        .command("classify <tag> <url>")
        .description("classify a web page")
        .option("-d, --debug", "debug mode", false)
        .action(async (tag, url, options) => {
            await classificationApp(url, tag, { debug: options.debug });
        });

    program
        .command("summary-long-text <file>")
        .description("summarize a long text file")
        .option("-d, --debug", "debug mode", false)
        .action(async (file, options) => {
            await summaryLongTextApp(file, { debug: options.debug });
        });

    program
        .command("qa-with-search <question>")
        .description("question answering with web search")
        .option("-d, --debug", "debug mode", false)
        .action(async (question, options) => {
            await questionAnsweringWithSearchApp(question, { debug: options.debug });
        });

    program
        .command("create-embedding <infile> <outfile>")
        .description("create embeddings for a text file")
        .action(async (infile, outfile) => {
            await createEmbeddingApp(infile, outfile);
        });

    program
        .command("qa-with-embedding <question>")
        .description("question answering with embeddings")
        .option("-d, --debug", "debug mode", false)
        .option("-cn, --context-num <contextNum>", "number of context chunks considered", "5")
        .option("-cf, --context-file <contextFile>", "context file", undefined)
        .action(async (question, options) => {
            await questionAnsweringWithEmbeddingApp(question, {
                debug: options.debug,
                contextNum: parseInt(options.contextNum),
                contextFile: options.contextFile
            });
        });

    program.parse(process.argv);
}

main();
