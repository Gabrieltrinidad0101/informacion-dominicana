export const handle = async (c) => {
  try {
    return c.json(result.rows);
  } catch (err) {
    console.error('Error querying employees:', err);
    return c.text('Failed to fetch employees', 500);
  }
};
