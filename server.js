const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// --- Inicialização do Servidor ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir arquivos estáticos da pasta 'public' (criada no build)
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/regras', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'regras.html'));
});

// --- Estado do Jogo (In-memory) ---
const gameState = {
    players: [],
    currentPlayerIndex: 0,
    boardSize: 28,
    playersPositions: [],
    playersSkipped: [],
    playersSpecialCards: [],
    deck: { 1: [], 2: [], 3: [], 4: [] },
    specialDeck: [],
    gameActive: false,
    winner: null
};

// --- Baralhos de Cartas ---
const CARDS_BY_PHASE = {
    1: [
        { text: "O que esse código imprime?\n\ni = 0\nwhile i < 3:\n    print(i)\n    i += 1", answer: "0 1 2", type: "normal" },
        { text: "Quantas vezes o loop roda?\n\nx = 5\nwhile x > 0:\n    x -= 2", answer: "3", type: "normal" },
        { text: "Este loop para? (V/F)\n\ni = 1\nwhile i != 0:\n    i = i - 1", answer: "V", type: "normal" },
        { text: "Complete para repetir 10 vezes:\n\ni = 0\nwhile __________:\n    i += 1", answer: "i < 10", type: "normal" },
        { text: "Qual a saída?\n\ni = 2\nwhile i <= 6:\n    print(i)\n    i += 2", answer: "2 4 6", type: "normal" },
        { text: "O que acontece?\n\ni = 0\nwhile i < 0:\n    print(i)", answer: "Nada (não executa)", type: "normal" },
        { text: "Qual a condição de parada?\n\ni = 10\nwhile i >= 0:\n    i -= 1", answer: "i se torna -1", type: "normal" },
        { text: "Reescreva em palavras:\n\ni = 0\nwhile i < 4:\n    i += 1", answer: "Incrementa i até 4, roda 4 vezes", type: "normal" }
    ],
    2: [
        { text: "Complete a condição (sentinela):\n\nnum = int(input())\nwhile ________:\n    print(num)\n    num = int(input())", answer: "num != 0", type: "normal" },
        { text: "Complete o acumulador para somar até 0:\n\nsoma = 0\nn = int(input())\nwhile n != 0:\n    soma = __________\n    n = int(input())\nprint(soma)", answer: "soma + n", type: "normal" },
        { text: "Conte quantos números positivos (entrada: números até 0).", answer: "cont += 1 se n > 0", type: "logic" },
        { text: "Leia notas até -1 e calcule a média. (Pseudocódigo)", answer: "soma=0,cont=0; enquanto nota != -1: soma+=nota; cont+=1; ler nota; média = soma/cont", type: "logic" },
        { text: "Leia números até 0 e mostre o maior.", answer: "inicialize maior com o primeiro número (se não for 0) e compare.", type: "logic" },
        { text: "Quantas vezes roda? i=1; while i<20: i=i*2", answer: "5 vezes", type: "normal" },
        { text: "Conte os pares (entrada: números até 0).", answer: "if n % 2 == 0: cont += 1", type: "normal" },
        { text: "Complete para somar 1..n:\n\ni=1; s=0\nwhile i <= n:\n    s += i\n    i += 1\nprint(s)", answer: "Soma de 1 até n", type: "normal" }
    ],
    3: [
        { text: "Corrija o loop infinito:\n\ni = 0\nwhile i < 5:\n    print(i)", answer: "Faltou i += 1", type: "debug" },
        { text: "Por que trava?\n\nn = 10\nwhile n > 0:\n    n = n + 1", answer: "n cresce, deveria ser n -= 1", type: "debug" },
        { text: "Condição errada:\n\ni = 0\nwhile i > 3:\n    print(i)\n    i += 1", answer: "Nunca executa, corrigir para i < 3", type: "debug" },
        { text: "Sentinela bugada:\n\nnum = int(input())\nwhile num == 0:\n    print(num)\n    num = int(input())", answer: "Condição invertida, deveria ser num != 0", type: "debug" },
        { text: "Ordem do input:\n\nwhile n != 0:\n    n = int(input())\n    print(n)", answer: "n não inicializado; ler antes do while", type: "debug" },
        { text: "Atualização errada:\n\ni = 1\nwhile i < 10:\n    print(i)\n    i = i", answer: "i nunca muda; corrigir para i += 1", type: "debug" },
        { text: "Off-by-one: i=0; while i<=3: print(i); i+=1. Queríamos 3 valores.", answer: "Imprime 4 valores. Usar i<3", type: "debug" },
        { text: "Acumulador esquecido:\n\ns=0; i=1\nwhile i <= 5:\n    i += 1\nprint(s)", answer: "s nunca muda; faltou s += i", type: "debug" }
    ],
    4: [
        { text: "Crie o pseudocódigo para ler notas até -1 e calcular a média.", answer: "soma=cont=0; enquanto nota != -1: soma+=nota; cont+=1; ler nota; media=soma/cont", type: "challenge" },
        { text: "Validação de entrada: leia idade até ser válida (0-120).", answer: "while idade < 0 or idade > 120: ler novamente", type: "challenge" },
        { text: "Faça um menu que repete até opção 0 (sair).", answer: "while opcao != 0: mostrar menu; ler opcao; executar", type: "challenge" },
        { text: "Calcule o fatorial de n (n!).", answer: "fat=1; i=1; while i<=n: fat*=i; i+=1", type: "challenge" },
        { text: "Some os números pares até n.", answer: "i=2; soma=0; while i<=n: soma+=i; i+=2", type: "challenge" },
        { text: "Conte os dígitos de um número positivo.", answer: "cont=0; while n>0: n//=10; cont+=1", type: "challenge" },
        { text: "Adivinhação: repita até acertar, dando dicas.", answer: "while chute != secreto: informar maior/menor; ler chute", type: "challenge" },
        { text: "Explique 2 formas de evitar loop infinito em while.", answer: "atualizar variável de controle; condição de parada correta", type: "challenge" }
    ]
};

