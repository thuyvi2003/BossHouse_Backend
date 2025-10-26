require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, how are you?" }],
      max_tokens: 50,
    });
    console.log(res.choices[0].message.content);
  } catch (err) {
    console.error(err);
  }
}

test();
