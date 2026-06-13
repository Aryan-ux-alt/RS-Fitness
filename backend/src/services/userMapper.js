export function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    gymName: row.gym_name,
    joinedAt: row.created_at,
  };
}
