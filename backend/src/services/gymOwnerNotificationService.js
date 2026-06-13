import { query } from "../db/pool.js";
import { sendWhatsappMessage } from "./whatsappService.js";

export async function notifyGymOwnerSignup(gymOwner) {
  const message = `New gym owner registered: ${gymOwner.gym_name} in ${gymOwner.city}. Contact: ${gymOwner.phone}, ${gymOwner.email}.`;
  await query(
    `INSERT INTO gym_owner_notifications (gym_owner_id, type, message, status, sent_at)
     VALUES ($1, 'gym_owner_signup', $2, 'sent', now())`,
    [gymOwner.id, message],
  );
  console.log(`[RS Fitness Admin Notification] ${message}`);

  // Send WhatsApp alert to the admin
  const whatsappMessage = `*RS Fitness Admin Alert*\n\nNew gym owner registered:\n- *Gym Name*: ${gymOwner.gym_name}\n- *City*: ${gymOwner.city}\n- *Phone*: ${gymOwner.phone}\n- *Email*: ${gymOwner.email}\n- *Status*: Pending Approval`;
  await sendWhatsappMessage(whatsappMessage);
}
