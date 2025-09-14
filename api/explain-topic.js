// api/explain-topic.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { topic } = request.body;

  if (!topic) {
    return response.status(400).json({ error: 'O tópico é obrigatório' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  // Prompt do Tutor especialista
  const tutorPrompt = `
    Você é um Tutor de IA, especialista em preparar candidatos para o concurso de Técnico do Seguro Social do INSS.
    Sua tarefa é explicar o seguinte tópico de forma extremamente clara, didática e completa, como se estivesse dando uma aula.
    
    TÓPICO SOLICITADO PELO ALUNO: "${topic}"

    Instruções para a sua resposta:
    1.  **Estrutura:** Organize a explicação em seções com títulos claros (ex: "O que é?", "Principais Regras", "Exemplos Práticos", "Base Legal").
    2.  **Linguagem:** Use uma linguagem simples e direta, evitando jargão jurídico excessivo. Use analogias para facilitar o entendimento.
    3.  **Foco no Concurso:** Dê ênfase aos pontos que são mais cobrados em provas. Se houver "pegadinhas" comuns, mencione-as.
    4.  **Base Legal:** Sempre que possível, cite os artigos de lei mais importantes (ex: CF/88, Lei 8.213/91, etc.).
    5.  **Formatação:** Use quebras de linha para criar parágrafos e facilitar a leitura.
  `;

  try {
    const result = await model.generateContent(tutorPrompt);
    const textResponse = result.response.text();
    return response.status(200).json({ explanation: textResponse });
  } catch (error) {
    console.error('Erro ao chamar a API do Gemini para explicar tópico:', error);
    return response.status(500).json({ error: 'Falha na comunicação com o Tutor IA' });
  }
}
