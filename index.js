const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => { qrcode.generate(qr, { small: true }); });
client.on('ready', () => { console.log('පාසල් රිය නියාමක Bot සූදානම්!'); });

// --- ඔබගේ Group ID එක මෙතැනට ඇතුළත් කරන්න ---
const targetGroupId = 'YOUR_GROUP_ID_HERE@g.us'; 

// --- රාජකාරි දත්ත (පණිවිඩය යවන දිනයට අදාළව) ---
const dutyRoster = {
    boys: { // 1 වන සතිය (Boys Week)
        0: "🔹 කවින් - 9C\n🔹 කුල්මෙත් - 9E\n🔹 දහම් - 9E\n🔹 සමොද් - 9C\n🔹 ලසිත් - 9C", // ඉරිදා යවයි (සඳුදා වැඩට)
        1: "🔹 බිනර - 9E\n🔹 මුදිත - 9E\n🔹 නෙහාන් - 9E\n🔹 පුමුදිත - 9D\n🔹 සන්සිලු - 9C\n🔹 පබසර - 9B", // සඳුදා යවයි (අඟහරුවාදා වැඩට)
        3: "🔹 රන්දුනු - 9C\n🔹 නෙත්සර - 9C\n🔹 නිසල් - 9C\n🔹 අනුහස් - 9C\n🔹 කුලුනු - 9C", // බදාදා යවයි (බ්‍රහස්පතින්දා වැඩට)
        4: "🔹 D.V.G.O.ලංකාන්\n🔹 M.A.S.N.තිලකසිරි\n🔹 J.V.N.තිසංස\n🔹 K.A.S.මින්සර\n🔹 H.M.දිනුත්තර" // බ්‍රහස්පතින්දා යවයි (සිකුරාදා වැඩට)
    },
    girls: { // 2 වන සතිය (Girls Week)
        0: "🔹 විහංගි - 9D\n🔹 මහීෂා - 9E\n🔹 දශිදි - 9E\n🔹 තමාදි - 9E\n🔹 ඉනුකි - 9E", // ඉරිදා -> සඳුදා
        1: "🔹 විෂ්මි - 9D\n🔹 සනුති - 9E\n🔹 ජනුමි - 9E\n🔹 හිරුණි - 9D\n🔹 ටිරුණි - 9D", // සඳුදා -> අඟහරුවාදා
        3: "🔹 සඳලි - 9A\n🔹 ඉදුවරි - 9A\n🔹 උදේශිකා - 9D\n🔹 සුදිනි - 9D\n🔹 ගිත්මි - 9E", // බදාදා -> බ්‍රහස්පතින්දා
        4: "🔹 සඳකිනි - 9E\n🔹 එනේදි - 9E\n🔹 සමිත්මා - 9D\n🔹 බුද්ධිනි - 9D" // බ්‍රහස්පතින්දා -> සිකුරාදා
    }
};

// 1. සෑම දිනකම සවස 6:00 ට පණිවිඩය යැවීම සහ Group Unlock කිරීම
cron.schedule('0 18 * * *', async () => {
    const today = new Date();
    const dayOfToday = today.getDay(); // 0=ඉරිදා, 1=සඳුදා, 3=බදාදා, 4=බ්‍රහස්පතින්දා
    
    // සති අංකය ගණනය කිරීම
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - startOfYear) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    
    const isBoysWeek = weekNum % 2 !== 0; 
    const currentWeekType = isBoysWeek ? 'boys' : 'girls';
    const weekTitle = isBoysWeek ? "පළමු සතිය (Boys Week)" : "දෙවන සතිය (Girls Week)";
    
    const students = dutyRoster[currentWeekType][dayOfToday];

    if (students && targetGroupId !== 'YOUR_GROUP_ID_HERE@g.us') {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        const dayNames = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
        const nextDayName = dayNames[nextDay.getDay()];
        const nextDayDate = nextDay.toLocaleDateString('si-LK');

        // ගෲප් එක Unlock කිරීම (සියලු දෙනාට පණිවිඩ යැවිය හැක)
        const chat = await client.getChatById(targetGroupId);
        await chat.setMessagesAdminsOnly(false);
        
        const message = `📢 *පාසල් රිය නියාමක නිලධාරී දැනුම්දීමයි!*\n\n🗓️ *හෙට දින රාජකාරි දිනය:* ${nextDayDate} (${nextDayName})\n🚩 *වාරය:* ${weekTitle}\n\n*හෙට දින වාර්තා කළ යුතු සිසුන්:*\n${students}\n\n✅ දැන් ගෲප් එක සාමාජිකයින් සඳහා විවෘතයි (රාත්‍රී 10:00 දක්වා). ස්තුතියි! 🇱🇰`;
        
        await client.sendMessage(targetGroupId, message);
        console.log(`Unlocked and sent for ${nextDayName}`);
    }
});

// 2. සෑම දිනකම රාත්‍රී 10:00 ට Group එක Lock කිරීම
cron.schedule('0 22 * * *', async () => {
    if (targetGroupId !== 'YOUR_GROUP_ID_HERE@g.us') {
        const chat = await client.getChatById(targetGroupId);
        await chat.setMessagesAdminsOnly(true);
        await client.sendMessage(targetGroupId, '🚫 රාත්‍රී කාලය බැවින් සාමාජිකයින්ට පණිවිඩ යැවීම තාවකාලිකව අත්හිටුවා ඇත. ස්තුතියි!');
        console.log('Group Locked');
    }
});

client.initialize();