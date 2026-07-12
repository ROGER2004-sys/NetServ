export const sanitizeProfileUpdates = (updates = {}) => {
    const next = { ...updates };

    if (typeof next.displayName === 'string') {
        next.displayName = next.displayName.trim();
    }

    if (typeof next.email === 'string') {
        next.email = next.email.trim().toLowerCase();
    }

    if (typeof next.role === 'string') {
        next.role = next.role.trim();
    }

    if (typeof next.phone === 'string') {
        next.phone = next.phone.trim();
    }

    if (typeof next.department === 'string') {
        next.department = next.department.trim();
    }

    if (typeof next.bio === 'string') {
        next.bio = next.bio.trim();
    }

    return next;
};
