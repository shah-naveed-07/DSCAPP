package com.dsc.dscweb.ai

import com.dsc.dscweb.actions.AioraAction
import com.dsc.dscweb.actions.AioraActionExecutor
import com.dsc.dscweb.actions.AioraActionResult
import com.dsc.dscweb.auth.UserSession
import java.util.Locale

data class AioraMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: String, // "user" or "aiora"
    val text: String,
    val actionId: String? = null,
    val isPendingConfirmation: Boolean = false,
    val pendingAction: AioraAction? = null
)

enum class DetectedLanguage {
    ENGLISH,
    HINDI_DEVANAGARI,
    HINGLISH
}

class AioraAssistantEngine(
    private val actionExecutor: AioraActionExecutor
) {
    fun processQuery(
        query: String,
        history: List<AioraMessage> = emptyList(),
        currentRoute: String?,
        session: UserSession?,
        onResponse: (AioraMessage, String?) -> Unit,
        onRequireConfirmation: (AioraAction, String) -> Unit
    ) {
        val q = query.trim()
        if (q.isBlank()) return

        val qLower = q.lowercase(Locale.ROOT)

        // 1. Check if user is explicitly requesting a Navigation or System Action
        val matchedActionId = resolveActionIntent(qLower)

        if (matchedActionId != null) {
            val result = actionExecutor.execute(
                actionId = matchedActionId,
                session = session,
                confirmed = false,
                onRequireConfirmation = onRequireConfirmation
            )

            when (result) {
                is AioraActionResult.Success -> {
                    val speech = result.speechResponse ?: result.message
                    onResponse(
                        AioraMessage(sender = "aiora", text = result.message, actionId = matchedActionId),
                        speech
                    )
                }
                is AioraActionResult.PermissionDenied -> {
                    onResponse(
                        AioraMessage(sender = "aiora", text = result.reason),
                        result.reason
                    )
                }
                is AioraActionResult.RequiresConfirmation -> {
                    val promptText = "Sir, yeh action destructive hai. ${result.prompt}"
                    onResponse(
                        AioraMessage(
                            sender = "aiora",
                            text = promptText,
                            isPendingConfirmation = true,
                            pendingAction = result.action
                        ),
                        promptText
                    )
                }
                is AioraActionResult.Error -> {
                    onResponse(
                        AioraMessage(sender = "aiora", text = result.message),
                        result.message
                    )
                }
            }
            return
        }

        // 2. Detect query language
        val lang = detectLanguage(q, qLower)

        // 3. Generate Conversational Response matching the user's language & intent
        val responseText = generateConversationalResponse(
            query = q,
            qLower = qLower,
            lang = lang,
            history = history,
            currentRoute = currentRoute,
            session = session
        )

        onResponse(
            AioraMessage(sender = "aiora", text = responseText),
            responseText
        )
    }

    private fun detectLanguage(rawQuery: String, qLower: String): DetectedLanguage {
        // Devanagari script check
        if (rawQuery.any { it in '\u0900'..'\u097F' }) {
            return DetectedLanguage.HINDI_DEVANAGARI
        }

        // Hinglish & Roman Hindi markers
        val hinglishMarkers = setOf(
            "kya", "kaun", "kaise", "kahan", "kaha", "konsi", "kaunsi",
            "hai", "hain", "ho", "hoon", "hun", "hu", "main", "tum", "aap",
            "aapka", "tumhara", "mera", "meri", "kar", "karti", "karta", "karni",
            "karo", "rahi", "rahe", "sakti", "sakta", "sakte", "chahiye",
            "samajh", "baare", "batao", "bataen", "dikhao", "dikhaye", "kholo",
            "nahi", "sab", "yeh", "ye", "voh", "woh", "accha", "acha", "thik",
            "dhanyawad", "shukriya", "bhai", "sakty", "karna"
        )

        val words = qLower.split(Regex("[^a-zA-Z0-9]+")).filter { it.isNotBlank() }
        val hinglishMatches = words.count { it in hinglishMarkers }

        if (hinglishMatches > 0) {
            return DetectedLanguage.HINGLISH
        }

        return DetectedLanguage.ENGLISH
    }

    private fun generateConversationalResponse(
        query: String,
        qLower: String,
        lang: DetectedLanguage,
        history: List<AioraMessage>,
        currentRoute: String?,
        session: UserSession?
    ): String {
        val screenCtx = ScreenSemanticRegistry.getContextForRoute(currentRoute)

        // Conversation history context
        val lastUserMsg = history.filter { it.sender == "user" }.lastOrNull()?.text?.lowercase(Locale.ROOT) ?: ""
        val lastAioraMsg = history.filter { it.sender == "aiora" }.lastOrNull()?.text?.lowercase(Locale.ROOT) ?: ""

        // A. Explicit Language Switch Requests
        if (qLower.contains("answer in english") || qLower.contains("speak english") || qLower.contains("english please") || qLower.contains("in english")) {
            return "Sure! I will respond in English now. How can I help you?"
        }
        if (qLower.contains("hindi mein") || qLower.contains("hindi me") || qLower.contains("speak hindi") || qLower.contains("in hindi") || qLower.contains("हिंदी में")) {
            return "जी बिल्कुल! अब मैं हिंदी में बात करूँगी। आप क्या जानना चाहते हैं?"
        }
        if (qLower.contains("hinglish me") || qLower.contains("hinglish mein") || qLower.contains("speak hinglish")) {
            return "Bilkul! Ab se main Hinglish me answer dungi. Batayein kya help chahiye?"
        }

        // B. Simple Math Evaluation (e.g., "what is 25 * 4?", "25 x 4", "100 + 50")
        val mathResult = tryEvaluateMath(qLower)
        if (mathResult != null) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> mathResult
                DetectedLanguage.HINDI_DEVANAGARI -> mathResult
                DetectedLanguage.HINGLISH -> "$mathResult hota hai."
            }
        }

        // C. General Knowledge Trivia (e.g., "capital of France", "capital of India")
        val triviaResult = tryAnswerTrivia(qLower, lang)
        if (triviaResult != null) {
            return triviaResult
        }

        // D. Identity & Name Questions ("what is your name?", "who are you?", "tum kaun ho", "तुम कौन हो")
        if (isIdentityQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "I'm Aiora, an intelligent assistant for the DSC Android app. I can help you navigate the app, check VIP plans, view Free Panel credentials, and manage your account."
                DetectedLanguage.HINDI_DEVANAGARI -> "मैं Aiora हूँ, DSC Android ऐप की इंटेलिजेंट असिस्टेंट! मैं ऐप इस्तेमाल करने, प्लान्स देखने और आपके सवालों के जवाब देने में मदद कर सकती हूँ।"
                DetectedLanguage.HINGLISH -> "Main Aiora hoon, DSC Android app ki intelligent female assistant! Main aapki app navigation, VIP plans, Free Panel credentials aur account guidance me help karti hoon."
            }
        }

        // E. Capabilities & Help Questions ("what can you do?", "how can you help me?", "tum kya kar sakti ho")
        if (isCapabilitiesQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "I can help you use DSC:\n• Navigate app screens (Home, Plans, Free Panel, Downloads, Apps, User/Admin/Owner Portal)\n• Explain VIP subscription plans & pricing\n• Check Free Panel credentials & slot availability\n• Copy license keys & view expiration\n• Guide you through Owner & Admin operations"
                DetectedLanguage.HINDI_DEVANAGARI -> "मैं DSC ऐप में आपकी मदद कर सकती हूँ:\n• ऐप स्क्रीन खोलना (Home, Plans, Free Panel, Downloads, Apps)\n• VIP प्लान्स और कीमतें समझाना\n• Free Panel क्रेडेंशियल्स देना\n• लाइसेंस की कॉपी करना और अकाउंट सेटिंग्स बताना"
                DetectedLanguage.HINGLISH -> "Main aapko DSC use karne me help kar sakti hoon:\n• App screens open karna (Home, Plans, Free Panel, Downloads, Apps, Portals)\n• VIP plans aur prices samjhaana\n• Free Panel credentials aur slot availability dikhana\n• License keys copy karna aur account settings guide karna"
            }
        }

        // F. Activity & Status Queries ("what are you doing?", "क्या कर रही हो?", "kya kar rahi ho")
        if (isActivityQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "I'm here, active and ready to help you with DSC!"
                DetectedLanguage.HINDI_DEVANAGARI -> "मैं तैयार हूँ और आपकी मदद करने के लिए एक्टिव हूँ!"
                DetectedLanguage.HINGLISH -> "Main bilkul active hoon aur DSC app me aapki help karne ke liye ready hoon! Aap batayein, kya karna hai?"
            }
        }

        // G. Greetings & Well-being ("hello", "hi", "namaste", "how are you", "kaise ho")
        if (isGreetingQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "Hello! I'm doing great and ready to assist you. How can I help you today?"
                DetectedLanguage.HINDI_DEVANAGARI -> "नमस्ते! मैं बिल्कुल ठीक हूँ और आपकी मदद के लिए तैयार हूँ। आज मैं आपकी क्या मदद करूँ?"
                DetectedLanguage.HINGLISH -> "Hello sir! Main Aiora hoon, bilkul badhiya. Aap batayein, aaj main aapki kya madad kar sakti hoon?"
            }
        }

        // H. Acknowledgements & Gratitude ("thanks", "thank you", "dhanyawad", "okay", "thik hai")
        if (isAcknowledgementQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "You're very welcome! Let me know if you need anything else."
                DetectedLanguage.HINDI_DEVANAGARI -> "आपका स्वागत है! अगर आपको कुछ और पूछना है, तो ज़रूर बताएं।"
                DetectedLanguage.HINGLISH -> "Most welcome sir! Main hamesha aapki help ke liye yahan hoon. Koi aur sawaal ho to zaroor batayein!"
            }
        }

        // I. Follow-up / Ambiguous pronoun Queries ("isme kya hai", "what is this", "explain this", "price kya hai")
        if (isFollowUpQuery(qLower)) {
            val isProductContext = lastUserMsg.contains("plan") || lastAioraMsg.contains("plan") || currentRoute == "products"
            val isFreeContext = lastUserMsg.contains("free") || lastAioraMsg.contains("free") || currentRoute == "free_panel"

            return when (lang) {
                DetectedLanguage.ENGLISH -> {
                    if (isProductContext) {
                        "This is the Subscriptions & Plans screen. Available VIP plans include STREAMER-PANEL ($10), SPECIAL-PANEL ($3), SNIPER-PANEL ($1), AIM-ASSIST-PANEL ($1), PREMIUM-PANEL ($5), and CUSTOMISED-PANEL ($10)."
                    } else if (isFreeContext) {
                        "This is the Free Panel screen providing daily shared credentials and real-time slot availability."
                    } else {
                        "You are currently on ${screenCtx.title}. ${screenCtx.description}"
                    }
                }
                DetectedLanguage.HINDI_DEVANAGARI -> {
                    if (isProductContext) {
                        "यह Subscriptions & Plans स्क्रीन है। यहाँ आप DSC के VIP प्लान्स देख सकते हैं और ऑर्डर कर सकते हैं।"
                    } else if (isFreeContext) {
                        "यह Free Panel स्क्रीन है जहाँ रोज़ाना शेयर किए जाने वाले लॉगिन क्रेडेंशियल्स मिलते हैं।"
                    } else {
                        "आप अभी ${screenCtx.title} पर हैं। ${screenCtx.description}"
                    }
                }
                DetectedLanguage.HINGLISH -> {
                    if (isProductContext) {
                        "Aap Subscriptions & Plans screen par hain. Yahan official DSC VIP Plans (Streamer, Special, Sniper, Aimbot, Premium, Customised) available hain."
                    } else if (isFreeContext) {
                        "Aap Free Panel screen par hain. Yahan daily shared login credentials aur slot availability milegi."
                    } else {
                        "Aap abhi ${screenCtx.title} par hain. ${screenCtx.description}"
                    }
                }
            }
        }

        // J. VIP Plans, Prices & Duration Queries ("plans", "price", "pricing", "cost", "rate")
        if (isPlanOrPriceQuery(qLower)) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "Official DSC VIP Subscription Plans:\n1. STREAMER-PANEL — Starting at $10 (OBS Safe)\n2. SPECIAL-PANEL — Starting at $3 (EXCLUSIVE VIP)\n3. SNIPER-PANEL — Starting at $1 (Tactical Tier)\n4. AIM-ASSIST-PANEL — Starting at $1 (Precision Edition)\n5. PREMIUM-PANEL — Starting at $5 (Next Gen)\n6. CUSTOMISED-PANEL — Starting at $10 (Enterprise)\nDurations available: 3, 7, 15, 30, 60, 365 Days ($1 USD = 90 INR)."
                DetectedLanguage.HINDI_DEVANAGARI -> "DSC VIP प्लान्स:\n1. STREAMER-PANEL — $10 से शुरू\n2. SPECIAL-PANEL — $3 से शुरू (एक्सक्लूसिव VIP)\n3. SNIPER-PANEL — $1 से शुरू\n4. AIM-ASSIST-PANEL — $1 से शुरू\n5. PREMIUM-PANEL — $5 से शुरू\n6. CUSTOMISED-PANEL — $10 से शुरू"
                DetectedLanguage.HINGLISH -> "Official DSC VIP Plans:\n1. STREAMER-PANEL — Starting at $10\n2. SPECIAL-PANEL — Starting at $3 (EXCLUSIVE VIP)\n3. SNIPER-PANEL — Starting at $1\n4. AIM-ASSIST-PANEL — Starting at $1\n5. PREMIUM-PANEL — Starting at $5\n6. CUSTOMISED-PANEL — Starting at $10\nDuration options: 3, 7, 15, 30, 60, 365 Days ($1 USD = 90 INR)."
            }
        }

        // K. Free Panel Queries ("free panel", "free user", "free pass", "free slot")
        if (qLower.contains("free panel") || qLower.contains("free slot") || qLower.contains("free user") || qLower.contains("free pass") || qLower.contains("free credential")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "The Free Panel provides daily shared access credentials and slot availability updated in real-time. You can open the Free Panel screen to copy credentials."
                DetectedLanguage.HINDI_DEVANAGARI -> "Free Panel में रोज़ाना शेयर किए जाने वाले लॉगिन क्रेडेंशियल्स मिलते हैं। आप Free Panel स्क्रीन खोलकर यूजरनेम और पासवर्ड कॉपी कर सकते हैं।"
                DetectedLanguage.HINGLISH -> "Free Panel portal par daily shared access credentials available hote hain. Aap Free Panel screen khol kar active username aur password copy kar sakte hain."
            }
        }

        // L. Download & APK Queries ("download", "apk", "install", "app link")
        if (qLower.contains("download") || qLower.contains("apk") || qLower.contains("install") || qLower.contains("app link")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "Official client builds are available on the Downloads screen, synchronized directly with backend settings."
                DetectedLanguage.HINDI_DEVANAGARI -> "ऑफिशल क्लाइंट डाउनलोड्स स्क्रीन पर उपलब्ध है, जो सीधे बैकएंड सेटिंग्स से कनेक्टेड है।"
                DetectedLanguage.HINGLISH -> "Official DSC client build Downloads screen me available hai. Download link direct backend settings se synchronized hai."
            }
        }

        // M. User Account, Key & Expiry Queries ("mera plan", "my plan", "expiry", "license key", "change pass")
        if (qLower.contains("mera plan") || qLower.contains("my plan") || qLower.contains("expiry") || qLower.contains("license key") || qLower.contains("password")) {
            if (session != null) {
                return when (lang) {
                    DetectedLanguage.ENGLISH -> "Your session is active (${session.username}). Subscription details, expiry, and license keys are available in the User Portal."
                    DetectedLanguage.HINDI_DEVANAGARI -> "आपका सेशन एक्टिव है (${session.username})। सब्सक्रिप्शन और एक्सपायरी की डिटेल User Portal में उपलब्ध है।"
                    DetectedLanguage.HINGLISH -> "Aapka session active hai (${session.username}). Detailed subscription, expiry status, aur license key User Portal me available hai."
                }
            } else {
                return when (lang) {
                    DetectedLanguage.ENGLISH -> "Please sign in to view your active subscription and license key."
                    DetectedLanguage.HINDI_DEVANAGARI -> "अपना सब्सक्रिप्शन देखने के लिए कृपया साइन इन करें।"
                    DetectedLanguage.HINGLISH -> "Aapka active subscription aur license key check karne ke liye kripya pehle User Sign In karein."
                }
            }
        }

        // N. Owner & Admin Queries ("owner", "admin", "maintenance", "global userpass", "generate key")
        if (qLower.contains("owner") || qLower.contains("admin") || qLower.contains("maintenance") || qLower.contains("userpass") || qLower.contains("generate key")) {
            if (session?.isOwner == true) {
                return when (lang) {
                    DetectedLanguage.ENGLISH -> "Master Owner Access Granted! You can manage Global UserPass, download links, VIP key generator, free users, admin accounts, and global maintenance mode from the Owner Control Center."
                    DetectedLanguage.HINDI_DEVANAGARI -> "मास्टर ओनर एक्सेस उपलब्ध है! आप Owner Control Center से ग्लोबल सेटिंग्स, डाउनलोड लिंक्स, की-जनरेटर और मेंटेनेंस मोड मैनेज कर सकते हैं।"
                    DetectedLanguage.HINGLISH -> "Master Owner Access Granted! Aap Owner Control Center se Global UserPass, download links, VIP key generator, free users, admin accounts aur global maintenance mode manage kar sakte hain."
                }
            } else if (session?.role?.name == "Admin") {
                return when (lang) {
                    DetectedLanguage.ENGLISH -> "Staff Admin Access Active. You can manage subscribers, pending order approvals, and user bans from the Admin Dashboard."
                    DetectedLanguage.HINDI_DEVANAGARI -> "स्टाफ एडमिन एक्सेस एक्टिव है। आप Admin Dashboard से सब्सक्राइबर्स और ऑर्डर्स मैनेज कर सकते हैं।"
                    DetectedLanguage.HINGLISH -> "Staff Admin Access Active. Aap Admin Dashboard se subscriber list, order approvals aur user bans manage kar sakte hain."
                }
            } else {
                return when (lang) {
                    DetectedLanguage.ENGLISH -> "These controls require Owner or Admin privileges. Access the User Portal for subscriber features."
                    DetectedLanguage.HINDI_DEVANAGARI -> "ये कंट्रोल्स ओनर और एडमिन के लिए हैं। सब्सक्राइबर फीचर्स के लिए User Portal देखें।"
                    DetectedLanguage.HINGLISH -> "Yeh features Owner aur Admin control center ke liye reserved hain. VIP subscriber access ke liye User Portal check karein."
                }
            }
        }

        // O. Screen Location Queries ("main kahan hu", "current screen", "where am i")
        if (qLower.contains("main kahan") || qLower.contains("kahan hu") || qLower.contains("current screen") || qLower.contains("where am i") || qLower.contains("which screen")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "You are currently on ${screenCtx.title}. ${screenCtx.description}"
                DetectedLanguage.HINDI_DEVANAGARI -> "आप अभी ${screenCtx.title} पर हैं। ${screenCtx.description}"
                DetectedLanguage.HINGLISH -> "Aap abhi ${screenCtx.title} par hain. ${screenCtx.description}"
            }
        }

        // P. Smart Conversational Fallback (Matches Language & Never Echoes Preamble!)
        return generateSmartConversationalFallback(lang)
    }

    private fun tryEvaluateMath(qLower: String): String? {
        val clean = qLower.replace("what is", "")
            .replace("calculate", "")
            .replace("times", "*")
            .replace("x", "*")
            .replace("into", "*")
            .replace("plus", "+")
            .replace("minus", "-")
            .replace("divided by", "/")
            .replace("by", "/")
            .trim()

        val match = Regex("""^(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)\??$""").find(clean)
        if (match != null) {
            val num1 = match.groupValues[1].toDoubleOrNull() ?: return null
            val op = match.groupValues[2]
            val num2 = match.groupValues[3].toDoubleOrNull() ?: return null

            val res = when (op) {
                "+" -> num1 + num2
                "-" -> num1 - num2
                "*" -> num1 * num2
                "/" -> if (num2 != 0.0) num1 / num2 else return null
                else -> return null
            }

            val formattedRes = if (res % 1.0 == 0.0) res.toLong().toString() else res.toString()
            val formattedNum1 = if (num1 % 1.0 == 0.0) num1.toLong().toString() else num1.toString()
            val formattedNum2 = if (num2 % 1.0 == 0.0) num2.toLong().toString() else num2.toString()
            val symbol = if (op == "*") "×" else op

            return "$formattedNum1 $symbol $formattedNum2 = $formattedRes"
        }

        return null
    }

    private fun tryAnswerTrivia(qLower: String, lang: DetectedLanguage): String? {
        if (qLower.contains("capital of france") || qLower.contains("france ki capital") || qLower.contains("फ्रांस की राजधानी")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "The capital of France is Paris."
                DetectedLanguage.HINDI_DEVANAGARI -> "फ्रांस की राजधानी पेरिस है।"
                DetectedLanguage.HINGLISH -> "France ki capital Paris hai."
            }
        }
        if (qLower.contains("capital of india") || qLower.contains("india ki capital") || qLower.contains("भारत की राजधानी")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "The capital of India is New Delhi."
                DetectedLanguage.HINDI_DEVANAGARI -> "भारत की राजधानी नई दिल्ली है।"
                DetectedLanguage.HINGLISH -> "India ki capital New Delhi hai."
            }
        }
        if (qLower.contains("capital of usa") || qLower.contains("capital of america") || qLower.contains("america ki capital")) {
            return when (lang) {
                DetectedLanguage.ENGLISH -> "The capital of the United States is Washington, D.C."
                DetectedLanguage.HINDI_DEVANAGARI -> "अमेरिका की राजधानी वाशिंगटन, डी.सी. है।"
                DetectedLanguage.HINGLISH -> "America ki capital Washington, D.C. hai."
            }
        }
        return null
    }

    private fun isIdentityQuery(qLower: String): Boolean {
        return qLower.contains("what is your name") ||
                qLower.contains("whats your name") ||
                qLower.contains("what's your name") ||
                qLower.contains("who are you") ||
                qLower.contains("are you a real assistant") ||
                qLower.contains("tum kaun ho") ||
                qLower.contains("tum kaun") ||
                qLower.contains("kaun ho tum") ||
                qLower.contains("aap kaun ho") ||
                qLower.contains("aap kaun hain") ||
                qLower.contains("tumhara naam kya hai") ||
                qLower.contains("tumhara naam") ||
                qLower.contains("kya naam hai aapka") ||
                qLower.contains("kya naam hai tumhara") ||
                qLower.contains("kya naam hai") ||
                qLower.contains("naam kya hai") ||
                qLower.contains("hu r u") ||
                qLower.contains("who r u") ||
                qLower.contains("तुम्हारा नाम") ||
                qLower.contains("तुम कौन") ||
                qLower.contains("आप कौन")
    }

    private fun isCapabilitiesQuery(qLower: String): Boolean {
        return qLower.contains("what can you do") ||
                qLower.contains("how can you help") ||
                qLower.contains("what do you do") ||
                qLower.contains("tum kya kar sakti ho") ||
                qLower.contains("tum kya kya kar sakti ho") ||
                qLower.contains("tum kya kar sakti") ||
                qLower.contains("kya kar sakti ho") ||
                qLower.contains("kya kar sakti") ||
                qLower.contains("kya help kar sakti") ||
                qLower.contains("kya madad kar sakti") ||
                qLower.contains("tum meri kya madad") ||
                qLower.contains("tum meri help kaise") ||
                qLower.contains("tum meri madad kaise") ||
                qLower.contains("help me") ||
                qLower.contains("mujhe help chahiye") ||
                qLower.contains("kya kaam karti ho") ||
                qLower.contains("तुम क्या कर सकती हो") ||
                qLower.contains("क्या मदद") ||
                qLower.contains("क्या काम")
    }

    private fun isActivityQuery(qLower: String): Boolean {
        return qLower.contains("what are you doing") ||
                qLower.contains("what r u doing") ||
                qLower.contains("kya kar rahi ho") ||
                qLower.contains("kya kar rahe ho tum") ||
                qLower.contains("tum kya kar rahi ho") ||
                qLower.contains("abhi kya kar rahi ho") ||
                qLower.contains("kya kar rahi") ||
                qLower.contains("kya kar rahe ho") ||
                qLower.contains("क्या कर रही हो") ||
                qLower.contains("क्या कर रहे हो") ||
                qLower.contains("तुम क्या कर रही हो")
    }

    private fun isGreetingQuery(qLower: String): Boolean {
        return qLower in listOf("hi", "hello", "hey", "namaste", "good morning", "good evening", "hello aiora", "hi aiora", "hey aiora", "हेलो", "नमस्ते") ||
                qLower.contains("how are you") ||
                qLower.contains("kaise ho") ||
                qLower.contains("kaisi ho") ||
                qLower.contains("kya haal hai") ||
                qLower.contains("कैसी हो") ||
                qLower.contains("कैसे हो")
    }

    private fun isAcknowledgementQuery(qLower: String): Boolean {
        return qLower in listOf("thanks", "thank you", "dhanyawad", "shukriya", "okay", "ok", "fine", "accha", "acha", "thik hai", "great", "awesome", "धन्यवाद", "शुक्रिया", "ठीक है") ||
                qLower.contains("thanks aiora") ||
                qLower.contains("thank you aiora")
    }

    private fun isFollowUpQuery(qLower: String): Boolean {
        return qLower.contains("isme kya hai") ||
                qLower.contains("isme") ||
                qLower.contains("ye kya hai") ||
                qLower.contains("is screen par kya hai") ||
                qLower.contains("what is this") ||
                qLower.contains("explain this") ||
                qLower.contains("price kya hai") ||
                qLower.contains("yeh kya hai") ||
                qLower.contains("यह क्या है") ||
                qLower.contains("इसमें क्या है")
    }

    private fun isPlanOrPriceQuery(qLower: String): Boolean {
        return qLower.contains("plan") ||
                qLower.contains("plans") ||
                qLower.contains("price") ||
                qLower.contains("pricing") ||
                qLower.contains("cost") ||
                qLower.contains("rate") ||
                qLower.contains("daam") ||
                qLower.contains("kitne ka hai") ||
                qLower.contains("special plan") ||
                qLower.contains("streamer plan") ||
                qLower.contains("sniper plan") ||
                qLower.contains("aimbot plan") ||
                qLower.contains("premium plan") ||
                qLower.contains("customised plan")
    }

    private fun generateSmartConversationalFallback(
        lang: DetectedLanguage
    ): String {
        return when (lang) {
            DetectedLanguage.ENGLISH -> "I can help you navigate DSC, view VIP plans, check Free Panel credentials, or guide you through downloads. What would you like to do?"
            DetectedLanguage.HINDI_DEVANAGARI -> "मैं DSC ऐप में प्लान्स, फ्री पैनल, डाउनलोड्स या नेविगेशन में आपकी मदद कर सकती हूँ। आप क्या देखना चाहते हैं?"
            DetectedLanguage.HINGLISH -> "Main DSC plans, Free Panel credentials, downloads aur app navigation me aapki help kar sakti hoon. Batayein aap kya dekhna chahte hain?"
        }
    }

    private fun resolveActionIntent(qLower: String): String? {
        // Explicit Navigation and System Action commands only!
        return when {
            // Free Panel
            qLower.contains("free panel kholo") || qLower.contains("open free panel") || qLower.contains("show free panel") || qLower.contains("free panel screen") -> "OPEN_FREE_PANEL"

            // Products & Plans
            qLower.contains("plans kholo") || qLower.contains("products kholo") || qLower.contains("open plans") || qLower.contains("show plans") || qLower.contains("open products") || qLower.contains("vip plans kholo") -> "OPEN_PRODUCTS"

            // Apps
            qLower.contains("apps kholo") || qLower.contains("open apps") || qLower.contains("applications kholo") || qLower.contains("show apps") -> "OPEN_APPS"

            // Downloads
            qLower.contains("downloads kholo") || qLower.contains("open downloads") || qLower.contains("show downloads") || qLower.contains("apk download kholo") -> "OPEN_DOWNLOADS"

            // Home / Hub
            qLower.contains("home kholo") || qLower.contains("open home") || qLower.contains("home screen kholo") || qLower.contains("hub kholo") -> "OPEN_HOME"

            // Auth
            qLower.contains("login kholo") || qLower.contains("open login") || qLower.contains("sign in kholo") -> "OPEN_LOGIN"
            qLower.contains("register kholo") || qLower.contains("open register") || qLower.contains("registration kholo") -> "OPEN_REGISTER"

            // User Actions
            qLower.contains("copy key") || qLower.contains("key copy karo") || qLower.contains("license key copy") -> "USER_COPY_KEY"
            qLower.contains("change pass") || qLower.contains("password change") || qLower.contains("password badlo") -> "USER_CHANGE_PASS"
            qLower.contains("logout karo") || qLower.contains("sign out") || qLower.contains("logout my session") -> "USER_LOGOUT"

            // Admin / Staff
            qLower.contains("admin kholo") || qLower.contains("open admin") || qLower.contains("admin command kholo") -> "OPEN_ADMIN_DASHBOARD"

            // Owner
            qLower.contains("owner kholo") || qLower.contains("open owner") || qLower.contains("owner control center kholo") || qLower.contains("owner database kholo") -> "OPEN_OWNER_CENTER"
            qLower.contains("nayi key generate") || qLower.contains("key generate karo") -> "OWNER_CREATE_KEY"
            qLower.contains("toggle maintenance") || qLower.contains("maintenance mode toggle") -> "OWNER_TOGGLE_MAINTENANCE"

            else -> null
        }
    }
}
