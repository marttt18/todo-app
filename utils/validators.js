// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password) => {
    // At least 6 characters, can include letters, numbers, and common special characters
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/;
    return passwordRegex.test(password);
};

// Validate username format
export const isValidUsername = (username) => {
    // Alphanumeric characters, underscores, and hyphens only
    const usernameRegex = /^[A-Za-z0-9_-]{2,15}$/;
    return usernameRegex.test(username);
};
