const {GoogleGenerativeAI}=require('@google/generative-ai');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function callGemini(prompt){
 const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('Gemini API key is not configured');
 const modelName=process.env.GEMINI_MODEL||'gemini-3.6-flash'; const genAI=new GoogleGenerativeAI(key); const model=genAI.getGenerativeModel({model:modelName});
 for(let attempt=1;attempt<=3;attempt++){try{const result=await model.generateContent(prompt);const text=(await result.response).text();if(!text)throw new Error('Invalid Gemini response');return text;}catch(e){const temporary=/503|UNAVAILABLE|high demand/i.test(e.message);if(!temporary||attempt===3)throw e;await sleep(attempt*5000);}}
}
module.exports={callGemini};