const SPECIAL_CARDS = [
    { type: "LoopInfinito", effect: "skip", text: "⚠️ Loop Infinito! Você perde a próxima rodada." },
    { type: "LoopInfinito", effect: "skip", text: "⚠️ Loop Infinito! Você perde a próxima rodada." },
    { type: "LoopInfinito", effect: "skip", text: "⚠️ Loop Infinito! Você perde a próxima rodada." },
    { type: "Debug", effect: "debug", text: "🔧 Debug! Use para avançar 2 casas ou anular uma penalidade." },
    { type: "Debug", effect: "debug", text: "🔧 Debug! Use para avançar 2 casas ou anular uma penalidade." },
    { type: "Debug", effect: "debug", text: "🔧 Debug! Use para avançar 2 casas ou anular uma penalidade." },
    { type: "Avanco", effect: "advance", text: "⏩ Avanço! Avance +3 casas sem comprar carta." },
    { type: "Avanco", effect: "advance", text: "⏩ Avanço! Avance +3 casas sem comprar carta." }
];

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function resetAndShuffleDecks() {
    for (let i = 1; i <= 4; i++) {
        gameState.deck[i] = shuffleArray([...CARDS_BY_PHASE[i]]);
    }
    gameState.specialDeck = shuffleArray([...SPECIAL_CARDS]);
    console.log("Decks reset and shuffled.");
}

function getCardForPhase(phase) {
    const phaseDeck = gameState.deck[phase];
    if (phaseDeck.length === 0) {
        gameState.deck[phase] = shuffleArray([...CARDS_BY_PHASE[phase]]);
        console.log(`Deck da fase ${phase} recarregado.`);
    }
    return gameState.deck[phase].pop();
}

function getSpecialCard() {
    if (gameState.specialDeck.length === 0) {
        gameState.specialDeck = shuffleArray([...SPECIAL_CARDS]);
        console.log("Special deck recarregado.");
    }
    return gameState.specialDeck.pop();
}

