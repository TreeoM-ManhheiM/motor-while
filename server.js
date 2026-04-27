const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Salas
const rooms = new Map();

// ==================== 30 MISSÕES ====================
const MISSOES = [
    { id: 0, titulo: "🔄 1. Contagem Regressiva", historia: "Use um loop `while` para exibir os números de 5 até 1 (decrescente).", dica: "Inicialize `contador = 5` e decremente até 0.", codigoEsperado: ["contador = 5", "while contador > 0:", "    print(contador)", "    contador -= 1"] },
    { id: 1, titulo: "➕ 2. Soma até 100", historia: "Some números de 1 até atingir ou ultrapassar 100. Exiba a soma final.", dica: "Use `soma = 0`, `numero = 1`, while soma < 100: soma += numero; numero += 1", codigoEsperado: ["soma = 0", "numero = 1", "while soma < 100:", "    soma += numero", "    numero += 1", "print(soma)"] },
    { id: 2, titulo: "⛔ 3. Menu com Break", historia: "Crie um loop infinito que pede um comando. Se o usuário digitar 'sair', use `break` para encerrar.", dica: "while True: comando = input(); if comando == 'sair': break", codigoEsperado: ["while True:", "    comando = input('Digite um comando (ou \"sair\"): ')", "    if comando == 'sair':", "        break", "    print(f'Você digitou: {comando}')"] },
    { id: 3, titulo: "⏭️ 4. Continue - Ímpares", historia: "Exiba apenas os números ímpares de 1 a 10. Use `continue` para pular os pares.", dica: "numero = 1; while numero <= 10: if numero % 2 == 0: numero += 1; continue; print(numero); numero += 1", codigoEsperado: ["numero = 1", "while numero <= 10:", "    if numero % 2 == 0:", "        numero += 1", "        continue", "    print(numero)", "    numero += 1"] },
    { id: 4, titulo: "🔢 5. AND - Múltiplo de 3 e 5", historia: "Percorra números de 1 a 20. Pare quando encontrar um número divisível por 3 E por 5 (múltiplo de 15).", dica: "if i % 3 == 0 and i % 5 == 0: break", codigoEsperado: ["i = 1", "while i <= 20:", "    if i % 3 == 0 and i % 5 == 0:", "        break", "    print(i)", "    i += 1"] },
    { id: 5, titulo: "🔀 6. OR - Parada com 0 ou negativo", historia: "Peça números até que o usuário digite 0 ou um número negativo. Use `break`.", dica: "while True: num = int(input()); if num == 0 or num < 0: break", codigoEsperado: ["while True:", "    num = int(input('Digite um número (0 ou negativo para parar): '))", "    if num == 0 or num < 0:", "        break", "    print(f'Você digitou: {num}')"] },
    { id: 6, titulo: "🚫 7. NOT - Validação de senha", historia: "Peça a senha. Enquanto a senha NÃO for '1234', continue pedindo. Use `not`.", dica: "senha = ''; while not senha == '1234': senha = input()", codigoEsperado: ["senha = ''", "while not senha == '1234':", "    senha = input('Digite a senha: ')", "print('Acesso liberado!')"] },
    { id: 7, titulo: "🎲 8. Tabuada interativa", historia: "Peça um número e mostre sua tabuada do 1 ao 10 usando while.", dica: "n = int(input()); i = 1; while i <= 10: print(f'{n} x {i} = {n*i}'); i += 1", codigoEsperado: ["n = int(input('Digite um número: '))", "i = 1", "while i <= 10:", "    print(f'{n} x {i} = {n*i}')", "    i += 1"] },
    { id: 8, titulo: "📝 9. Break - Encontrando primo", historia: "Verifique se um número é primo. Se encontrar um divisor, use break.", dica: "num = int(input()); i = 2; while i < num: if num % i == 0: break; i += 1", codigoEsperado: ["num = int(input('Digite um número: '))", "i = 2", "while i < num:", "    if num % i == 0:", "        print(f'{num} não é primo')", "        break", "    i += 1", "else:", "    print(f'{num} é primo')"] },
    { id: 9, titulo: "🔄 10. Continue - Múltiplos de 3", historia: "Exiba números de 1 a 20, pulando os múltiplos de 3 (use continue).", dica: "i = 1; while i <= 20: if i % 3 == 0: i += 1; continue; print(i); i += 1", codigoEsperado: ["i = 1", "while i <= 20:", "    if i % 3 == 0:", "        i += 1", "        continue", "    print(i)", "    i += 1"] },
    { id: 10, titulo: "💡 11. Validação de entrada (1 a 10)", historia: "Peça um número entre 1 e 10. Enquanto não estiver nesse intervalo, continue pedindo.", dica: "num = 0; while num < 1 or num > 10: num = int(input())", codigoEsperado: ["num = 0", "while num < 1 or num > 10:", "    num = int(input('Digite um número entre 1 e 10: '))", "print(f'Número válido: {num}')"] },
    { id: 11, titulo: "🧮 12. Fatorial", historia: "Calcule o fatorial de um número usando while. Ex: 5! = 120.", dica: "n = int(input()); fat = 1; while n > 0: fat *= n; n -= 1", codigoEsperado: ["n = int(input('Digite um número: '))", "fatorial = 1", "original = n", "while n > 0:", "    fatorial *= n", "    n -= 1", "print(f'{original}! = {fatorial}')"] },
    { id: 12, titulo: "🎯 13. Break e Continue combinados", historia: "Percorra números de 1 a 50. Pule pares (continue). Se encontrar primo > 30, pare (break).", dica: "Use while, if para par, continue, e break na condição especial.", codigoEsperado: ["i = 1", "while i <= 50:", "    if i % 2 == 0:", "        i += 1", "        continue", "    if i > 30 and i % 2 != 0 and i % 3 != 0 and i % 5 != 0:", "        print(f'Primo encontrado: {i}')", "        break", "    print(i)", "    i += 1"] },
    { id: 13, titulo: "🏦 14. Caixa eletrônico", historia: "Simule um caixa com saldo 1000. Permita saques. Se saldo insuficiente, continue pedindo. Se digitar 0, break.", dica: "saldo = 1000; while True: saque = int(input()); if saque == 0: break; if saque > saldo: continue; saldo -= saque", codigoEsperado: ["saldo = 1000", "while True:", "    saque = int(input('Digite o valor do saque (0 para sair): '))", "    if saque == 0:", "        break", "    if saque > saldo:", "        print('Saldo insuficiente!')", "        continue", "    saldo -= saque", "    print(f'Saque realizado. Saldo atual: {saldo}')"] },
    { id: 14, titulo: "🎮 15. Jogo da adivinhação", historia: "Número secreto = 42. Peça palpites até acertar. Use break quando acertar.", dica: "while True: palpite = int(input()); if palpite == 42: break; else: print('Errou')", codigoEsperado: ["secreto = 42", "while True:", "    palpite = int(input('Adivinhe o número secreto: '))", "    if palpite == secreto:", "        print('Acertou!')", "        break", "    else:", "        print('Tente novamente!')"] },
    { id: 15, titulo: "📊 16. Média de notas", historia: "Peça notas até -1. Ignore notas negativas (continue). Calcule a média.", dica: "soma=0; cont=0; while True: nota = float(input()); if nota == -1: break; if nota < 0: continue; soma+=nota; cont+=1", codigoEsperado: ["soma = 0", "contador = 0", "while True:", "    nota = float(input('Digite a nota (-1 para sair): '))", "    if nota == -1:", "        break", "    if nota < 0:", "        continue", "    soma += nota", "    contador += 1", "if contador > 0:", "    media = soma / contador", "    print(f'Média: {media:.2f}')"] },
    { id: 16, titulo: "🔄 17. While aninhado com break", historia: "Use while aninhado (i de 1 a 3, j de 1 a 5). Se j for 3, interrompa o loop interno.", dica: "i=1; while i<=3: j=1; while j<=5: if j==3: break; print(i,j); j+=1; i+=1", codigoEsperado: ["i = 1", "while i <= 3:", "    j = 1", "    while j <= 5:", "        if j == 3:", "            break", "        print(i, j)", "        j += 1", "    i += 1"] },
    { id: 17, titulo: "🔍 18. Sequência de Fibonacci", historia: "Gere a sequência de Fibonacci até ultrapassar 1000. Pare quando o termo > 1000.", dica: "a,b=0,1; while a<=1000: print(a); a,b=b,a+b", codigoEsperado: ["a, b = 0, 1", "while a <= 1000:", "    print(a)", "    a, b = b, a + b"] },
    { id: 18, titulo: "⚡ 19. Operadores compostos", historia: "Peça um número. Enquanto ele não estiver entre 51 e 99 (inclusive), continue pedindo.", dica: "num=0; while not (num>50 and num<100): num=int(input())", codigoEsperado: ["num = 0", "while not (num > 50 and num < 100):", "    num = int(input('Digite um número entre 51 e 99: '))", "print(f'Número aceito: {num}')"] },
    { id: 19, titulo: "🏁 20. Login com tentativas", historia: "Sistema de login com 3 tentativas. Use while, break se acertar, continue se errar.", dica: "tent=0; while tent<3: user=input(); senha=input(); if user=='admin' and senha=='123': print('Acesso'); break; else: tent+=1; continue; else: print('Bloqueado')", codigoEsperado: ["tentativas = 0", "while tentativas < 3:", "    usuario = input('Usuário: ')","    senha = input('Senha: ')","    if usuario == 'admin' and senha == '123':","        print('Acesso liberado!')","        break","    else:","        tentativas += 1","        print(f'Senha incorreta! Tentativas restantes: {3 - tentativas}')","        continue","else:","    print('Conta bloqueada! Muitas tentativas.')"] },
    { id: 20, titulo: "🔄 21. While - Pares até N", historia: "Exiba todos os números pares de 2 até N (inclusive). Use while.", dica: "n=int(input()); i=2; while i<=n: print(i); i+=2", codigoEsperado: ["n = int(input('Digite um número: '))", "i = 2", "while i <= n:", "    print(i)", "    i += 2"] },
    { id: 21, titulo: "📉 22. While - Decrescente com passo", historia: "Exiba números de 10 até 1, pulando de 2 em 2 (10,8,6,4,2).", dica: "i=10; while i>=1: print(i); i-=2", codigoEsperado: ["i = 10", "while i >= 1:", "    print(i)", "    i -= 2"] },
    { id: 22, titulo: "🔁 23. While - Potência de 2", historia: "Exiba as potências de 2 enquanto forem menores que 1000 (1,2,4,8,...).", dica: "i=1; while i<1000: print(i); i*=2", codigoEsperado: ["i = 1", "while i < 1000:", "    print(i)", "    i *= 2"] },
    { id: 23, titulo: "📥 24. Break - Soma até negativo", historia: "Some números digitados até que um número negativo seja inserido. Use break.", dica: "soma=0; while True: n=int(input()); if n<0: break; soma+=n; print(soma)", codigoEsperado: ["soma = 0", "while True:", "    num = int(input('Digite um número (negativo para parar): '))", "    if num < 0:", "        break", "    soma += num", "    print(f'Soma parcial: {soma}')"] },
    { id: 24, titulo: "⏩ 25. Continue - Ignorar múltiplos de 5", historia: "Exiba números de 1 a 30, mas pule os múltiplos de 5.", dica: "i=1; while i<=30: if i%5==0: i+=1; continue; print(i); i+=1", codigoEsperado: ["i = 1", "while i <= 30:", "    if i % 5 == 0:", "        i += 1", "        continue", "    print(i)", "    i += 1"] },
    { id: 25, titulo: "🔐 26. While - Validação com OR", historia: "Peça um número que seja múltiplo de 3 ou de 5. Enquanto não for, continue pedindo.", dica: "num=0; while not (num%3==0 or num%5==0): num=int(input())", codigoEsperado: ["num = 0", "while not (num % 3 == 0 or num % 5 == 0):", "    num = int(input('Digite um múltiplo de 3 ou 5: '))", "print(f'Número válido: {num}')"] },
    { id: 26, titulo: "📈 27. While - Crescente até N", historia: "Exiba números de 1 até N, mas pare se encontrar um número maior que 100. Use break.", dica: "n=int(input()); i=1; while i<=n: if i>100: break; print(i); i+=1", codigoEsperado: ["n = int(input('Digite o limite: '))", "i = 1", "while i <= n:", "    if i > 100:", "        break", "    print(i)", "    i += 1"] },
    { id: 27, titulo: "🧮 28. Soma dos dígitos", historia: "Calcule a soma dos dígitos de um número positivo usando while.", dica: "n=int(input()); soma=0; while n>0: soma+=n%10; n//=10; print(soma)", codigoEsperado: ["n = int(input('Digite um número: '))", "soma = 0", "while n > 0:", "    soma += n % 10", "    n //= 10", "print(f'Soma dos dígitos: {soma}')"] },
    { id: 28, titulo: "🔄 29. While - Inverter número", historia: "Inverta a ordem dos dígitos de um número. Ex: 123 → 321.", dica: "n=int(input()); invertido=0; while n>0: invertido=invertido*10 + n%10; n//=10; print(invertido)", codigoEsperado: ["n = int(input('Digite um número: '))", "invertido = 0", "while n > 0:", "    invertido = invertido * 10 + n % 10", "    n //= 10", "print(f'Número invertido: {invertido}')"] },
    { id: 29, titulo: "🏆 30. Desafio final - Múltiplas condições", historia: "Peça números até que a soma ultrapasse 500 ou o usuário digite -1. Mostre a soma final.", dica: "soma=0; while True: n=int(input()); if n==-1: break; soma+=n; if soma>500: break; print(soma)", codigoEsperado: ["soma = 0", "while True:", "    num = int(input('Digite um número (-1 para sair): '))", "    if num == -1:", "        break", "    soma += num", "    if soma > 500:", "        break", "    print(f'Soma atual: {soma}')", "print(f'Soma final: {soma}')"] }
];

