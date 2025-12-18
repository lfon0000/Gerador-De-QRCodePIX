// Configuracoes do PIX
const CONFIG = {
    chavePix: '11049570000192',
    beneficiario: 'Madmras Ferragens Ltda',
    cidade: 'SAO PAULO'
};

// Elementos do DOM - Telas
const telaInicial = document.getElementById('tela-inicial');
const telaValor = document.getElementById('tela-valor');
const telaResultado = document.getElementById('tela-resultado');

// Elementos do DOM - Botoes navegacao
const btnNovaVenda = document.getElementById('btn-nova-venda');
const btnVoltarInicial = document.getElementById('btn-voltar-inicial');
const btnNovaVendaResultado = document.getElementById('btn-nova-venda-resultado');
const btnVoltarInicio = document.getElementById('btn-voltar-inicio');

// Elementos do DOM - Funcionalidade
const valorInput = document.getElementById('valor');
const btnGerar = document.getElementById('btn-gerar');
const qrcodeCanvas = document.getElementById('qrcode-canvas');
const valorDisplay = document.getElementById('valor-display');
const codigoPix = document.getElementById('codigo-pix');
const btnCopiar = document.getElementById('btn-copiar');
const btnEnviarImagem = document.getElementById('btn-enviar-imagem');
const btnEnviarCodigo = document.getElementById('btn-enviar-codigo');
const btnEnviarInstrucoes = document.getElementById('btn-enviar-instrucoes');
const toast = document.getElementById('toast');

// Variavel para armazenar o valor atual
let valorAtual = 0;

// Carregar logo para usar no QR Code
const logoImg = new Image();
logoImg.src = 'logo-madmraz5.png';
let logoCarregado = false;
logoImg.onload = () => {
    logoCarregado = true;
};

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Erro ao registrar SW:', err));
    });
}

// ==================== NAVEGACAO ====================

function mostrarTela(tela) {
    telaInicial.classList.remove('active');
    telaValor.classList.remove('active');
    telaResultado.classList.remove('active');
    tela.classList.add('active');
    window.scrollTo(0, 0);
}

btnNovaVenda.addEventListener('click', () => {
    valorInput.value = '';
    mostrarTela(telaValor);
    setTimeout(() => valorInput.focus(), 100);
});

btnVoltarInicial.addEventListener('click', () => {
    mostrarTela(telaInicial);
});

btnNovaVendaResultado.addEventListener('click', () => {
    valorInput.value = '';
    mostrarTela(telaValor);
    setTimeout(() => valorInput.focus(), 100);
});

btnVoltarInicio.addEventListener('click', () => {
    mostrarTela(telaInicial);
});

// ==================== INPUT DE VALOR ====================

valorInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 0) {
        e.target.value = '';
        return;
    }
    value = (parseInt(value) / 100).toFixed(2);
    e.target.value = value.replace('.', ',');
});

valorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        gerarPix();
    }
});

// Scroll para manter input visivel quando teclado abre
valorInput.addEventListener('focus', () => {
    setTimeout(() => {
        valorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
});

// ==================== GERACAO DO PIX ====================

btnGerar.addEventListener('click', gerarPix);

function gerarPix() {
    valorInput.blur();

    const valorStr = valorInput.value.replace(',', '.');
    const valor = parseFloat(valorStr);

    if (isNaN(valor) || valor <= 0) {
        mostrarToast('Digite um valor valido');
        return;
    }

    valorAtual = valor;
    const codigoPIX = gerarCodigoPix(valor);

    // Usar nivel de correcao alto (H = 30%) para permitir logo no centro
    QRCode.toCanvas(qrcodeCanvas, codigoPIX, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#c62828',
            light: '#ffffff'
        }
    }, (error) => {
        if (error) {
            console.error(error);
            mostrarToast('Erro ao gerar QR Code');
            return;
        }

        // Adicionar logo no centro do QR Code
        if (logoCarregado) {
            const ctx = qrcodeCanvas.getContext('2d');
            const canvasSize = qrcodeCanvas.width;
            const logoSize = canvasSize * 0.22;
            const logoX = (canvasSize - logoSize) / 2;
            const logoY = (canvasSize - logoSize) / 2;

            // Fundo branco arredondado para o logo
            const padding = 8;
            const radius = 12;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2, radius);
            ctx.fill();

            // Desenhar logo
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        }

        valorDisplay.textContent = formatarMoeda(valor);
        document.getElementById('codigo-pix').value = codigoPIX;
        mostrarTela(telaResultado);
    });
}

