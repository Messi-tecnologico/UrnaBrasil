/**
 * UrnaBrasil - Simulador de Urna Eletrônica TSE 2026
 * JavaScript principal: máquina de estados, sons Web Audio API e lógica de votação
 */
(function () {
    'use strict';

    // ============================================================
    // AUDIO ENGINE - Sons da Urna via Web Audio API
    // ============================================================
    let audioCtx = null;

    function getAudio() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTone(freq, dur, type, vol, delay) {
        const ctx = getAudio();
        if (!ctx) return;
        delay = delay || 0;
        type = type || 'sine';
        vol = vol || 0.25;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = type;
        osc.frequency.value = freq;

        const start = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.start(start);
        osc.stop(start + dur + 0.01);
    }

    const sons = {
        // Beep ao digitar uma tecla numérica
        tecla: function () {
            playTone(1800, 0.05, 'sine', 0.25);
        },

        // Beep do botão CORRIGE
        corrige: function () {
            playTone(600, 0.06, 'sine', 0.20);
            playTone(400, 0.12, 'sine', 0.18, 0.07);
        },

        // Candidato encontrado (número completo e válido)
        candidatoOk: function () {
            playTone(523.25, 0.08, 'sine', 0.2, 0.00);
            playTone(659.25, 0.08, 'sine', 0.2, 0.10);
            playTone(783.99, 0.12, 'sine', 0.2, 0.20);
        },

        // Número inválido / candidato não encontrado
        invalido: function () {
            playTone(320, 0.12, 'square', 0.15, 0.00);
            playTone(260, 0.20, 'square', 0.12, 0.14);
        },

        // BRANCO pressionado
        branco: function () {
            playTone(700, 0.08, 'sine', 0.18, 0.00);
            playTone(700, 0.08, 'sine', 0.18, 0.12);
        },

        // CONFIRMA — voto registrado
        confirma: function () {
            playTone(523.25, 0.08, 'sine', 0.22, 0.00);
            playTone(659.25, 0.08, 'sine', 0.22, 0.10);
            playTone(783.99, 0.08, 'sine', 0.22, 0.20);
            playTone(1046.50, 0.18, 'sine', 0.22, 0.30);
        },

        // Fim de votação (todos os cargos votados)
        fimVotacao: function () {
            playTone(1800, 1.5, 'sine', 0.35);
        },

        // Transição de cargo
        novoCargo: function () {
            playTone(440, 0.08, 'sine', 0.18, 0.00);
            playTone(523.25, 0.12, 'sine', 0.18, 0.10);
        }
    };

    // ============================================================
    // ESTADO DA URNA
    // ============================================================
    const MODOS = {
        AGUARDANDO: 'AGUARDANDO',       // Aguardando primeiro dígito
        DIGITANDO: 'DIGITANDO',         // Digitando número do candidato
        CANDIDATO_OK: 'CANDIDATO_OK',   // Candidato encontrado
        CANDIDATO_NULO: 'CANDIDATO_NULO', // Número completo mas inválido
        BRANCO: 'BRANCO',               // Voto em branco
        VOTANDO: 'VOTANDO',             // Processando (animação)
        FIM: 'FIM'                      // Todos os cargos votados
    };

    const estado = {
        cargos: [],
        cargoIdx: 0,
        digitos: '',
        modo: MODOS.AGUARDANDO,
        candidato: null,
        votos: []
    };

    // ============================================================
    // HELPERS DOM
    // ============================================================
    function el(id) { return document.getElementById(id); }

    function show(id) {
        const e = el(id);
        if (e) e.style.display = '';
    }

    function hide(id) {
        const e = el(id);
        if (e) e.style.display = 'none';
    }

    function addClass(id, cls) {
        const e = el(id);
        if (e) e.classList.add(cls);
    }

    function removeClass(id, cls) {
        const e = el(id);
        if (e) e.classList.remove(cls);
    }

    function setText(id, txt) {
        const e = el(id);
        if (e) e.textContent = txt;
    }

    function setHtml(id, html) {
        const e = el(id);
        if (e) e.innerHTML = html;
    }

    // ============================================================
    // INICIALIZAÇÃO COM DADOS JSON
    // ============================================================
    function carregarDados(json) {
        try {
            const dados = (typeof json === 'string') ? JSON.parse(json) : json;
            estado.cargos = dados.cargos || [];
        } catch (e) {
            console.error('Erro ao carregar candidatos.json:', e);
            estado.cargos = [];
        }
    }

    // ============================================================
    // HELPERS DA URNA
    // ============================================================
    function cargoAtual() {
        return estado.cargos[estado.cargoIdx] || null;
    }

    function buscarCandidato(numero) {
        const cargo = cargoAtual();
        if (!cargo) return null;
        return cargo.candidatos.find(function (c) {
            return c.numero === numero;
        }) || null;
    }

    function getIniciais(nome) {
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    // ============================================================
    // RENDERIZAÇÃO
    // ============================================================
    function render() {
        const cargo = cargoAtual();
        if (!cargo && estado.modo !== MODOS.FIM) return;

        // Atualiza cargo header
        if (cargo && estado.modo !== MODOS.FIM) {
            show('cargo-header');
            show('numero-label');
            show('cargo-progress');
            setText('cargo-titulo', cargo.cargo);
            setText('cargo-descricao', cargo.descricao || '');
        } else {
            hide('cargo-header');
            hide('numero-label');
            hide('cargo-progress');
        }

        // Atualiza progresso
        if (estado.modo !== MODOS.FIM) {
            renderProgress();
        }

        // Atualiza caixas de dígitos
        renderDigitos(cargo);

        // Controla seções visíveis
        switch (estado.modo) {
            case MODOS.AGUARDANDO:
                hideSection('candidato-section');
                hideSection('confirmacao-box');
                hideSection('fim-votacao-section');
                ocultarOverlay();
                setMensagem('APERTE O NÚMERO DO CANDIDATO', '');
                removeClass('btn-confirma-id', 'pulsando');
                break;

            case MODOS.DIGITANDO:
                hideSection('candidato-section');
                hideSection('confirmacao-box');
                hideSection('fim-votacao-section');
                ocultarOverlay();
                setMensagem('', '');
                removeClass('btn-confirma-id', 'pulsando');
                break;

            case MODOS.CANDIDATO_OK:
                showSection('candidato-section');
                showSection('confirmacao-box');
                hideSection('fim-votacao-section');
                ocultarOverlay();
                renderCandidato(estado.candidato, cargo);
                setMensagem('', '');
                addClass('btn-confirma-id', 'pulsando');
                break;

            case MODOS.CANDIDATO_NULO:
                hideSection('candidato-section');
                showSection('confirmacao-box');
                hideSection('fim-votacao-section');
                ocultarOverlay();
                setText('confirmacao-titulo', 'VOTO NULO');
                setMensagem('NÚMERO INVÁLIDO - CONFIRME PARA VOTO NULO', 'erro');
                addClass('btn-confirma-id', 'pulsando');
                break;

            case MODOS.BRANCO:
                hideSection('candidato-section');
                showSection('confirmacao-box');
                hideSection('fim-votacao-section');
                ocultarOverlay();
                setText('confirmacao-titulo', 'VOTO EM BRANCO');
                setMensagem('CONFIRME SEU VOTO EM BRANCO', 'branco');
                addClass('btn-confirma-id', 'pulsando');
                break;

            case MODOS.VOTANDO:
                mostrarOverlay();
                break;

            case MODOS.FIM:
                ocultarOverlay();
                hideSection('candidato-section');
                hideSection('confirmacao-box');
                showSection('fim-votacao-section');
                showSection('btn-exportar-container');
                setMensagem('', '');
                renderFim();
                removeClass('btn-confirma-id', 'pulsando');
                // Zera caixas de dígitos
                limparDigitosDisplay();
                break;
        }
    }

    function renderDigitos(cargo) {
        const wrapper = el('digitos-wrapper');
        if (!wrapper || !cargo) return;

        // Recria os boxes se necessário (mudou número de dígitos)
        const qtdBoxes = wrapper.querySelectorAll('.digito-box').length;
        if (qtdBoxes !== cargo.digitos) {
            wrapper.innerHTML = '';
            for (let i = 0; i < cargo.digitos; i++) {
                const box = document.createElement('div');
                box.className = 'digito-box';
                box.id = 'digito-' + i;
                wrapper.appendChild(box);
            }
        }

        // Atualiza valores
        for (let i = 0; i < cargo.digitos; i++) {
            const box = el('digito-' + i);
            if (!box) continue;
            box.classList.remove('active', 'vazio', 'flash');

            if (estado.modo === MODOS.FIM) {
                box.textContent = '';
                box.classList.add('vazio');
            } else if (i < estado.digitos.length) {
                box.textContent = estado.digitos[i];
                box.classList.add('active');
            } else if (i === estado.digitos.length && estado.modo !== MODOS.CANDIDATO_OK && estado.modo !== MODOS.CANDIDATO_NULO && estado.modo !== MODOS.BRANCO) {
                box.textContent = '';
                box.classList.add('vazio'); // cursor piscando
            } else {
                box.textContent = '';
            }
        }
    }

    function limparDigitosDisplay() {
        const wrapper = el('digitos-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';
    }

    function flashDigito(idx) {
        const box = el('digito-' + idx);
        if (!box) return;
        box.classList.add('flash');
        setTimeout(function () { box.classList.remove('flash'); }, 250);
    }

    function renderCandidato(candidato, cargo) {
        if (!candidato) return;

        // Avatar com iniciais
        const iniciais = getIniciais(candidato.nome);
        setText('candidato-avatar-initials', iniciais);
        setText('candidato-avatar-partido', candidato.siglaPartido || '');

        // Cor do avatar baseada no candidato
        const avatarEl = el('candidato-avatar');
        if (avatarEl && candidato.cor) {
            avatarEl.style.borderColor = candidato.cor;
            el('candidato-avatar-initials').style.color = candidato.cor;
            el('candidato-avatar-initials').style.textShadow = '0 0 10px ' + candidato.cor;
        }

        // Informações
        setText('candidato-nome-urna', candidato.nome);
        setText('candidato-nome-completo-urna', candidato.nomeCompleto || candidato.nome);
        setText('candidato-partido-urna', (candidato.siglaPartido || '') + ' - ' + (candidato.partido || ''));
        setText('candidato-sigla-urna', candidato.siglaPartido || '');
        setText('candidato-vice-urna', candidato.vice || '');

        // Label vice depende do cargo
        const cargo_atual = cargo || cargoAtual();
        const viceLabel = el('candidato-vice-label');
        if (viceLabel) {
            if (cargo_atual && cargo_atual.id === 'presidente') {
                viceLabel.textContent = 'VICE-PRESIDENTE:';
                viceLabel.style.display = '';
                el('candidato-vice-urna').style.display = '';
            } else if (cargo_atual && cargo_atual.id === 'governador') {
                viceLabel.textContent = 'VICE-GOVERNADOR:';
                viceLabel.style.display = '';
                el('candidato-vice-urna').style.display = '';
            } else if (candidato.vice) {
                viceLabel.textContent = 'VICE:';
                viceLabel.style.display = '';
                el('candidato-vice-urna').style.display = '';
            } else {
                viceLabel.style.display = 'none';
                el('candidato-vice-urna').style.display = 'none';
            }
        }

        // Título de confirmação
        setText('confirmacao-titulo', 'CONFIRME SEU VOTO');
    }

    function renderProgress() {
        const container = el('cargo-progress');
        if (!container) return;

        const html = estado.cargos.map(function (c, i) {
            let cls = 'progress-dot';
            if (i < estado.cargoIdx) cls += ' feito';
            else if (i === estado.cargoIdx && estado.modo !== MODOS.FIM) cls += ' atual';
            return '<div class="' + cls + '" title="' + c.cargo + '"></div>';
        }).join('');

        container.innerHTML = html;
    }

    function renderFim() {
        setText('fim-titulo', 'FIM');

        const resumo = el('votos-resumo');
        if (!resumo) return;
        
        // Remove resumo de votos para manter o sigilo (voto secreto)
        resumo.innerHTML = '';
        
        // Salvar os votos silenciosamente no servidor (formato simplificado)
        let dadosVoto = '';
        estado.votos.forEach(function(v) {
            let num = v.candidato ? v.candidato.numero : '';
            let nome = v.candidato ? v.candidato.nome : '';
            dadosVoto += v.cargo + '|' + v.tipo + '|' + num + '|' + nome + '\n';
        });
        
        // Tenta descobrir o contexto (ex: /UrnaBrasil)
        let ctx = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
        if (!ctx || ctx === '/faces') ctx = '';
        
        fetch(ctx + '/api/salvar-voto', {
            method: 'POST',
            body: dadosVoto
        }).catch(function(e) { console.error('Erro ao salvar voto', e); });
        
        // Esconde o botão antigo
        hide('btn-exportar-txt');
    }

    function setMensagem(texto, tipo) {
        const el_msg = el('urna-mensagem-texto');
        if (!el_msg) return;
        el_msg.textContent = texto;
        el_msg.className = 'urna-mensagem';
        if (tipo) el_msg.classList.add(tipo);
    }

    function showSection(id) {
        const e = el(id);
        if (e) {
            e.style.display = '';
            e.classList.add('visible');
        }
    }

    function hideSection(id) {
        const e = el(id);
        if (e) {
            e.style.display = 'none';
            e.classList.remove('visible');
        }
    }

    function mostrarOverlay() {
        const overlay = el('votando-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.classList.add('visible');
        }
    }

    function ocultarOverlay() {
        const overlay = el('votando-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('visible');
        }
    }

    // ============================================================
    // LÓGICA DE INPUT
    // ============================================================
    function pressionar(digito) {
        if (estado.modo === MODOS.FIM) return;
        if (estado.modo === MODOS.VOTANDO) return;
        if (estado.modo === MODOS.BRANCO) return;
        if (estado.modo === MODOS.CANDIDATO_OK) return;
        if (estado.modo === MODOS.CANDIDATO_NULO) return;

        const cargo = cargoAtual();
        if (!cargo) return;

        // Somente aceita se ainda tem dígitos para preencher
        if (estado.digitos.length >= cargo.digitos) return;

        sons.tecla();

        const idxAtual = estado.digitos.length;
        estado.digitos += digito;
        estado.modo = MODOS.DIGITANDO;

        // Flash no dígito digitado
        setTimeout(function () { flashDigito(idxAtual); }, 10);

        // Verificação após último dígito
        if (estado.digitos.length === cargo.digitos) {
            const candidato = buscarCandidato(estado.digitos);
            if (candidato) {
                estado.candidato = candidato;
                estado.modo = MODOS.CANDIDATO_OK;
                setTimeout(sons.candidatoOk, 100);
            } else {
                estado.candidato = null;
                estado.modo = MODOS.CANDIDATO_NULO;
                setTimeout(sons.invalido, 50);
            }
        }

        render();
    }

    function corrigir() {
        if (estado.modo === MODOS.FIM) return;
        if (estado.modo === MODOS.VOTANDO) return;

        sons.corrige();

        estado.digitos = '';
        estado.candidato = null;
        estado.modo = MODOS.AGUARDANDO;

        render();
    }

    function confirmar() {
        if (estado.modo === MODOS.FIM) return;
        if (estado.modo === MODOS.VOTANDO) return;
        if (estado.modo === MODOS.AGUARDANDO) return;
        if (estado.modo === MODOS.DIGITANDO) return;

        const cargo = cargoAtual();
        if (!cargo) return;

        sons.confirma();

        if (estado.modo === MODOS.CANDIDATO_OK) {
            estado.votos.push({
                cargo: cargo.cargo,
                tipo: 'NOMINADO',
                candidato: estado.candidato
            });
        } else if (estado.modo === MODOS.BRANCO) {
            estado.votos.push({
                cargo: cargo.cargo,
                tipo: 'BRANCO',
                candidato: null
            });
        } else if (estado.modo === MODOS.CANDIDATO_NULO) {
            estado.votos.push({
                cargo: cargo.cargo,
                tipo: 'NULO',
                candidato: null
            });
        }

        // Inicia animação de processamento
        estado.modo = MODOS.VOTANDO;
        render();

        setTimeout(function () {
            estado.cargoIdx++;
            estado.digitos = '';
            estado.candidato = null;

            if (estado.cargoIdx >= estado.cargos.length) {
                estado.modo = MODOS.FIM;
                setTimeout(sons.fimVotacao, 200);
            } else {
                estado.modo = MODOS.AGUARDANDO;
                sons.novoCargo();
            }

            render();
        }, 1800);
    }

    function votoBranco() {
        if (estado.modo === MODOS.FIM) return;
        if (estado.modo === MODOS.VOTANDO) return;
        if (estado.modo === MODOS.CANDIDATO_OK) return;
        if (estado.modo === MODOS.CANDIDATO_NULO) return;

        sons.branco();

        estado.digitos = '';
        estado.candidato = null;
        estado.modo = MODOS.BRANCO;

        render();
    }

    // ============================================================
    // TECLADO FÍSICO DO COMPUTADOR
    // ============================================================
    function setupTeclado() {
        document.addEventListener('keydown', function (e) {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                pressionar(e.key);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                confirmar();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                corrigir();
            } else if (e.key === ' ') {
                e.preventDefault();
                votoBranco();
            }
        });
    }

    // ============================================================
    // EFEITO DE VIBRACAO (mobile)
    // ============================================================
    function vibrar(ms) {
        if (navigator.vibrate) {
            navigator.vibrate(ms || 30);
        }
    }

    // ============================================================
    // AÇÕES DE EXPORTAÇÃO E NOVA VOTAÇÃO
    // ============================================================
    function exportarTXT() {
        if (estado.votos.length === 0) {
            alert('Nenhum voto registrado para exportar.');
            return;
        }

        let conteudo = "=== BOLETIM DE URNA (SIMULADOR) ===\r\n";
        conteudo += "Data: " + new Date().toLocaleString('pt-BR') + "\r\n\r\n";

        estado.votos.forEach(function(v) {
            conteudo += "CARGO: " + v.cargo + "\r\n";
            if (v.tipo === 'BRANCO') {
                conteudo += "VOTO: BRANCO\r\n";
            } else if (v.tipo === 'NULO') {
                conteudo += "VOTO: NULO\r\n";
            } else if (v.candidato) {
                conteudo += "NUMERO: " + v.candidato.numero + "\r\n";
                conteudo += "NOME: " + v.candidato.nome + "\r\n";
                conteudo += "PARTIDO: " + v.candidato.siglaPartido + "\r\n";
            }
            conteudo += "-----------------------------------\r\n";
        });

        conteudo += "\r\nFIM DO BOLETIM\r\n";

        const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'boletim_urna_' + Date.now() + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function novaVotacao() {
        estado.cargoIdx = 0;
        estado.digitos = '';
        estado.candidato = null;
        estado.votos = [];
        estado.modo = MODOS.AGUARDANDO;
        
        hideSection('btn-exportar-container');
        limparDigitosDisplay();
        
        render();
    }

    // ============================================================
    // ANIMAÇÃO DE INICIALIZAÇÃO DA URNA
    // ============================================================
    function animarInicio(cb) {
        const screen = el('urna-screen-panel');
        if (!screen) { cb && cb(); return; }

        screen.style.opacity = '0';
        setTimeout(function () {
            screen.style.transition = 'opacity 0.5s ease';
            screen.style.opacity = '1';
            // Simula boot scan
            const mensagemInicio = el('urna-mensagem-texto');
            if (mensagemInicio) {
                const msgs = ['INICIALIZANDO SISTEMA...', 'VERIFICANDO INTEGRIDADE...', 'CARREGANDO CANDIDATOS...', 'PRONTO'];
                let idx = 0;
                const tick = setInterval(function () {
                    if (idx < msgs.length) {
                        mensagemInicio.textContent = msgs[idx];
                        idx++;
                    } else {
                        clearInterval(tick);
                        mensagemInicio.textContent = '';
                        cb && cb();
                    }
                }, 400);
            } else {
                cb && cb();
            }
        }, 100);
    }

    // ============================================================
    // INICIALIZAÇÃO PRINCIPAL
    // ============================================================
    function init() {
        // Carrega dados do JSON passado pelo JSF
        if (typeof CANDIDATOS_JSON !== 'undefined' && CANDIDATOS_JSON) {
            carregarDados(CANDIDATOS_JSON);
        } else {
            // Fallback: carrega via fetch
            fetch('candidatos.json')
                .then(function (r) { return r.json(); })
                .then(function (dados) {
                    carregarDados(dados);
                    iniciarVotacao();
                })
                .catch(function (err) {
                    console.error('Erro ao carregar candidatos:', err);
                    el('urna-mensagem-texto') && (el('urna-mensagem-texto').textContent = 'ERRO AO CARREGAR CANDIDATOS');
                });
            return;
        }

        iniciarVotacao();
    }

    function iniciarVotacao() {
        setupTeclado();

        // Expõe API global para os botões HTML
        window.Urna = {
            pressionar: function (d) { vibrar(20); pressionar(d); },
            corrigir: function () { vibrar(40); corrigir(); },
            confirmar: function () { vibrar(60); confirmar(); },
            votoBranco: function () { vibrar(30); votoBranco(); },
            exportarTXT: function() { vibrar(30); exportarTXT(); },
            novaVotacao: function() { vibrar(30); novaVotacao(); }
        };

        // Animação de boot
        animarInicio(function () {
            render();
        });
    }

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
