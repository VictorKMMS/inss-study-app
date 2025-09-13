import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Recebe o histórico da conversa e o contexto da questão
  const { history, context } = request.body;

  if (!history || !context) {
    return response.status(400).json({ error: 'Histórico e contexto são obrigatórios' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  // O Prompt do Tutor: Instruímos a IA a se comportar como um especialista
  const tutorPrompt = `
    Você é um Tutor de IA especialista em Direito Previdenciário e outras matérias para o concurso de Técnico do INSS. Sua única função é ajudar um estudante a entender por que ele errou uma questão.
    
    **Contexto da Questão:**
    - Questão: "${context.question}"
    - Resposta Correta: "${context.answer}"
    - Explicação Base: "${context.explanation}"
    - Base Legal: "${context.law}"

    O estudante está fazendo a seguinte pergunta sobre essa questão. Seja claro, didático, encorajador e preciso. Use a base legal fornecida para embasar suas respostas. Não saia do escopo da questão ou da matéria.
  `;

  // Prepara o histórico para a IA, incluindo a instrução do "Tutor"
  const chatHistoryForAI = [
    { role: 'user', parts: [{ text: tutorPrompt }] },
    { role: 'model', parts: [{ text: "Entendido. Estou pronto para ajudar o estudante com as dúvidas dele sobre a questão." }] },
    ...history,
  ];
  
  try {
    const chat = model.startChat({ history: chatHistoryForAI });
    const lastUserMessage = history[history.length - 1].parts[0].text;
    
    const result = await chat.sendMessage(lastUserMessage);
    const textResponse = result.response.text();

    return response.status(200).json({ response: textResponse });
  } catch (error) {
    console.error('Erro ao chamar a API do Gemini no chat:', error);
    return response.status(500).json({ error: 'Falha na comunicação com o Tutor IA' });
  }
}