function initializeGame(playersList) {
    gameState.players = playersList;
    gameState.currentPlayerIndex = 0;
    gameState.playersPositions = new Array(playersList.length).fill(0);
    gameState.playersSkipped = new Array(playersList.length).fill(false);
    gameState.playersSpecialCards = playersList.map(() => ({ debug: 0, antiLoop: 0 }));
    gameState.gameActive = true;
    gameState.winner = null;
    resetAndShuffleDecks();
    console.log(`Jogo iniciado com ${playersList.length} jogadores: ${playersList.join(', ')}`);
    return {
        players: gameState.players,
        positions: gameState.playersPositions,
        currentPlayerIndex: gameState.currentPlayerIndex,
        boardSize: gameState.boardSize
    };
}

function applySpecialCardEffect(playerId, cardType) {
    const playerIndex = gameState.players.indexOf(playerId);
    const specials = gameState.playersSpecialCards[playerIndex];
    if (cardType === 'debug' && specials.debug > 0) {
        specials.debug--;
        return { success: true, effect: 'debug_used', message: 'Você usou um Debug!' };
    } else if (cardType === 'antiLoop' && specials.antiLoop > 0) {
        specials.antiLoop--;
        return { success: true, effect: 'antiLoop_used', message: 'Você usou um Anti-Loop!' };
    }
    return { success: false, message: 'Você não possui esta carta especial.' };
}

function movePlayer(playerId, diceRoll, correctAnswer, isSpecialCardAdvance = false) {
    const playerIndex = gameState.players.indexOf(playerId);
    if (playerIndex === -1) return { success: false, message: "Jogador não encontrado." };
    if (!gameState.gameActive) return { success: false, message: "Jogo não está ativo." };
    if (gameState.winner) return { success: false, message: `Jogo já terminou! Vencedor: ${gameState.winner}` };
    if (gameState.playersSkipped[playerIndex]) {
        gameState.playersSkipped[playerIndex] = false;
        return { success: false, message: "Você perdeu a rodada por um Loop Infinito!", wasSkipped: true };
    }
    
    let newPosition = gameState.playersPositions[playerIndex];
    if (isSpecialCardAdvance) {
        newPosition += 3;
        if (newPosition > gameState.boardSize) newPosition = gameState.boardSize;
        gameState.playersPositions[playerIndex] = newPosition;
        let gameEnded = false;
        let winner = null;
        if (newPosition === gameState.boardSize) {
            gameState.gameActive = false;
            gameState.winner = playerId;
            gameEnded = true;
            winner = playerId;
        }
        return { success: true, newPosition, gameEnded, winner, card: null, specialCardUsed: true };
    }
    
    if (!correctAnswer && gameState.playersPositions[playerIndex] !== 0) {
        newPosition = Math.max(0, newPosition - 1);
        gameState.playersPositions[playerIndex] = newPosition;
        return { success: false, message: "Resposta errada! Volte uma casa.", newPosition };
    }
    
    newPosition += diceRoll;
    if (newPosition > gameState.boardSize) newPosition = gameState.boardSize;
    
    const specialTiles = {
        5: { name: 'LoopInfinito', effect: 'skip' },
        12: { name: 'Debug', effect: 'debug' },
        19: { name: 'Avanco', effect: 'advance' },
        25: { name: 'AntiLoop', effect: 'antiLoop' },
        27: { name: 'LoopInfinito', effect: 'skip' }
    };
    
    if (specialTiles[newPosition]) {
        const tile = specialTiles[newPosition];
        if (tile.effect === 'skip') {
            gameState.playersSkipped[playerIndex] = true;
        } else if (tile.effect === 'debug') {
            gameState.playersSpecialCards[playerIndex].debug++;
        } else if (tile.effect === 'antiLoop') {
            gameState.playersSpecialCards[playerIndex].antiLoop++;
        } else if (tile.effect === 'advance') {
            newPosition = Math.min(gameState.boardSize, newPosition + 3);
            if (newPosition === gameState.boardSize) {
                gameState.gameActive = false;
                gameState.winner = playerId;
                return { success: true, newPosition, gameEnded: true, winner: playerId, card: null, specialTile: tile.name };
            }
        }
        gameState.playersPositions[playerIndex] = newPosition;
        let phase = newPosition <= 8 ? 1 : newPosition <= 16 ? 2 : newPosition <= 24 ? 3 : 4;
        const card = getCardForPhase(phase);
        return { success: true, newPosition, card, specialTile: tile.name, phase };
    }
    
    gameState.playersPositions[playerIndex] = newPosition;
    let gameEnded = false;
    let winner = null;
    if (newPosition === gameState.boardSize) {
        gameState.gameActive = false;
        gameState.winner = playerId;
        gameEnded = true;
        winner = playerId;
    }
    let phase = newPosition <= 8 ? 1 : newPosition <= 16 ? 2 : newPosition <= 24 ? 3 : 4;
    const card = getCardForPhase(phase);
    return { success: true, newPosition, gameEnded, winner, card, phase };
}