function getMissao(id) {
    return MISSOES[id];
}

function getNumMissoes() {
    return MISSOES.length;
}

// Estado do jogo para uma sala
function createGameState(roomId, playersNames) {
    const state = {
        players: playersNames,
        currentPlayerIndex: 0,
        boardSize: 30, // 30 casas = 30 missões
        playersPositions: new Array(playersNames.length).fill(0),
        playersMissaoAtual: new Array(playersNames.length).fill(0),
        gameActive: true,
        winner: null,
        missoesAcumuladas: playersNames.map(() => []) // históricos
    };
    return state;
}

io.on('connection', (socket) => {
    console.log(`Cliente ${socket.id} conectado`);

    socket.on('join-room', ({ playerName, roomName }) => {
        const roomId = roomName.trim();
        if (!rooms.has(roomId)) {
            rooms.set(roomId, { players: {}, readyStatus: {}, gameState: null });
        }
        const room = rooms.get(roomId);
        if (room.gameState && room.gameState.gameActive) {
            socket.emit('error-msg', 'Jogo já começou nesta sala.');
            return;
        }
        if (room.players[playerName]) {
            socket.emit('error-msg', 'Nome já usado.');
            return;
        }
        room.players[playerName] = socket.id;
        room.readyStatus[playerName] = false;
        socket.join(roomId);
        socket.emit('room-joined', { room: roomId, playerName, players: room.players, readyStatus: room.readyStatus });
        io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
    });

    socket.on('player-ready', ({ room, playerName }) => {
        const roomObj = rooms.get(room);
        if (!roomObj) return;
        if (roomObj.gameState) return;
        if (roomObj.readyStatus[playerName] !== undefined) {
            roomObj.readyStatus[playerName] = true;
            io.to(room).emit('room-update', { players: roomObj.players, readyStatus: roomObj.readyStatus });
            const allReady = Object.values(roomObj.readyStatus).every(v => v === true);
            const playerCount = Object.keys(roomObj.players).length;
            if (allReady && playerCount >= 2) {
                const playersNames = Object.keys(roomObj.players);
                const gameState = createGameState(room, playersNames);
                roomObj.gameState = gameState;
                io.to(room).emit('game-start', {
                    players: playersNames,
                    positions: gameState.playersPositions,
                    currentPlayer: gameState.players[gameState.currentPlayerIndex],
                    missoesPorPosicao: MISSOES.map((m, idx) => ({ idx, titulo: m.titulo }))
                });
            }
        }
    });

    socket.on('request-missao', ({ room, playerId, posicao }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const state = roomObj.gameState;
        const idxPlayer = state.players.indexOf(playerId);
        if (idxPlayer === -1) return;
        const missaoIdx = posicao; // a casa atual (0..29)
        if (missaoIdx >= 0 && missaoIdx < MISSOES.length) {
            const missao = MISSOES[missaoIdx];
            socket.emit('missao-data', { missao, posicao: missaoIdx });
        }
    });

    socket.on('submit-codigo', ({ room, playerId, posicao, blocosMontados }) => {
        const roomObj = rooms.get(room);
        if (!roomObj || !roomObj.gameState) return;
        const state = roomObj.gameState;
        const idxPlayer = state.players.indexOf(playerId);
        if (idxPlayer === -1) return;
        // Verificar se é a vez do jogador
        if (state.players[state.currentPlayerIndex] !== playerId) {
            socket.emit('error-msg', 'Não é sua vez');
            return;
        }
        const missao = MISSOES[posicao];
        const esperado = missao.codigoEsperado;
        let acertou = (blocosMontados.length === esperado.length);
        if (acertou) {
            for (let i = 0; i < esperado.length; i++) {
                if (blocosMontados[i] !== esperado[i]) { acertou = false; break; }
            }
        }
        if (acertou) {
            // Avança para próxima casa
            let newPos = state.playersPositions[idxPlayer] + 1;
            if (newPos > state.boardSize) newPos = state.boardSize;
            state.playersPositions[idxPlayer] = newPos;
            io.to(room).emit('move-result', { playerId, success: true, message: 'Missão concluída! Avançou uma casa.', newPosition: newPos, positions: state.playersPositions });
            // Verificar vitória
            if (newPos === state.boardSize) {
                state.gameActive = false;
                state.winner = playerId;
                io.to(room).emit('game-ended', { winner: playerId });
                return;
            }
            // Próximo turno
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            io.to(room).emit('turn-update', { currentPlayer: state.players[state.currentPlayerIndex], positions: state.playersPositions });
        } else {
            // Errou: volta uma casa (se não estiver na primeira)
            let newPos = state.playersPositions[idxPlayer];
            if (newPos > 0) newPos--;
            state.playersPositions[idxPlayer] = newPos;
            io.to(room).emit('move-result', { playerId, success: false, message: 'Código incorreto! Voltou uma casa.', newPosition: newPos, positions: state.playersPositions });
            // Próximo turno (não é penalidade extra)
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            io.to(room).emit('turn-update', { currentPlayer: state.players[state.currentPlayerIndex], positions: state.playersPositions });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} desconectado`);
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
                if (Object.keys(room.players).length === 0) rooms.delete(roomId);
                else io.to(roomId).emit('room-update', { players: room.players, readyStatus: room.readyStatus });
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT} com 30 missões de programação`);
});
