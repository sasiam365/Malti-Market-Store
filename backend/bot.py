"""
TeleStore Telegram Bot Runner
Powered by python-telegram-bot
"""

import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, CallbackQueryHandler

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get Bot Token from environment variable
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    welcome_text = (
        f"👋 Welcome to *Malti Market Store*, {user.first_name}!\n\n"
        "🛍️ India & Global's #1 Trusted Digital Product Store.\n"
        "✨ Instant delivery for OTT, AI, Gaming, VPN & More!\n\n"
        "💰 Wallet Balance: ₹0.00\n"
        "🔗 Your Referral Link: `https://t.me/Malti_Market_Store_Bot?start=ref_{user.id}`\n\n"
        "Please select an option below:"
    )
    
    keyboard = [
        [InlineKeyboardButton("🛍️ Browse Products", callback_data="shop_categories")],
        [InlineKeyboardButton("💰 My Wallet & Deposit", callback_data="user_wallet"),
         InlineKeyboardButton("👥 Referrals", callback_data="user_referrals")],
        [InlineKeyboardButton("📦 My Orders", callback_data="user_orders"),
         InlineKeyboardButton("🎧 Support Desk", callback_data="user_support")],
        [InlineKeyboardButton("🌐 Open Web Admin / Store", url="https://ais-dev-jvravq2e2cu2zfksl45kgp-642952843899.asia-southeast1.run.app")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.message:
        await update.message.reply_text(welcome_text, parse_mode="Markdown", reply_markup=reply_markup)
    elif update.callback_query:
        await update.callback_query.message.edit_text(welcome_text, parse_mode="Markdown", reply_markup=reply_markup)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "🤖 *Malti Market Store Help Center*\n\n"
        "• */start* - Open main menu & profile\n"
        "• */shop* - Browse digital products\n"
        "• */wallet* - Check balance & deposit funds\n"
        "• */orders* - View active purchases & keys\n"
        "• */support* - Contact 24/7 admin support\n\n"
        "Need help? Contact @Admin"
    )
    await update.message.reply_text(help_text, parse_mode="Markdown")

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data
    if data == "shop_categories":
        keyboard = [
            [InlineKeyboardButton("📺 Streaming (Zee5, SonyLIV, Netflix)", callback_data="cat_streaming")],
            [InlineKeyboardButton("🤖 AI & ChatGPT Plus", callback_data="cat_ai")],
            [InlineKeyboardButton("⭐ YouTube & Telegram Premium", callback_data="cat_premium")],
            [InlineKeyboardButton("🔙 Back to Main Menu", callback_data="main_menu")]
        ]
        await query.message.edit_text(
            "📂 *Select Product Category:*",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    elif data == "main_menu":
        await start(update, context)
    elif data == "user_wallet":
        text = (
            "💰 *Your Wallet*\n\n"
            "Balance: ₹0.00\n"
            "To deposit funds via bKash, Nagad, USDT or UPI, please use our web dashboard or send payment screenshot to support."
        )
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="main_menu")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == "user_referrals":
        user = update.effective_user
        text = (
            "👥 *Referral Program*\n\n"
            "Earn 5% commission on every friend's deposit!\n"
            f"Your Link: `https://t.me/Malti_Market_Store_Bot?start=ref_{user.id}`\n"
            "Total Referrals: 0\n"
            "Total Earned: ₹0.00"
        )
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="main_menu")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == "user_orders":
        text = "📦 *Your Orders*\n\nYou have no active orders yet."
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="main_menu")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == "user_support":
        text = "🎧 *Support Desk*\n\nPlease message our admin @Admin with your order ID for instant assistance."
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="main_menu")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data.startswith("cat_"):
        cat_name = data.replace("cat_", "").upper()
        text = f"📦 *{cat_name} Products*\n\n1. Netflix 1 Month - ₹149\n2. YouTube Premium 1 Month - ₹80\n3. ChatGPT Plus 1 Month - ₹499"
        keyboard = [
            [InlineKeyboardButton("🛒 Buy Now", callback_data="buy_demo")],
            [InlineKeyboardButton("🔙 Back", callback_data="shop_categories")]
        ]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == "buy_demo":
        text = "⚠️ *Insufficient Balance*\nPlease deposit funds into your wallet to complete purchase."
        keyboard = [[InlineKeyboardButton("🔙 Back", callback_data="shop_categories")]]
        await query.message.edit_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))

def main():
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE" or not BOT_TOKEN:
        print("ERROR: Please set TELEGRAM_BOT_TOKEN environment variable!")
        return

    application = ApplicationBuilder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CallbackQueryHandler(button_handler))

    print("🤖 Telegram Bot is polling for updates...")
    application.run_polling()

if __name__ == '__main__':
    main()
