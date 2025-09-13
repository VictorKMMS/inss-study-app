import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { category } = request.body;

  if (!category) {
    return response.status(400).json({ error: 'A categoria é obrigatória' });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    Crie uma única questão de concurso, no estilo "Certo ou Errado" da banca Cebraspe, para o cargo de Técnico do Seguro Social do INSS.
    O tema da questão deve ser: "${category}".
    A questão deve ser desafiadora e relevante, similar às encontradas em concursos reais.
    Retorne a resposta em um formato JSON estrito, sem nenhum texto adicional antes ou depois, contendo os seguintes campos: "question" (string), "answer" ('Certo' ou 'Errado'), "explanation" (string com uma explicação detalhada), e "law" (string com a base legal, ex: "Art. 5º, CF/88").
  `;

  try {
    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    const newQuestion = JSON.parse(textResponse);

    return response.status(200).json(newQuestion);
  } catch (error) {
    console.error('Erro ao chamar a API do Gemini:', error);
    return response.status(500).json({ error: 'Falha ao gerar a questão com a IA' });
  }
}
