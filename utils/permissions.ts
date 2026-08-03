/**
 * Checks if a given record is editable by the user based on their role.
 * Supervisors can only edit data within 24 hours of its creation.
 * Owners and Admins have no time restriction.
 * 
 * @param user - The current logged-in user object
 * @param createdAt - The creation timestamp of the record (ISO string or Date)
 * @returns boolean - True if the record is editable
 */
export const canEditRecord = (user: any, createdAt: string | Date | undefined | null) => {
    if (!user) return false;

    const role = user.role?.toLowerCase();

    // Owner, Manager, and Admin can always edit
    if (['owner', 'manager', 'admin'].includes(role)) {
        return true;
    }

    // All other roles have a 24-hour restriction
    if (!createdAt) return true; // If no timestamp, allow editing (graceful fallback)

    const creationTime = new Date(createdAt).getTime();
    const now = Date.now();
    const diffInHours = (now - creationTime) / (1000 * 60 * 60);

    return diffInHours <= 24;
};
