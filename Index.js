const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const warningDatabase = {};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('SCAN_QR_CODE_SEKARANG: ' + qr);
});

client.on('ready', () => {
    console.log('Bot WA Jual Beli sudah siap dan aktif!');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    
    if (chat.isGroup) {
        const messageBody = msg.body.toLowerCase();
        const senderId = msg.author || msg.from;

        if (messageBody.includes('://whatsapp.com') || messageBody.includes('wa.me/settings')) {
            
            const groupParticipant = chat.participants.find(p => p.id._serialized === client.info.me._serialized);
            if (!groupParticipant || !groupParticipant.isAdmin) return;

            try { await msg.delete(true); } catch (err) {}

            if (!warningDatabase[senderId]) {
                warningDatabase[senderId] = 1;
            } else {
                warningDatabase[senderId] += 1;
            }

            const currentWarnings = warningDatabase[senderId];

            if (currentWarnings < 3) {
                await chat.sendMessage(`⚠️ *PERINGATAN [${currentWarnings}/3]* ⚠️\n\n@${senderId.split('@')} dilarang mengirim link grup lain di sini! Kirim sekali lagi akan di-kick otomatis.`, {
                    mentions: [senderId]
                });
            } else {
                await chat.sendMessage(`🚫 *KICK AUTOMATION* 🚫\n\n@${senderId.split('@')} telah mencapai batas maksimal 3 kali pelanggaran dan dikeluarkan dari grup.`, {
                    mentions: [senderId]
                });
                
                try {
                    await chat.removeParticipants([senderId]);
                    delete warningDatabase[senderId];
                } catch (error) {}
            }
        }
    }
});

client.initialize();
