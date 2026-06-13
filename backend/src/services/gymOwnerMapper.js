export function mapGymOwner(row) {
  return {
    id: row.id,
    gymName: row.gym_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    status: row.status,
    createdAt: row.created_at,
    accountType: "gym_owner",
  };
}
