// index.js
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 📂 USERS DATA
let users = {};
if (fs.existsSync("users.json")) {
  users = JSON.parse(fs.readFileSync("users.json"));
}

// 🛒 SHOP ITEMS
const shop = [
  { id: 1, name: "bamboo-seed", cost: 30 },
  { id: 2, name: "mushroom-seed", cost: 60 },
  { id: 3, name: "venus-fly-trap-seed", cost: 250 },
  { id: 4, name: "pomegranate-seed", cost: 300 },
  { id: 5, name: "poison-apple-seed", cost: 400 },
  { id: 6, name: "venom-spitter-seed", cost: 450 },
  { id: 7, name: "moon-bloom-seed", cost: 600 },
  { id: 8, name: "dragons-breath-seed", cost: 800 },
  { id: 9, name: "super-watering-can", cost: 300 },
  { id: 10, name: "super-sprinkler", cost: 350 },
  { id: 11, name: "golden-dragonfly", cost: 300 },
  { id: 12, name: "unicorn", cost: 400 },
  { id: 13, name: "raccoon", cost: 2000 }
];

// XP -> LEVEL
function getLevel(xp) {
  return Math.floor(xp / 50);
}

// 💾 Save function
function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const id = message.author.id;

  if (!users[id]) {
    users[id] = {
      xp: 0,
      tokens: 0,
      inventory: [],
      level: 0,
      name: message.author.username,
    };
    saveUsers();
    message.channel.send(
      `👋 Сайн уу ${message.author.username}! Та Level 0, Tokens 0‑оос эхэлж байна.`
    );
  }

  const oldLevel = getLevel(users[id].xp);

  // 📈 XP нэмэх
  users[id].xp += (Math.floor(Math.random() * 3) + 1) * 2;

  // 🪙 Tokens нэмэх
  users[id].tokens += Math.random() < 0.05 ? 1 : 0;

  const newLevel = getLevel(users[id].xp);
  users[id].level = newLevel;

  if (newLevel > oldLevel) {
    message.channel.send(
      `🎉 ${message.author} leveled up!\n📊 Level: ${newLevel}`
    );
  }

  // 📊 Rank
  if (message.content === "drank") {
    return message.reply(
      `📊 Level: ${newLevel} | XP: ${users[id].xp} | 🪙 Tokens: ${users[id].tokens}`
    );
  }

  // 🛒 Shop
  if (message.content === "dshop") {
    let text = "🛒 SHOP ITEMS:\n";
    shop.forEach(item => {
      text += `${item.id}. ${item.name} - ${item.cost} tokens\n`;
    });
    text += "\nUse: dbuy <id>";
    return message.reply(text);
  }

  // 🛒 Buy
  if (message.content.startsWith("dbuy")) {
    const itemId = parseInt(message.content.split(" ")[1]);
    const item = shop.find(i => i.id === itemId);

    if (!item) return message.reply("❌ Item not found!");
    if (users[id].tokens < item.cost) {
      return message.reply("❌ Not enough tokens!");
    }

    users[id].tokens -= item.cost;
    users[id].inventory.push(item.name);
    saveUsers();

    return message.reply(
      `✅ You bought: ${item.name}\n🎉 Манай дэлгүүрээр үйлчлүүлсэнд баярлалаа!`
    );
  }

  // 📦 Inventory
  if (message.content === "dinv") {
    return message.reply(
      `📦 Inventory: ${users[id].inventory.join(", ") || "Empty"}`
    );
  }

  // 🏆 Leaderboard
  if (message.content === "dleaderboard") {
    const sorted = Object.values(users).sort((a, b) => {
      if (b.level === a.level) {
        return b.xp - a.xp;
      }
      return b.level - a.level;
    });

    let text = "🏆 LEADERBOARD 🏆\n";
    sorted.slice(0, 10).forEach((u, i) => {
      text += `${i + 1}. ${u.name} — Level ${u.level}, XP ${u.xp}, Tokens ${u.tokens}\n`;
    });

    return message.channel.send(text);
  }

  // 🪙 Give Tokens
  if (message.content.startsWith("dgive")) {
    const parts = message.content.split(" ");
    const mention = message.mentions.users.first();
    const amount = parseInt(parts[2]);

    if (!mention) return message.reply("❌ Хэнд өгөхөө @user гэж зааж өг!");
    if (isNaN(amount)) return message.reply("❌ Токены тоо буруу байна!");

    const targetId = mention.id;

    if (users[id].tokens < amount) {
      return message.reply("❌ Танд хангалттай токен алга!");
    }

    users[id].tokens -= amount;

    if (!users[targetId]) {
      users[targetId] = {
        xp: 0,
        tokens: 0,
        inventory: [],
        level: 0,
        name: mention.username,
      };
    }

    users[targetId].tokens += amount;
    saveUsers();

    return message.reply(
      `✅ Та ${mention.username}-д ${amount} токен өглөө! 🎉 Таны үлдэгдэл: ${users[id].tokens}`
    );
  }

  // 🪙 Admin Self Token
  if (message.content.startsWith("dadmin")) {
    const parts = message.content.split(" ");
    const amount = parseInt(parts[1]);

    const adminId = "1154690693202194492"; // Чиний ID

    if (message.author.id !== adminId) {
      return message.reply("❌ Энэ команд зөвхөн админд зориулагдсан!");
    }

    if (isNaN(amount)) return message.reply("❌ Токены тоо буруу байна!");

    users[adminId].tokens += amount;
    saveUsers();

    return message.reply(`✅ Админ өөртөө ${amount} токен авлаа! 🎉 Одоо үлдэгдэл: ${users[adminId].tokens}`);
  }

  // 🆘 Help
  if (message.content === "dhelp") {
    let text = "📖 AVAILABLE COMMANDS:\n";
    text += "• drank - Show your Level, XP, Tokens\n";
    text += "• dshop - View shop items\n";
    text += "• dbuy <id> - Buy item by ID\n";
    text += "• dinv - Show your inventory\n";
    text += "• dleaderboard - Show top players\n";
    text += "• dgive @user <amount> - Give tokens to a user\n";
    text += "• dadmin <amount> - Admin add tokens\n";
    text += "• dhelp - Show this help menu\n";

    return message.reply(text);
  }

  saveUsers();
});

// ⚡ Ready
client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN)
  .then(() => console.log("LOGIN OK"))
  .catch(err => console.log("LOGIN ERROR:", err));