function nextTurn() {
    if (!gameState.gameActive) return null;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    return {
        currentPlayer: gameState.players[gameState.currentPlayerIndex],
        currentPlayerIndex: gameState.currentPlayerIndex,
        positions: gameState.playersPositions,
        playersSkipped: gameState.playersSkipped
    };
}

// --- Socket.IO: Comunicação em Tempo Real ---
io.on('connection', (socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);

    socket.on('start-game', (players) => {
        if (!players || players.length < 2) {
            socket.emit('game-error', 'É necessário pelo menos 2 jogadores para começar.');
            return;
        }
        const gameData = initializeGame(players);
        io.emit('game-initialized', gameData);
    });

    socket.on('roll-dice', (playerId) => {
        const playerIndex = gameState.players.indexOf(playerId);
        if (playerIndex !== gameState.currentPlayerIndex) {
            socket.emit('game-error', 'Não é sua vez!');
            return;
        }
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        socket.emit('dice-rolled', { playerId, diceRoll });
    });

    socket.on('move-player', (data) => {
        const { playerId, diceRoll, answer, challengeAnswer, specialCardUsed } = data;
        let isCorrect = false;
        if (answer && challengeAnswer) {
            isCorrect = answer.toLowerCase().trim() === challengeAnswer.toLowerCase().trim();
        } else if (specialCardUsed) {
            isCorrect = true;
        }
        
        const moveResult = movePlayer(playerId, diceRoll, isCorrect, specialCardUsed);
        if (!moveResult.success && moveResult.wasSkipped) {
            io.emit('player-skipped', { playerId, message: moveResult.message });
            const turnUpdate = nextTurn();
            if (turnUpdate) io.emit('turn-update', turnUpdate);
            return;
        }
        
        io.emit('player-moved', moveResult);
        
        if (moveResult.gameEnded) {
            io.emit('game-ended', { winner: moveResult.winner });
            return;
        }
        
        if (moveResult.card) {
            io.emit('card-drawn', { playerId, card: moveResult.card, phase: moveResult.phase });
        } else if (moveResult.specialTile) {
            let specialMessage = `Você caiu em uma casa especial: ${moveResult.specialTile}!`;
            if (moveResult.specialTile === 'LoopInfinito') specialMessage = `⚠️ ${specialMessage} Você perde a próxima rodada.`;
            else if (moveResult.specialTile === 'Debug') specialMessage = `🔧 ${specialMessage} Você ganhou uma carta Debug!`;
            else if (moveResult.specialTile === 'AntiLoop') specialMessage = `🛡️ ${specialMessage} Você ganhou uma carta Anti-Loop!`;
            else if (moveResult.specialTile === 'Avanco') specialMessage = `⏩ ${specialMessage} Avance +3 casas!`;
            io.emit('special-tile', { playerId, message: specialMessage, tileType: moveResult.specialTile });
        }
        
        const turnUpdate = nextTurn();
        if (turnUpdate) io.emit('turn-update', turnUpdate);
    });

    socket.on('use-special-card', (data) => {
        const { playerId, cardType } = data;
        const result = applySpecialCardEffect(playerId, cardType);
        io.emit('special-card-used', { playerId, result });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    });
});

// --- Inicialização do Servidor ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Socket.IO pronto para conexões.`);
});
