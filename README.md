# TypeScriptではじめるChatGPT API

UZABASE Tech Blog [「TypeScriptではじめるChatGPT API」](https://tech.uzabase.com/entry/2023/03/15/120000)のサンプルコードです。

実行にはNode.js 18以降が必要です。

## インストール

```sh
git clone https://github.com/newspicks/learn-chatgpt-api.git
cd learn-chatgpt-api
npm install
npm run build
npm install -g .
# アンインストール
npm uninstall -g learn-chatgpt-api
```

## 使い方

```sh
export OPENAI_ORGANIZATION=<your-organization>
export OPENAI_API_KEY=<your-api-key>
chatgpt --help
# インストールしないで使う場合
npx ts-node src/index.ts --help
```

```sh
Usage: chatgpt [options] [command]

Learn ChatGPT API By Example

Options:
  -h, --help                              display help for command

Commands:
  simple-chat [options]                   simple chat with ChatGPT
  summary-and-comment [options] <url>     summarize a web page
  classify [options] <tag> <url>          classify a web page
  summary-long-text [options] <file>      summarize a long text file
  qa-with-search [options] <question>     question answering with web search
  create-embedding <infile> <outfile>     create embeddings for a text file
  qa-with-embedding [options] <question>  question answering with embeddings
  help [command]                          display help for command
```
