/**
 * Generate a unique username from user details
 * Format: {first}.{last}.{email_prefix}{phone_suffix}[_{counter}]
 */

export const generateUniqueUsername = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  checkUsernameExists,
  maxAttempts = 100
) => {
  const sanitize = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9.]/g, '')
      .replace(/\.+/g, '.');
  };

  const first = sanitize(firstName || '');
  const last = sanitize(lastName || '');
  const emailPrefix = sanitize((email || '').split('@')[0] || '');
  const phoneSuffix = phoneNumber ? phoneNumber.slice(-4) : '';

  let base = [first, last, emailPrefix, phoneSuffix].filter(Boolean).join('.');
  base = base.substring(0, 25);

  if (!base) {
    base = 'user';
  }

  let username = base;
  let counter = 1;

  while (await checkUsernameExists(username)) {
    if (counter >= maxAttempts) {
      throw new Error('Unable to generate unique username after maximum attempts');
    }
    username = `${base}_${counter}`;
    counter++;
  }

  return username;
};
