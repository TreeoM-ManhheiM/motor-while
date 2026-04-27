const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Estrutura de salas
const rooms = new Map(); // roomId -> { players: { name: socketId }, readyStatus: { name: bool }, gameState: null ou objeto do jogo }

// === Baralhos (mesmo código anterior) ===
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

function initializeGameState(roomId, playersNames) {
    const players = playersNames;
    const state = {
        players: players,
        currentPlayerIndex: 0,
        boardSize: 28,
        playersPositions: new Array(players.length).fill(0),
        playersSkipped: new Array(players.length).fill(false),
        playersSpecialCards: players.map(() => ({ debug: 0, antiLoop: 0 })),
        deck: { 1: [], 2: [], 3: [], 4: [] },
        specialDeck: [],
        gameActive: true,
        winner: null
    };
    // Embaralhar decks
    for (let i = 1; i <= 4; i++) {
        state.deck[i] = shuffleArray([...CARDS_BY_PHASE[i]]);
    }
    state.specialDeck = shuffleArray([...SPECIAL_CARDS]);
    return state;
}

function getCardForPhase(state, phase) {
    let deck = state.deck[phase];
    if (deck.length === 0) {
        state.deck[phase] = shuffleArray([...CARDS_BY_PHASE[phase]]);
        deck = state.deck[phase];
    }
    return deck.pop();
}

function movePlayerInRoom(roomId, playerId, diceRoll, correctAnswer, isSpecialAdvance) {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return { success: false, message: "Jogo não encontrado" };
    const state = room.gameState;
    const playerIndex = state.players.indexOf(playerId);
    if (playerIndex === -1) return { success: false };
    if (!state.gameActive) return { success: false, message: "Jogo acabou" };
    if (state.winner) return { success: false };

    if (state.playersSkipped[playerIndex]) {
        state.playersSkipped[playerIndex] = false;
        return { success: false, wasSkipped: true, message: "Perdeu a rodada" };
    }

    let newPos = state.playersPositions[playerIndex];

    if (isSpecialAdvance) {
        newPos += 3;
        if (newPos > state.boardSize) newPos = state.boardSize;
        state.playersPositions[playerIndex] = newPos;
        let gameEnded = false, winner = null;
        if (newPos === state.boardSize) {
            state.gameActive = false;
            state.winner = playerId;
            gameEnded = true;
            winner = playerId;
        }
        return { success: true, newPosition: newPos, gameEnded, winner, specialCardUsed: true };
    }

    if (!correctAnswer && newPos !== 0) {
        newPos = Math.max(0, newPos - 1);
        state.playersPositions[playerIndex] = newPos;
        return { success: false, newPosition: newPos, message: "Errou! Voltou uma casa." };
    }

    newPos += diceRoll;
    if (newPos > state.boardSize) newPos = state.boardSize;

    const specialTiles = {
        5: { name: 'LoopInfinito', effect: 'skip' },
        12: { name: 'Debug', effect: 'debug' },
        19: { name: 'Avanco', effect: 'advance' },
        25: { name: 'AntiLoop', effect: 'antiLoop' },
        27: { name: 'LoopInfinito', effect: 'skip' }
    };

    if (specialTiles[newPos]) {
        const tile = specialTiles[newPos];
        if (tile.effect === 'skip') state.playersSkipped[playerIndex] = true;
        else if (tile.effect === 'debug') state.playersSpecialCards[playerIndex].debug++;
        else if (tile.effect === 'antiLoop') state.playersSpecialCards[playerIndex].antiLoop++;
        else if (tile.effect === 'advance') {
            newPos = Math.min(state.boardSize, newPos + 3);
            if (newPos === state.boardSize) {
                state.gameActive = false;
                state.winner = playerId;
                return { success: true, newPosition: newPos, gameEnded: true, winner: playerId, specialTile: tile.name };
            }
        }
        state.playersPositions[playerIndex] = newPos;
        let phase = newPos <= 8 ? 1 : newPos <= 16 ? 2 : newPos <= 24 ? 3 : 4;
        const card = getCardForPhase(state, phase);
        return { success: true, newPosition: newPos, card, specialTile: tile.name, phase };
    }

    state.playersPositions[playerIndex] = newPos;
    let gameEnded = false, winner = null;
    if (newPos === state.boardSize) {
        state.gameActive = false;
        state.winner = playerId;
        gameEnded = true;
        winner = playerId;
    }
    let phase = newPos <= 8 ? 1 : newPos <= 16 ? 2 : newPos <= 24 ? 3 : 4;
    const card = getCardForPhase(state, phase);
    return { success: true, newPosition: newPos, gameEnded, winner, card, phase };
}

function nextTurnInRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.gameState || !room.gameState.gameActive) return null;
    const state = room.gameState;
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return {
        currentPlayer: state.players[state.currentPlayerIndex],
        positions: state.playersPositions,
        playersSkipped: state.playersSkipped
    };
}

// Socket.IO
io.on('connection', (socket) => {
    console.log(`Cliente ${socket.id} conectado`);

    socket.on('join-room', ({ playerName, roomName }) => {
        if (!playerName || !roomName) return;
        const roomId = roomName.trim();
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                players: {},
                readyStatus: {},
                gameState: null
            });
        }
        const room = rooms.get(roomId);
        // Verificar se nome já existe
        if (room.players[playerName]) {
            socket.emit('error-msg', 'Nome já usado nesta sala. Escolha outro.');
            return;
        }
        // Verificar se jogo já começou
        if (room.gameState && room.gameState.gameActive) {
            socket.emit('error-msg', 'Jogo já começou nesta sala. Não é possível entrar.');
            return;
        }
        room.players[playerName] = socket.id;
        room.readyStatus[playerName] = false;
        socket.join(roomId);
        socket.emit('room-joined', { room: roomId, playerName, players: room.players, readyStatus: room.readyStatus });
        // Atualizar todos da sala
        io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
    });

    socket.on('player-ready', ({ room, playerName }) => {
        const roomObj = rooms.get(room);
        if (!roomObj) return;
        if (roomObj.gameState && roomObj.gameState.gameActive) return;
        if (roomObj.readyStatus[playerName] !== undefined) {
            roomObj.readyStatus[playerName] = true;
            io.to(room).emit('room-update', { players: roomObj.players, readyStatus: roomObj.readyStatus });
            // Verificar se todos estão prontos e tem pelo menos 2 jogadores
            const allReady = Object.values(roomObj.readyStatus).every(v => v === true);
            const playerCount = Object.keys(roomObj.players).length;
            if (allReady && playerCount >= 2) {
                // Iniciar jogo
                const playersNames = Object.keys(roomObj.players);
                const gameState = initializeGameState(room, playersNames);
                roomObj.gameState = gameState;
                const startData = {
                    players: playersNames,
                    positions: gameState.playersPositions,
                    currentPlayer: gameState.players[gameState.currentPlayerIndex]
                };
                io.to(room).emit('game-start', startData);
            }
        }
    });

    socket.on('roll-dice', ({ room, playerId }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState || !roomObj.gameState.gameActive) return;
        const state = roomObj.gameState;
        const currentPlayer = state.players[state.currentPlayerIndex];
        if (currentPlayer !== playerId) {
            socket.emit('error-msg', 'Não é sua vez');
            return;
        }
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        io.to(room).emit('dice-rolled', { playerId, diceRoll });
    });

    socket.on('move-player', ({ room, playerId, diceRoll, answer, challengeAnswer }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const isCorrect = (answer && challengeAnswer && answer.toLowerCase().trim() === challengeAnswer.toLowerCase().trim());
        const moveResult = movePlayerInRoom(room, playerId, diceRoll, isCorrect, false);
        if (moveResult.wasSkipped) {
            const turnUpdate = nextTurnInRoom(room);
            if (turnUpdate) io.to(room).emit('turn-update', turnUpdate);
            return;
        }
        io.to(room).emit('player-moved', moveResult);
        if (moveResult.gameEnded) {
            io.to(room).emit('game-ended', { winner: moveResult.winner });
            return;
        }
        if (moveResult.card) {
            io.to(room).emit('card-drawn', { playerId, card: moveResult.card, phase: moveResult.phase });
        } else if (moveResult.specialTile) {
            let msg = `Caiu em casa especial: ${moveResult.specialTile}`;
            io.to(room).emit('special-tile', { playerId, message: msg });
        }
        const turnUpdate = nextTurnInRoom(room);
        if (turnUpdate) io.to(room).emit('turn-update', turnUpdate);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} desconectado`);
        // Remover de todas as salas
        for (let [roomId, room] of rooms.entries()) {
            let found = false;
            for (let [name, id] of Object.entries(room.players)) {
                if (id === socket.id) {
                    delete room.players[name];
                    delete room.readyStatus[name];
                    found = true;
                    break;
                }
            }
            if (found) {
                if (Object.keys(room.players).length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} com suporte a salas e lobby`);
});
