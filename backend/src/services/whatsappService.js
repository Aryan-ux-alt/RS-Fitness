import { env } from "../config/env.js";

export async function sendWhatsappMessage(message, toPhoneNumber = null) {
  const { twilioAccountSid, twilioAuthToken, twilioWhatsappFrom, adminWhatsappNumber, callmebotApiKey } = env;

  // Use provided phone number or fall back to admin number
  let to = (toPhoneNumber || adminWhatsappNumber || "+919023987904").trim();
  if (!to.startsWith("+")) {
    to = to.length === 10 ? `+91${to}` : `+${to}`;
  }

  // 1. Try CallMeBot first if the API key is configured (completely free)
  if (callmebotApiKey) {
    console.log(`[WhatsApp Service] Attempting to send message via CallMeBot to ${to}...`);
    const encodedMessage = encodeURIComponent(message);
    const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(to)}&text=${encodedMessage}&apikey=${callmebotApiKey}`;

    try {
      const response = await fetch(callmebotUrl);
      const text = await response.text();
      if (!response.ok) {
        console.error("[CallMeBot WhatsApp Service] Failed to send message:", text);
        // Do not return false yet; we might fall back to Twilio if those keys exist
      } else {
        console.log(`[CallMeBot WhatsApp Service] Message successfully dispatched: ${text}`);
        return true;
      }
    } catch (error) {
      console.error("[CallMeBot WhatsApp Service] Error sending message:", error);
      // Fall through to Twilio
    }
  }

  // 2. Fall back to Twilio WhatsApp API
  if (twilioAccountSid && twilioAuthToken) {
    console.log(`[WhatsApp Service] Attempting to send message via Twilio to ${to}...`);
    let from = (twilioWhatsappFrom || "+14155238886").trim();
    if (!from.startsWith("+")) {
      from = `+${from}`;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    const bodyParams = new URLSearchParams();
    bodyParams.append("To", `whatsapp:${to}`);
    bodyParams.append("From", `whatsapp:${from}`);
    bodyParams.append("Body", message);

    try {
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("[Twilio WhatsApp Service] Failed to send message:", data);
        return false;
      }

      console.log(`[Twilio WhatsApp Service] Message successfully sent to ${to}. SID: ${data.sid}`);
      return true;
    } catch (error) {
      console.error("[Twilio WhatsApp Service] Error sending message via Twilio:", error);
      return false;
    }
  }

  console.warn("[WhatsApp Service] No WhatsApp credentials configured (neither CALLMEBOT_API_KEY nor Twilio SID/Token in .env). Message logged to console.");
  console.log(`[Pending WhatsApp Notification] To: ${to}, Message: "${message}"`);
  return false;
}
