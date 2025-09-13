// Este arquivo contém todos os bancos de questões do aplicativo.

// Questões do último concurso do INSS (2022 e 2016)
const concursoQuestionBank = {
    seguridade: [
        { id: "C001", question: 'O salário-família é devido ao segurado com renda bruta mensal igual ou inferior a R$ 1.655,98.', answer: 'Certo', law: 'INSS 2022', isConcurso: true },
        { id: "C002", question: 'O auxílio-acidente não exige carência, mas não pode ser acumulado com qualquer outro auxílio ou aposentadoria.', answer: 'Errado', law: 'INSS 2022', isConcurso: true, explanation: 'O auxílio-acidente pode ser acumulado com a aposentadoria, desde que o início de ambos os benefícios tenha ocorrido antes de 11/11/2019, quando entrou em vigor a Emenda Constitucional 103/2019.' },
        { id: "C003", question: 'Considera-se para o cálculo do valor dos benefícios o salário de contribuição de 100% do período contributivo desde 1994.', answer: 'Errado', law: 'INSS 2016', isConcurso: true, explanation: 'A regra atual, a partir da Reforma da Previdência de 2019, considera o salário de contribuição de todo o período contributivo. A lei anterior considerava 80% dos maiores salários, excluindo-se os 20% menores.' },
        { id: "C007", question: 'A contribuição social do segurado especial é calculada sobre o valor da receita bruta proveniente da comercialização da sua produção.', answer: 'Certo', law: 'INSS 2022 - Conhecimentos Específicos', isConcurso: true, explanation: 'A contribuição do segurado especial é de 1,2% da receita bruta da comercialização da produção rural. Outras alíquotas são aplicadas dependendo da situação, mas a regra geral é essa.' },
        { id: "C008", question: 'A carência para a concessão de salário-maternidade é de dez contribuições mensais para as seguradas empregada, trabalhadora avulsa e empregada doméstica.', answer: 'Errado', law: 'INSS 2022 - Conhecimentos Específicos', isConcurso: true, explanation: 'A carência para o salário-maternidade para empregada, trabalhadora avulsa e doméstica é dispensada. A carência de 10 meses se aplica a outras seguradas, como a contribuinte individual, facultativa e especial.' },
        { id: "C009", question: 'A aposentadoria por incapacidade permanente, antes chamada de aposentadoria por invalidez, será paga a partir da data de início da incapacidade, exceto se o requerimento for feito após 30 dias, caso em que o benefício será pago a partir da data do requerimento.', answer: 'Errado', law: 'INSS 2022 - Conhecimentos Específicos', isConcurso: true, explanation: 'Se o segurado estiver empregado, o benefício será devido a partir do 16º dia do afastamento da atividade, a cargo da empresa até o 15º dia. O termo "30 dias" se aplica ao auxílio-doença.' },
    ],
    constitucional: [
        { id: "C004", question: 'É plena a liberdade de associação para fins lícitos, sendo vedada a de caráter paramilitar.', answer: 'Certo', law: 'INSS 2022', isConcurso: true },
        { id: "C005", question: 'A criação de associações e, na forma da lei, a de cooperativas independem de autorização, sendo proibida a interferência estatal em seu funcionamento.', answer: 'Certo', law: 'INSS 2016', isConcurso: true },
        { id: "C010", question: 'São direitos dos trabalhadores urbanos e rurais, entre outros, o aviso prévio proporcional ao tempo de serviço, sendo a lei que fixará o período mínimo.', answer: 'Errado', law: 'INSS 2022', isConcurso: true, explanation: 'A Constituição Federal não fixa período mínimo para o aviso prévio. Ela estabelece que o aviso prévio será proporcional ao tempo de serviço, sendo no mínimo de 30 dias, nos termos da lei.' },
    ],
    administrativo: [
        { id: "A001", question: 'O poder de polícia da administração pública é o que garante a supremacia do interesse público sobre o privado, permitindo que o Estado, em nome do interesse coletivo, restrinja ou condicione o exercício de direitos individuais.', answer: 'Certo', law: 'INSS 2022 - Direito Administrativo', isConcurso: true },
        { id: "A002", question: 'O ato administrativo de licença é um ato discricionário, cabendo à administração decidir se concede ou não, a depender da sua conveniência e oportunidade.', answer: 'Errado', law: 'INSS 2022 - Direito Administrativo', isConcurso: true, explanation: 'A licença é um ato administrativo vinculado. Se o particular preenche todos os requisitos legais, a administração não pode recusar a concessão.' },
    ],
    portugues: [
        { id: "P001", question: 'No trecho "Ainda que não haja interesse econômico, é importante que se cuide da gestão de resíduos", a conjunção "Ainda que" pode ser substituída, sem prejuízo de sentido, por "Embora".', answer: 'Certo', law: 'INSS 2022 - Português', isConcurso: true, explanation: 'Ambas as conjunções introduzem uma oração concessiva, que expressa uma ideia contrária à principal sem, no entanto, anular a sua validade. O sentido permanece o mesmo.' },
    ],
    raciocinio: [
        { id: "R001", question: 'Se a proposição "João foi aprovado no concurso, ou Maria não estudou" é falsa, então João foi aprovado no concurso e Maria não estudou.', answer: 'Errado', law: 'INSS 2022 - Raciocínio Lógico', isConcurso: true, explanation: 'Uma proposição conectada por "ou" (disjunção inclusiva) só é falsa se ambas as proposições simples que a compõem forem falsas. Assim, para a proposição "João foi aprovado" ser falsa, a primeira parte deve ser falsa e a segunda também, ou seja: "João não foi aprovado" e "Maria estudou".' },
    ],
    informatica: [
        { id: "I001", question: 'O uso de uma rede privada virtual (VPN) garante a total anonimidade do usuário na internet, impedindo que qualquer dado seja rastreado.', answer: 'Errado', law: 'INSS 2022 - Noções de Informática', isConcurso: true, explanation: 'Embora uma VPN dificulte o rastreamento, ela não garante anonimato total. O provedor da VPN pode, em tese, rastrear a atividade do usuário, e outras formas de rastreamento (como cookies e impressões digitais do navegador) ainda podem ser utilizadas.' },
    ],
    etica: [
        { id: "E001", question: 'O servidor público deve ser cortês e ter urbanidade, pois a cortesia, além de ser um elemento de sua conduta, é também um dever do serviço público.', answer: 'Certo', law: 'INSS 2022 - Ética no Serviço Público', isConcurso: true, explanation: 'O Decreto 1.171/94, que aprova o Código de Ética Profissional do Servidor Público Civil do Poder Executivo Federal, estabelece entre os deveres do servidor o tratamento cortês e com urbanidade.' },
    ],
};