function gerarCodigoPix(valor) {
    const valorFormatado = valor.toFixed(2);
    let payload = '';

    payload += montarCampo('00', '01');
    payload += montarCampo('01', '12');

    let merchantAccount = '';
    merchantAccount += montarCampo('00', 'br.gov.bcb.pix');
    merchantAccount += montarCampo('01', CONFIG.chavePix);
    payload += montarCampo('26', merchantAccount);

    payload += montarCampo('52', '0000');
    payload += montarCampo('53', '986');
    payload += montarCampo('54', valorFormatado);
    payload += montarCampo('58', 'BR');

    const nome = removerAcentos(CONFIG.beneficiario).substring(0, 25);
    payload += montarCampo('59', nome);

    const cidade = removerAcentos(CONFIG.cidade).substring(0, 15);
    payload += montarCampo('60', cidade);

    let additionalData = '';
    additionalData += montarCampo('05', '***');
    payload += montarCampo('62', additionalData);

    payload += '6304';
    const crc = calcularCRC16(payload);
    payload += crc;

    return payload;
}

function montarCampo(id, valor) {
    const tamanho = valor.length.toString().padStart(2, '0');
    return id + tamanho + valor;
}

function calcularCRC16(payload) {
    const polinomio = 0x1021;
    let resultado = 0xFFFF;

    for (let i = 0; i < payload.length; i++) {
        resultado ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((resultado & 0x8000) !== 0) {
                resultado = ((resultado << 1) ^ polinomio) & 0xFFFF;
            } else {
                resultado = (resultado << 1) & 0xFFFF;
            }
        }
    }

    return resultado.toString(16).toUpperCase().padStart(4, '0');
}

function removerAcentos(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .toUpperCase();
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// ==================== COPIAR CODIGO ====================

btnCopiar.addEventListener('click', async () => {
    const codigo = document.getElementById('codigo-pix').value;

    try {
        await navigator.clipboard.writeText(codigo);
        mostrarToast('Codigo copiado!');
    } catch (err) {
        document.getElementById('codigo-pix').select();
        document.execCommand('copy');
        mostrarToast('Codigo copiado!');
    }
});

// ==================== COMPARTILHAMENTO ====================

// Botao 1: Enviar imagem do QR Code
btnEnviarImagem.addEventListener('click', async () => {
    if (navigator.share && navigator.canShare) {
        try {
            const blob = await new Promise(resolve => {
                qrcodeCanvas.toBlob(resolve, 'image/png');
            });

            const file = new File([blob], 'qrcode-pix-madmras.png', { type: 'image/png' });
            const shareData = { files: [file] };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return;
            }
        } catch (err) {
            console.log('Erro ao compartilhar imagem:', err);
        }
    }

    mostrarToast('Compartilhamento nao disponivel');
});

// Botao 2: Enviar codigo copia e cola (apenas o codigo)
btnEnviarCodigo.addEventListener('click', async () => {
    const codigo = document.getElementById('codigo-pix').value;

    if (navigator.share) {
        try {
            await navigator.share({
                text: codigo
            });
            return;
        } catch (err) {
            console.log('Erro ao compartilhar:', err);
        }
    }

    // Fallback WhatsApp
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(codigo)}`;
    window.open(urlWhatsApp, '_blank');
});

// Botao 3: Enviar instrucoes de pagamento (sem codigo)
btnEnviarInstrucoes.addEventListener('click', async () => {
    const valor = valorDisplay.textContent;

    const mensagem = `*MADMRAS FERRAGENS*\n` +
        `*Pagamento via PIX*\n\n` +
        `Valor: *${valor}*\n\n` +
        `Para pagar:\n` +
        `1. Abra o app do seu banco\n` +
        `2. Escolha pagar com PIX\n` +
        `3. Escaneie o QR Code ou use o codigo copia e cola\n\n` +
        `Agradecemos a preferencia!\n` +
        `_Madmras Ferragens - No seu sonho, no seu lar!_`;

    if (navigator.share) {
        try {
            await navigator.share({
                text: mensagem
            });
            return;
        } catch (err) {
            console.log('Erro ao compartilhar:', err);
        }
    }

    // Fallback WhatsApp
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
});

// ==================== UTILIDADES ====================

function mostrarToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}
