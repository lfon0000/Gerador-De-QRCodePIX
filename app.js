// Configuracoes do PIX
const CONFIG = {
    chavePix: '11049570000192',
    beneficiario: 'Madmras Ferragens Ltda',
    cidade: 'SAO PAULO'
};

// Elementos do DOM
const valorInput = document.getElementById('valor');
const btnGerar = document.getElementById('btn-gerar');
const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeCanvas = document.getElementById('qrcode-canvas');
const valorDisplay = document.getElementById('valor-display');
const codigoPix = document.getElementById('codigo-pix');
const btnCopiar = document.getElementById('btn-copiar');
const btnCompartilhar = document.getElementById('btn-compartilhar');
const toast = document.getElementById('toast');

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Erro ao registrar SW:', err));
    });
}

// Formatacao de valor monetario no input
valorInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length === 0) {
        e.target.value = '';
        return;
    }
    value = (parseInt(value) / 100).toFixed(2);
    e.target.value = value.replace('.', ',');
});

// Gerar PIX ao clicar no botao
btnGerar.addEventListener('click', gerarPix);

// Copiar codigo
btnCopiar.addEventListener('click', copiarCodigo);

// Compartilhar via WhatsApp
btnCompartilhar.addEventListener('click', compartilharWhatsApp);

function gerarPix() {
    const valorStr = valorInput.value.replace(',', '.');
    const valor = parseFloat(valorStr);

    if (isNaN(valor) || valor <= 0) {
        mostrarToast('Digite um valor valido');
        return;
    }

    const codigoPIX = gerarCodigoPix(valor);

    // Gerar QR Code
    QRCode.toCanvas(qrcodeCanvas, codigoPIX, {
        width: 280,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, (error) => {
        if (error) {
            console.error(error);
            mostrarToast('Erro ao gerar QR Code');
            return;
        }

        // Mostrar container
        qrcodeContainer.classList.remove('hidden');

        // Atualizar valor exibido
        valorDisplay.textContent = formatarMoeda(valor);

        // Atualizar codigo copia e cola
        document.getElementById('codigo-pix').value = codigoPIX;

        // Scroll para o QR Code
        qrcodeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function gerarCodigoPix(valor) {
    // Formatar valor com 2 casas decimais
    const valorFormatado = valor.toFixed(2);

    // Campos do PIX (padrao EMV)
    let payload = '';

    // 00 - Payload Format Indicator
    payload += montarCampo('00', '01');

    // 01 - Point of Initiation Method (12 = dinamico)
    payload += montarCampo('01', '12');

    // 26 - Merchant Account Information (PIX)
    let merchantAccount = '';
    // GUI do PIX
    merchantAccount += montarCampo('00', 'br.gov.bcb.pix');
    // Chave PIX (CNPJ)
    merchantAccount += montarCampo('01', CONFIG.chavePix);
    payload += montarCampo('26', merchantAccount);

    // 52 - Merchant Category Code (0000 = nao informado)
    payload += montarCampo('52', '0000');

    // 53 - Transaction Currency (986 = BRL)
    payload += montarCampo('53', '986');

    // 54 - Transaction Amount
    payload += montarCampo('54', valorFormatado);

    // 58 - Country Code
    payload += montarCampo('58', 'BR');

    // 59 - Merchant Name (max 25 caracteres)
    const nome = removerAcentos(CONFIG.beneficiario).substring(0, 25);
    payload += montarCampo('59', nome);

    // 60 - Merchant City (max 15 caracteres)
    const cidade = removerAcentos(CONFIG.cidade).substring(0, 15);
    payload += montarCampo('60', cidade);

    // 62 - Additional Data Field (TXID)
    let additionalData = '';
    additionalData += montarCampo('05', '***');
    payload += montarCampo('62', additionalData);

    // 63 - CRC16 (placeholder para calculo)
    payload += '6304';

    // Calcular CRC16
    const crc = calcularCRC16(payload);
    payload += crc;

    return payload;
}

function montarCampo(id, valor) {
    const tamanho = valor.length.toString().padStart(2, '0');
    return id + tamanho + valor;
}

function calcularCRC16(payload) {
    // CRC16-CCITT-FALSE
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

async function copiarCodigo() {
    const codigo = document.getElementById('codigo-pix').value;

    try {
        await navigator.clipboard.writeText(codigo);
        mostrarToast('Codigo copiado!');
    } catch (err) {
        // Fallback para navegadores mais antigos
        document.getElementById('codigo-pix').select();
        document.execCommand('copy');
        mostrarToast('Codigo copiado!');
    }
}

async function compartilharWhatsApp() {
    const codigo = document.getElementById('codigo-pix').value;
    const valor = valorDisplay.textContent;

    const mensagem = `*PIX - Madmras Ferragens*\n\n` +
        `Valor: ${valor}\n` +
        `Beneficiario: ${CONFIG.beneficiario}\n\n` +
        `*Codigo Copia e Cola:*\n${codigo}\n\n` +
        `_Cole o codigo acima no seu app de pagamento PIX_`;

    // Tentar compartilhar com imagem usando Web Share API
    if (navigator.share && navigator.canShare) {
        try {
            // Converter canvas para blob
            const blob = await new Promise(resolve => {
                qrcodeCanvas.toBlob(resolve, 'image/png');
            });

            const file = new File([blob], 'pix-madmras.png', { type: 'image/png' });

            const shareData = {
                title: 'PIX - Madmras Ferragens',
                text: mensagem,
                files: [file]
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                return;
            }
        } catch (err) {
            console.log('Erro ao compartilhar com imagem:', err);
        }
    }

    // Fallback: abrir WhatsApp com mensagem (sem imagem)
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
}

function mostrarToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

// Permitir Enter para gerar
valorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        gerarPix();
    }
});