// Questões padrão
const defaultQuestionBank = {
    seguridade: [
        { id: "S001", question: 'O princípio da seletividade e distributividade na prestação dos benefícios significa que o legislador deve selecionar os riscos sociais a serem cobertos, distribuindo a renda de forma a beneficiar os mais necessitados.', answer: 'Certo', explanation: 'Correto. Este princípio orienta a escolha das contingências sociais que serão amparadas (seletividade) e a forma de distribuir os benefícios para alcançar a justiça social (distributividade).', law: 'CF/88, Art. 194, Parágrafo único, III' },
        { id: "S002", question: 'A pessoa jurídica em débito com o sistema da seguridade social, conforme estabelecido em lei, pode contratar com o Poder Público, mas não pode receber benefícios ou incentivos fiscais.', answer: 'Errado', explanation: 'A Constituição é clara ao vedar tanto a contratação com o Poder Público quanto o recebimento de benefícios ou incentivos fiscais ou creditícios para a pessoa jurídica em débito.', law: 'CF/88, Art. 195, § 3º' }
    ],
    constitucional: [
        { id: "S003", question: 'A forma de governo no Brasil é a república e o sistema de governo é o presidencialismo.', answer: 'Certo', explanation: 'A República Federativa do Brasil é formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal. Seu sistema de governo é o presidencialismo.', law: 'CF/88, Art. 1º' },
        { id: "S004", question: 'A criação de associações e, na forma da lei, a de cooperativas independem de autorização, sendo proibida a interferência estatal em seu funcionamento.', answer: 'Certo', explanation: 'Exatamente o que dispõe a Constituição. A liberdade de associação é um direito fundamental, com a única ressalva expressa para associações de caráter paramilitar.', law: 'CF/88, Art. 5º, XVII' }
    ],
};

// Junta as questões do concurso com as padrão e as exporta.
const allQuestionBanks = { ...defaultQuestionBank };
for (const category in concursoQuestionBank) {
    if (allQuestionBanks[category]) {
        allQuestionBanks[category] = allQuestionBanks[category].concat(concursoQuestionBank[category]);
    } else {
        allQuestionBanks[category] = concursoQuestionBank[category];
    }
}

export { allQuestionBanks };
