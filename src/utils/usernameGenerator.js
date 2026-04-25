/**
 * Generates a unique username from user details
 * Format: {first_name}.{last_name}.{email_prefix}{phone_suffix}[_{counter}]
 * 
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email address
 * @param {string} phoneNumber - User's phone number
 * @param {Function} checkUsernameExists - Async function that checks if username exists in DB
 * @param {number} maxAttempts - Maximum attempts to find unique username
 * @returns {Promise<string>} - Unique username
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
      .replace(/[^a-zA-Z0-9.]/g, '') // Keep alphanumeric and dots
      .replace(/\.+/g, '.'); // Collapse multiple dots
  };

  const first = sanitize(firstName || '');
  const last = sanitize(lastName || '');
  const emailPrefix = sanitize((email || '').split('@')[0] || '');
  const phoneSuffix = phoneNumber ? phoneNumber.slice(-4) : '';

  // Build base username
  let base = [first, last, emailPrefix, phoneSuffix].filter(Boolean).join('.');
  
  // Sanitize and limit length
  base = base.substring(0, 25);
  
  // Ensure we have something usable
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

/**
 * Formats a username for display (pretty print)
 * Converts: john.doe_1 → John.Doe_1
 */
export const formatUsername = (username) => {
  return username
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('.');
};
